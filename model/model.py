from pathlib import Path
import re
import unicodedata

import joblib
import pandas as pd
from scipy.sparse import load_npz


# ==================================================
# Paths
# ==================================================

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"


# ==================================================
# Load trained model and data
# ==================================================

model = joblib.load(
    ARTIFACT_DIR / "movie_model.pkl"
)

movie_encoder = joblib.load(
    ARTIFACT_DIR / "movie_encoder.pkl"
)

rating_matrix = load_npz(
    ARTIFACT_DIR / "rating_matrix.npz"
)

movie_master = pd.read_csv(
    ARTIFACT_DIR / "movie_master.csv"
)


# ==================================================
# Normalize movie titles
# ==================================================

def normalize_user_title(title):
    """
    Normalize a movie title for flexible matching.

    Examples:

    Toy Story (1995)
        -> toy story 1995

    TOY-STORY
        -> toy story

    ToyStory
        -> toystory
    """

    title = str(title).lower().strip()

    # Remove accents
    title = unicodedata.normalize(
        "NFKD",
        title
    )

    title = "".join(
        char
        for char in title
        if not unicodedata.combining(char)
    )

    # Replace punctuation with spaces
    title = re.sub(
        r"[^a-z0-9]+",
        " ",
        title
    )

    # Remove extra spaces
    title = re.sub(
        r"\s+",
        " ",
        title
    ).strip()

    return title


# ==================================================
# Compact title normalization
# ==================================================

def normalize_compact_title(title):
    """
    Remove spaces after normalization.

    Examples:

    Toy Story
        -> toystory

    Toy-Story
        -> toystory

    ToyStory
        -> toystory
    """

    return normalize_user_title(title).replace(
        " ",
        ""
    )


# ==================================================
# Build flexible movie lookup
# ==================================================

movie_lookup = {}

for movie in movie_encoder.classes_:

    normalized = normalize_user_title(movie)

    compact = normalize_compact_title(movie)

    movie_lookup.setdefault(
        normalized,
        []
    ).append(movie)

    movie_lookup.setdefault(
        compact,
        []
    ).append(movie)


# ==================================================
# Resolve movie input
# ==================================================

def resolve_movie(movie_name):
    """
    Resolve flexible user input to an exact model movie.

    Examples:

        Toy Story (1995)
        Toy Story
        toy story
        TOY STORY
        ToyStory
        toy-story
        Toy Story 1995

    If multiple movies match, return None
    rather than selecting the wrong movie.
    """

    normalized = normalize_user_title(
        movie_name
    )

    compact = normalize_compact_title(
        movie_name
    )

    # --------------------------------------------------
    # First: exact normalized match
    # --------------------------------------------------

    matches = movie_lookup.get(
        normalized,
        []
    )

    if len(matches) == 1:
        return matches[0]

    # --------------------------------------------------
    # Second: compact match
    # --------------------------------------------------

    matches = movie_lookup.get(
        compact,
        []
    )

    if len(matches) == 1:
        return matches[0]

    # --------------------------------------------------
    # Extract year from user input
    # --------------------------------------------------

    year_match = re.search(
        r"\b(19|20)\d{2}\b",
        normalized
    )

    requested_year = None

    if year_match:
        requested_year = int(
            year_match.group()
        )

    # --------------------------------------------------
    # Remove year from user input
    # --------------------------------------------------

    title_without_year = re.sub(
        r"\b(19|20)\d{2}\b",
        "",
        normalized
    ).strip()

    title_without_year = re.sub(
        r"\s+",
        " ",
        title_without_year
    )

    compact_without_year = title_without_year.replace(
        " ",
        ""
    )

    # --------------------------------------------------
    # Search model movies
    # --------------------------------------------------

    possible_matches = []

    for movie in movie_encoder.classes_:

        movie_normalized = normalize_user_title(
            movie
        )

        # Extract movie year
        movie_year_match = re.search(
            r"\b(19|20)\d{2}\b",
            movie_normalized
        )

        movie_year = None

        if movie_year_match:
            movie_year = int(
                movie_year_match.group()
            )

        # Remove year from movie title
        movie_title = re.sub(
            r"\b(19|20)\d{2}\b",
            "",
            movie_normalized
        ).strip()

        movie_compact = movie_title.replace(
            " ",
            ""
        )

        # Compare titles
        if movie_compact == compact_without_year:

            # User did not provide a year
            if requested_year is None:
                possible_matches.append(movie)

            # User provided a year
            elif movie_year == requested_year:
                possible_matches.append(movie)

    # --------------------------------------------------
    # Return only when unambiguous
    # --------------------------------------------------

    if len(possible_matches) == 1:
        return possible_matches[0]

    return None


# ==================================================
# Recommendation function
# ==================================================

def get_recommendations(
    movie_name,
    n_recommendations=10
):

    # --------------------------------------------------
    # Resolve user movie input
    # --------------------------------------------------

    matched_movie = resolve_movie(
        movie_name
    )

    if matched_movie is None:
        return None

    # --------------------------------------------------
    # Convert movie → model index
    # --------------------------------------------------

    movie_index = movie_encoder.transform(
        [matched_movie]
    )[0]

    # --------------------------------------------------
    # Get nearest movies
    # --------------------------------------------------

    distances, indices = model.kneighbors(
        rating_matrix.T[movie_index],
        n_neighbors=n_recommendations + 1
    )

    recommendations = []

    for distance, index in zip(
        distances[0][1:],
        indices[0][1:]
    ):

        recommended_movie = (
            movie_encoder.inverse_transform(
                [index]
            )[0]
        )

        similarity = 1 - distance

        recommendations.append({
            "Movie_Name": recommended_movie,
            "Similarity": round(
                float(similarity),
                6
            )
        })

    recommendations_df = pd.DataFrame(
        recommendations
    )

    # ==================================================
    # Add Movie Master information
    # ==================================================

    recommendations_df = recommendations_df.merge(
        movie_master,
        on="Movie_Name",
        how="left"
    )

    # ==================================================
    # Keep only application fields
    # ==================================================

    output_columns = [
        "canonical_movie_id",
        "Movie_Name",
        "Similarity",
        "year",
        "genres",
        "imdb_rating",
        "director",
        "actor_1",
        "actor_2",
        "actor_3",
        "tmdb_id",
        "metadata_status"
    ]

    # Only keep columns that actually exist
    output_columns = [
        column
        for column in output_columns
        if column in recommendations_df.columns
    ]

    recommendations_df = recommendations_df[
        output_columns
    ]

    return recommendations_df


# ==================================================
# Test
# ==================================================

if __name__ == "__main__":

    test_movies = [
        "Toy Story (1995)",
        "Toy Story",
        "toy story",
        "TOY STORY",
        "ToyStory",
        "toy-story",
        "Toy Story 1995",
        "Back to the Future",
        "This Movie Does Not Exist"
    ]

    for movie in test_movies:

        print("\n" + "=" * 60)

        print(
            "INPUT:",
            movie
        )

        # Show what the resolver found
        matched = resolve_movie(
            movie
        )

        print(
            "MATCHED MOVIE:",
            matched
        )

        # Generate recommendations
        result = get_recommendations(
            movie,
            5
        )

        if result is None:

            print(
                "Movie not found or ambiguous."
            )

        else:

            print(
                "Recommendations generated successfully."
            )

            print(
                result[
                    [
                        "Movie_Name",
                        "Similarity"
                    ]
                ].to_string(
                    index=False
                )
            )