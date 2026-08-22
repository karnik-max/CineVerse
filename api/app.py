from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import os
import requests
import json

from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

from .database import (
    initialize_database,
    create_user_if_not_exists,
    save_rating,
    get_user_rating,
    get_user_ratings
)

from model.model import (
    get_recommendations,
    movie_master
)


# ==========================================================
# PROJECT PATHS / ENVIRONMENT
# ==========================================================

# Project root:
#
# ml projects/
#     api/
#     data/
#     model/
#     frontend/
#     .env

BASE_DIR = (
    Path(__file__).resolve().parent.parent
)


# Load:
# ml projects/.env

load_dotenv(
    BASE_DIR / ".env"
)


# ==========================================================
# TMDB CONFIGURATION
# ==========================================================

TMDB_API_TOKEN = os.getenv(
    "TMDB_API_TOKEN"
)

TMDB_API_BASE = (
    "https://api.themoviedb.org/3"
)

TMDB_IMAGE_BASE = (
    "https://image.tmdb.org/t/p"
)


# ==========================================================
# TMDB CACHE
# ==========================================================

CACHE_DIR = BASE_DIR / "data"

CACHE_DIR.mkdir(
    parents=True,
    exist_ok=True
)

TMDB_CACHE_FILE = (
    CACHE_DIR / "tmdb_cache.json"
)


def load_tmdb_cache():
    """
    Load previously fetched TMDB data.
    """

    if not TMDB_CACHE_FILE.exists():
        return {}

    try:

        with open(
            TMDB_CACHE_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

            if isinstance(data, dict):
                return data

    except (
        json.JSONDecodeError,
        OSError
    ):

        print(
            "Warning: Could not read TMDB cache."
        )

    return {}


TMDB_CACHE = (
    load_tmdb_cache()
)


def save_tmdb_cache():
    """
    Save TMDB data locally so that we don't
    repeatedly request the same movie.
    """

    try:

        with open(
            TMDB_CACHE_FILE,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                TMDB_CACHE,
                file,
                indent=2,
                ensure_ascii=False
            )

    except OSError as error:

        print(
            "Warning: Could not save "
            f"TMDB cache: {error}"
        )


# ==========================================================
# TMDB MOVIE DATA
# ==========================================================

def get_tmdb_movie_data(tmdb_id):
    """
    Fetch poster, backdrop, overview and title
    from TMDB.

    Results are cached locally.
    """

    # ------------------------------------------------------
    # Missing ID
    # ------------------------------------------------------

    if tmdb_id is None:

        return {
            "poster_url": None,
            "backdrop_url": None,
            "overview": None,
            "tmdb_title": None
        }


    # ------------------------------------------------------
    # NaN
    # ------------------------------------------------------

    try:

        if pd.isna(tmdb_id):

            return {
                "poster_url": None,
                "backdrop_url": None,
                "overview": None,
                "tmdb_title": None
            }

    except TypeError:
        pass


    # ------------------------------------------------------
    # Convert ID
    # ------------------------------------------------------

    try:

        tmdb_id = int(
            float(tmdb_id)
        )

    except (
        ValueError,
        TypeError
    ):

        return {
            "poster_url": None,
            "backdrop_url": None,
            "overview": None,
            "tmdb_title": None
        }


    cache_key = str(
        tmdb_id
    )


        # ------------------------------------------------------
        # Cached?
        # ------------------------------------------------------

    cached = TMDB_CACHE.get(
        cache_key
    )


    # Only use the cache immediately when it contains
    # usable movie metadata.
    #
    # A trailer-only cache entry, or an entry whose poster/title
    # is missing, must be refreshed from TMDB.

    if isinstance(
        cached,
        dict
    ):

        has_usable_metadata = (
            "poster_url" in cached
            and "backdrop_url" in cached
            and "overview" in cached
            and "tmdb_title" in cached
            and cached.get("poster_url")
            and cached.get("tmdb_title")
        )

        if has_usable_metadata:

            return cached


    # ------------------------------------------------------
    # Token check
    # ------------------------------------------------------

    if not TMDB_API_TOKEN:

        print(
            "Warning: TMDB_API_TOKEN "
            "not found in .env"
        )

        return {
            "poster_url": None,
            "backdrop_url": None,
            "overview": None,
            "tmdb_title": None
        }


    # ------------------------------------------------------
    # TMDB request
    # ------------------------------------------------------

    url = (
        f"{TMDB_API_BASE}/movie/"
        f"{tmdb_id}"
    )


    headers = {
        "accept": "application/json",
        "Authorization":
            f"Bearer {TMDB_API_TOKEN}"
    }


    try:

        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )


        if response.status_code != 200:

            print(
                "TMDB request failed for "
                f"{tmdb_id}: "
                f"{response.status_code}"
            )

            return {
                "poster_url": None,
                "backdrop_url": None,
                "overview": None,
                "tmdb_title": None
            }


        data = response.json()


        poster_path = data.get(
            "poster_path"
        )

        backdrop_path = data.get(
            "backdrop_path"
        )

        overview = data.get(
            "overview"
        )

        tmdb_title = data.get(
            "title"
        )


        result = {

            "poster_url": (
                f"{TMDB_IMAGE_BASE}"
                f"/w500"
                f"{poster_path}"
                if poster_path
                else None
            ),

            "backdrop_url": (
                f"{TMDB_IMAGE_BASE}"
                f"/w1280"
                f"{backdrop_path}"
                if backdrop_path
                else None
            ),

            "overview": overview,

            "tmdb_title": tmdb_title
        }


        # Preserve an already cached trailer URL.
        # Metadata refreshes must not delete trailer data.

        if isinstance(
            TMDB_CACHE.get(
                cache_key
            ),
            dict
        ):

            existing_trailer = (
                TMDB_CACHE[
                    cache_key
                ].get(
                    "trailer_url"
                )
            )

            if existing_trailer:

                result["trailer_url"] = (
                    existing_trailer
                )


        # Save complete metadata to cache.

        TMDB_CACHE[
            cache_key
        ] = result

        save_tmdb_cache()


        return result


    except requests.RequestException as error:

        print(
            "TMDB connection error for "
            f"{tmdb_id}: {error}"
        )

        return {
            "poster_url": None,
            "backdrop_url": None,
            "overview": None,
            "tmdb_title": None
        }


