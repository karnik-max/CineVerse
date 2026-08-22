import { useNavigate } from "react-router-dom";

import { formatMovieTitle } from "../utils/movieTitle";


function FeaturedMovie({ movie }) {

  const navigate = useNavigate();


  if (!movie) {
    return null;
  }


  const formatted =
    formatMovieTitle(
      movie.Movie_Name
    );


  const handleViewMovie = () => {

    if (
      movie.canonical_movie_id ===
      undefined ||
      movie.canonical_movie_id ===
      null
    ) {

      console.error(
        "Featured movie is missing canonical_movie_id."
      );

      return;
    }


    navigate(
      `/movie/${movie.canonical_movie_id}`
    );

  };


  return (

    <section className="featured-section">

      <div className="featured-content">

        <div className="featured-text">


          {/* FEATURED LABEL */}

          <div className="featured-label">
            FEATURED MOVIE
          </div>


          {/* TITLE */}

          <h1>
            {formatted.title}
          </h1>


          {/* META */}

          <div className="featured-meta">

            {formatted.year && (

              <span>
                {formatted.year}
              </span>

            )}


            {formatted.year &&
              movie.imdb_rating && (

                <span>
                  •
                </span>

            )}


            {movie.imdb_rating && (

              <span>
                ⭐ {movie.imdb_rating}
              </span>

            )}

          </div>


          {/* GENRES */}

          {movie.genres && (

            <div className="featured-genres">

              {movie.genres
                .split("|")
                .slice(0, 4)
                .join(" • ")}

            </div>

          )}


          {/* DIRECTOR */}

          {movie.director && (

            <p className="featured-director">

              Directed by{" "}
              {movie.director}

            </p>

          )}


          {/* VIEW MOVIE */}

          <button
            type="button"

            className="featured-button"

            onClick={
              handleViewMovie
            }
          >
            View Movie
          </button>


        </div>

      </div>

    </section>

  );

}


export default FeaturedMovie;