# ==========================================================
# TMDB TRAILER
# ==========================================================

def get_tmdb_trailer(tmdb_id):
    """
    Find the best YouTube trailer for a movie.

    Priority:
    1. Official YouTube Trailer
    2. YouTube Trailer
    3. YouTube Teaser
    4. Any YouTube video
    """

    # ------------------------------------------------------
    # Missing ID
    # ------------------------------------------------------

    if tmdb_id is None:
        return None


    # ------------------------------------------------------
    # NaN
    # ------------------------------------------------------

    try:

        if pd.isna(tmdb_id):
            return None

    except TypeError:
        pass


    # ------------------------------------------------------
    # Convert ID
    # ------------------------------------------------------

    try:

        tmdb_id = int(
            float(tmdb_id)
        )

    except (
        ValueError,
        TypeError
    ):

        return None


    cache_key = str(
        tmdb_id
    )


    # ------------------------------------------------------
    # Check cache
    # ------------------------------------------------------

    cached = TMDB_CACHE.get(
        cache_key
    )


    if isinstance(
        cached,
        dict
    ):

        if (
            "trailer_url"
            in cached
        ):

            return cached[
                "trailer_url"
            ]


    # ------------------------------------------------------
    # Token check
    # ------------------------------------------------------

    if not TMDB_API_TOKEN:

        print(
            "Warning: TMDB_API_TOKEN "
            "not found in .env"
        )

        return None


    # ------------------------------------------------------
    # TMDB videos endpoint
    # ------------------------------------------------------

    url = (
        f"{TMDB_API_BASE}/movie/"
        f"{tmdb_id}/videos"
    )


    headers = {
        "accept": "application/json",
        "Authorization":
            f"Bearer {TMDB_API_TOKEN}"
    }


    try:

        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )


        if response.status_code != 200:

            print(
                "TMDB trailer request failed "
                f"for {tmdb_id}: "
                f"{response.status_code}"
            )

            return None


        data = response.json()


        videos = data.get(
            "results",
            []
        )


        # --------------------------------------------------
        # Only YouTube videos
        # --------------------------------------------------

        youtube_videos = [

            video

            for video in videos

            if video.get("site")
            == "YouTube"

            and video.get("key")

        ]


        trailer_url = None


        if youtube_videos:

            # ----------------------------------------------
            # Official trailers
            # ----------------------------------------------

            official_trailers = [

                video

                for video
                in youtube_videos

                if (
                    video.get(
                        "official"
                    )
                    is True
                )

                and (
                    video.get(
                        "type"
                    )
                    == "Trailer"
                )

            ]


            # ----------------------------------------------
            # Normal trailers
            # ----------------------------------------------

            trailers = [

                video

                for video
                in youtube_videos

                if video.get(
                    "type"
                ) == "Trailer"

            ]


            # ----------------------------------------------
            # Teasers
            # ----------------------------------------------

            teasers = [

                video

                for video
                in youtube_videos

                if video.get(
                    "type"
                ) == "Teaser"

            ]


            # ----------------------------------------------
            # Select video
            # ----------------------------------------------

            if official_trailers:

                selected_video = (
                    official_trailers[0]
                )

            elif trailers:

                selected_video = (
                    trailers[0]
                )

            elif teasers:

                selected_video = (
                    teasers[0]
                )

            else:

                selected_video = (
                    youtube_videos[0]
                )


            video_key = (
                selected_video.get(
                    "key"
                )
            )


            # ----------------------------------------------
            # YouTube embed URL
            # ----------------------------------------------

            if video_key:

                trailer_url = ("https://www.youtube.com/embed/"
                f"{video_key}"
                "?autoplay=1"
                "&mute=1"
                "&controls=1"
                "&playsinline=1"
                "&rel=0"
                "&modestbranding=1"
)


        # --------------------------------------------------
        # Save trailer to cache
        # --------------------------------------------------

        if cache_key not in TMDB_CACHE:

            TMDB_CACHE[
                cache_key
            ] = {}


        if isinstance(
            TMDB_CACHE[
                cache_key
            ],
            dict
        ):

            TMDB_CACHE[
                cache_key
            ][
                "trailer_url"
            ] = trailer_url


        save_tmdb_cache()


        return trailer_url


    except requests.RequestException as error:

        print(
            "TMDB trailer connection error "
            f"for {tmdb_id}: {error}"
        )

        return None


# ==========================================================
# FLASK APPLICATION
# ==========================================================

app = Flask(
    __name__
)

CORS(app)


# ==========================================================
# INITIALIZE LOCAL DATABASE
# ==========================================================

initialize_database()


# ==========================================================
# LOAD MOVIE MASTER
# ==========================================================

movies = (
    movie_master.copy()
)


movies = (
    movies
    .astype(object)
    .where(
        pd.notna(movies),
        None
    )
)


# ==========================================================
# TMDB DATAFRAME ENRICHMENT
# ==========================================================

def add_tmdb_metadata(df):
    """
    Add TMDB poster/backdrop/overview information.

    Every result is normalized so that a missing TMDB
    field cannot crash the API.
    """

    if df.empty:

        df["poster_url"] = []
        df["backdrop_url"] = []
        df["overview"] = []
        df["tmdb_title"] = []

        return df


    # ------------------------------------------------------
    # Default result
    # ------------------------------------------------------

    empty_result = {
        "poster_url": None,
        "backdrop_url": None,
        "overview": None,
        "tmdb_title": None
    }


    results = [
        None
    ] * len(df)


    # ------------------------------------------------------
    # Fetch TMDB data in parallel
    # ------------------------------------------------------

    with ThreadPoolExecutor(
        max_workers=5
    ) as executor:

        future_map = {

            executor.submit(
                get_tmdb_movie_data,
                tmdb_id
            ): index

            for index, tmdb_id
            in enumerate(
                df["tmdb_id"]
            )

        }


        for future in as_completed(
            future_map
        ):

            index = future_map[
                future
            ]


            try:

                result = future.result()


                # Make sure the TMDB result is a dict
                if not isinstance(
                    result,
                    dict
                ):

                    result = {}


                # Normalize missing keys
                results[index] = {

                    "poster_url":
                        result.get(
                            "poster_url"
                        ),

                    "backdrop_url":
                        result.get(
                            "backdrop_url"
                        ),

                    "overview":
                        result.get(
                            "overview"
                        ),

                    "tmdb_title":
                        result.get(
                            "tmdb_title"
                        )

                }


            except Exception as error:

                print(
                    "TMDB enrichment error:",
                    error
                )

                results[index] = (
                    empty_result.copy()
                )


    # ------------------------------------------------------
    # Add columns safely
    # ------------------------------------------------------

    df["poster_url"] = [

        (
            result or empty_result
        ).get(
            "poster_url"
        )

        for result in results

    ]


    df["backdrop_url"] = [

        (
            result or empty_result
        ).get(
            "backdrop_url"
        )

        for result in results

    ]


    df["overview"] = [

        (
            result or empty_result
        ).get(
            "overview"
        )

        for result in results

    ]


    df["tmdb_title"] = [

        (
            result or empty_result
        ).get(
            "tmdb_title"
        )

        for result in results

    ]


    return df


# ==========================================================
# GET MOVIES
# ==========================================================

@app.route(
    "/api/movies",
    methods=["GET"]
)
def get_movies():

    df = movies.copy()


    # ------------------------------------------------------
    # SEARCH
    # ------------------------------------------------------

    search = request.args.get(
        "search",
        ""
    ).strip().lower()


    if search:

        df = df[
            df["Movie_Name"]
            .astype(str)
            .str.lower()
            .str.contains(
                search,
                regex=False,
                na=False
            )
        ]


    # ------------------------------------------------------
    # GENRE
    # ------------------------------------------------------

    genre = request.args.get(
        "genre",
        ""
    ).strip().lower()


    if (
        genre
        and genre != "all"
    ):

        df = df[
            df["genres"]
            .astype(str)
            .str.lower()
            .str.contains(
                genre,
                regex=False,
                na=False
            )
        ]


    # ------------------------------------------------------
# SORT / RANDOM
# ------------------------------------------------------

    random_mode = (
        request.args.get(
            "random",
            ""
        ).strip().lower()
        == "true"
    )


    if random_mode:

        # Randomize the COMPLETE filtered dataset
        # before applying the limit.
        #
        # This is important for Explore because it
        # allows lower-rated movies to appear too.

        df = df.sample(
            frac=1,
            random_state=None
        ).reset_index(
            drop=True
        )


    elif "imdb_rating" in df.columns:

        # Normal behaviour:
        # highest rated movies first.

        df = df.sort_values(
            "imdb_rating",
            ascending=False,
            na_position="last"
        )


    # ------------------------------------------------------
    # LIMIT
    # ------------------------------------------------------

    try:

        limit = int(
            request.args.get(
                "limit",
                40
            )
        )

    except ValueError:

        limit = 40


    limit = max(
        1,
        min(
            limit,
            200
        )
    )


    df = df.head(
        limit
    )


    # ------------------------------------------------------
    # REMOVE DUPLICATE MOVIE RECORDS
    # ------------------------------------------------------

    if (
        "canonical_movie_id"
        in df.columns
    ):

        df = df.drop_duplicates(
            subset=[
                "canonical_movie_id"
            ]
        )


    # ------------------------------------------------------
    # FRONTEND FIELDS
    # ------------------------------------------------------

    output_columns = [

        "canonical_movie_id",

        "Movie_Name",

        "year",

        "genres",

        "imdb_rating",

        "director",

        "actor_1",

        "actor_2",

        "actor_3",

        "tmdb_id",

        "imdb_link",

        "metadata_status"

    ]


    output_columns = [

        column

        for column
        in output_columns

        if column
        in df.columns

    ]


    df = df[
        output_columns
    ].copy()


    # ------------------------------------------------------
    # TMDB
    # ------------------------------------------------------

    if "tmdb_id" in df.columns:

        df = add_tmdb_metadata(
            df
        )

    else:

        df["poster_url"] = None

        df["backdrop_url"] = None

        df["overview"] = None

        df["tmdb_title"] = None


    # ------------------------------------------------------
    # TMDB LINK
    # ------------------------------------------------------

    if "tmdb_id" in df.columns:

        df["tmdb_url"] = (

            df["tmdb_id"]
            .apply(

                lambda x:

                (
                    "https://www.themoviedb.org/movie/"
                    f"{int(x)}"
                )

                if (
                    x is not None
                    and pd.notna(x)
                )

                else None

            )

        )


    # ------------------------------------------------------
    # IMDb LINK
    # ------------------------------------------------------

    if "imdb_link" in df.columns:

        df["imdb_url"] = (
            df["imdb_link"]
        )


    # ------------------------------------------------------
    # Clean NaN
    # ------------------------------------------------------

    df = (
        df
        .astype(object)
        .where(
            pd.notna(df),
            None
        )
    )


    return jsonify(
        df.to_dict(
            orient="records"
        )
    )


# ==========================================================
# GET AVAILABLE GENRES
# ==========================================================

@app.route(
    "/api/genres",
    methods=["GET"]
)
def get_genres():

    genres = set()


    for value in (
        movies["genres"]
        .dropna()
    ):

        for genre in str(
            value
        ).split("|"):

            genre = genre.strip()


            if genre:

                genres.add(
                    genre
                )


    return jsonify(
        sorted(
            genres
        )
    )


# ==========================================================
# GET SINGLE MOVIE
# ==========================================================

@app.route(
    "/api/movie/<int:movie_id>",
    methods=["GET"]
)
def get_movie(movie_id):

    result = movies[
        movies[
            "canonical_movie_id"
        ]
        == movie_id
    ]


    if result.empty:

        return jsonify({
            "error":
                "Movie not found."
        }), 404


    movie = (
        result
        .iloc[0]
        .to_dict()
    )


    # ------------------------------------------------------
    # TMDB metadata
    # ------------------------------------------------------

    tmdb_id = movie.get(
        "tmdb_id"
    )


    tmdb_data = (
        get_tmdb_movie_data(
            tmdb_id
        )
    )


    movie["poster_url"] = (
        tmdb_data[
            "poster_url"
        ]
    )

    movie["backdrop_url"] = (
        tmdb_data[
            "backdrop_url"
        ]
    )

    movie["overview"] = (
        tmdb_data[
            "overview"
        ]
    )

    movie["tmdb_title"] = (
        tmdb_data[
            "tmdb_title"
        ]
    )


    # ------------------------------------------------------
    # TMDB URL
    # ------------------------------------------------------

    if (
        tmdb_id is not None
        and pd.notna(tmdb_id)
    ):

        movie["tmdb_url"] = (

            "https://www.themoviedb.org/movie/"
            f"{int(tmdb_id)}"

        )

    else:

        movie["tmdb_url"] = None


    # ------------------------------------------------------
    # IMDb URL
    # ------------------------------------------------------

    movie["imdb_url"] = (
        movie.get(
            "imdb_link"
        )
    )


    # ------------------------------------------------------
    # Clean NaN
    # ------------------------------------------------------

    movie = {

        key: (

            None

            if pd.isna(value)

            else value

        )

        for key, value
        in movie.items()

    }


    return jsonify(
        movie
    )


# ==========================================================
# GET MOVIE TRAILER
# ==========================================================

@app.route(
    "/api/movie/<int:movie_id>/trailer",
    methods=["GET"]
)
def get_movie_trailer(
    movie_id
):

    result = movies[
        movies[
            "canonical_movie_id"
        ]
        == movie_id
    ]


    if result.empty:

        return jsonify({
            "error":
                "Movie not found."
        }), 404


    movie = (
        result
        .iloc[0]
        .to_dict()
    )


    tmdb_id = movie.get(
        "tmdb_id"
    )


    trailer_url = (
        get_tmdb_trailer(
            tmdb_id
        )
    )


    return jsonify({

        "canonical_movie_id":
            movie_id,

        "tmdb_id":
            (
                int(tmdb_id)
                if (
                    tmdb_id is not None
                    and pd.notna(tmdb_id)
                )
                else None
            ),

        "trailer_url":
            trailer_url

    })


# ==========================================================
# RECOMMENDATIONS
# ==========================================================

@app.route(
    "/api/recommend",
    methods=["GET"]
)
def recommend():

    movie_name = request.args.get(
        "movie",
        ""
    ).strip()


    if not movie_name:

        return jsonify({
            "error":
                "Movie name is required."
        }), 400


    recommendations = (
        get_recommendations(
            movie_name,
            10
        )
    )


    if recommendations is None:

        return jsonify({
            "error":
                "Movie not found in recommendation model."
        }), 404


    recommendations = (
        recommendations
        .astype(object)
        .where(
            pd.notna(
                recommendations
            ),
            None
        )
    )


    return jsonify(
        recommendations.to_dict(
            orient="records"
        )
    )


# ==========================================================
# USER RATING — SAVE / UPDATE
# ==========================================================

@app.route(
    "/api/rating",
    methods=["POST"]
)
def rate_movie():

    data = request.get_json(
        silent=True
    )


    if not data:

        return jsonify({
            "error":
                "Request body is required."
        }), 400


    user_id = data.get(
        "user_id"
    )

    movie_id = data.get(
        "canonical_movie_id"
    )

    rating = data.get(
        "rating"
    )


    # ------------------------------------------------------
    # Validate user
    # ------------------------------------------------------

    if not user_id:

        return jsonify({
            "error":
                "user_id is required."
        }), 400


    # ------------------------------------------------------
    # Validate movie
    # ------------------------------------------------------

    if movie_id is None:

        return jsonify({
            "error":
                "canonical_movie_id "
                "is required."
        }), 400


    # ------------------------------------------------------
    # Validate rating
    # ------------------------------------------------------

    try:

        movie_id = int(
            movie_id
        )

        rating = int(
            rating
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "error":
                "Movie ID and rating "
                "must be numeric."
        }), 400


    if (
        rating < 1
        or rating > 5
    ):

        return jsonify({
            "error":
                "Rating must be between 1 and 5."
        }), 400


    # ------------------------------------------------------
    # Create user
    # ------------------------------------------------------

    create_user_if_not_exists(
        user_id
    )


    # ------------------------------------------------------
    # Save rating
    # ------------------------------------------------------

    save_rating(
        user_id,
        movie_id,
        rating
    )


    return jsonify({

        "message":
            "Rating saved successfully.",

        "user_id":
            user_id,

        "canonical_movie_id":
            movie_id,

        "rating":
            rating

    })


# ==========================================================
# USER RATING — GET ONE
# ==========================================================

@app.route(
    "/api/rating",
    methods=["GET"]
)
def get_rating():

    user_id = request.args.get(
        "user_id"
    )

    movie_id = request.args.get(
        "movie_id"
    )


    if not user_id:

        return jsonify({
            "error":
                "user_id is required."
        }), 400


    if not movie_id:

        return jsonify({
            "error":
                "movie_id is required."
        }), 400


    try:

        movie_id = int(
            movie_id
        )

    except ValueError:

        return jsonify({
            "error":
                "movie_id must be numeric."
        }), 400


    rating = get_user_rating(
        user_id,
        movie_id
    )


    return jsonify({

        "user_id":
            user_id,

        "canonical_movie_id":
            movie_id,

        "rating":
            rating

    })


# ==========================================================
# USER RATINGS — GET ALL
# ==========================================================

@app.route(
    "/api/ratings/<user_id>",
    methods=["GET"]
)
def get_ratings_for_user(
    user_id
):

    if not user_id:

        return jsonify({
            "error":
                "user_id is required."
        }), 400


    create_user_if_not_exists(
        user_id
    )


    ratings = get_user_ratings(
        user_id
    )


    return jsonify({

        "user_id":
            user_id,

        "ratings":
            ratings

    })


# ==========================================================
# RUN SERVER
# ==========================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )