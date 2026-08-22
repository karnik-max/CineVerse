import { formatMovieTitle } from "../utils/movieTitle";

function ShuffleCards({
  movies,
  onShuffle
}) {

  if (
    !movies ||
    movies.length === 0
  ) {
    return null;
  }


  return (
    <div className="shuffle-area">

      {/* LEFT ARROW */}

      <button
        type="button"
        className="shuffle-arrow shuffle-left"
        onClick={() =>
          onShuffle("left")
        }
        aria-label="Previous featured movie"
      >
        ‹
      </button>


      {/* CARD STACK */}

      <div className="shuffle-stack">

        {movies
          .slice(0, 4)
          .map((movie, index) => {

            const formatted =
              formatMovieTitle(
                movie.Movie_Name
              );

            return (

              <div
                key={`${movie.canonical_movie_id}-${index}`}
                className={
                  `shuffle-card position-${index}`
                }
              >

                <div className="shuffle-poster">

                  {movie.poster_url ? (

                    <img
                      src={movie.poster_url}
                      alt={formatted.title}
                      loading="lazy"
                    />

                  ) : (

                    <div className="shuffle-fallback">
                      🎬
                    </div>

                  )}

                </div>


                <div className="shuffle-card-info">

                  <div className="shuffle-rating">

                    {movie.imdb_rating
                      ? `⭐ ${movie.imdb_rating}`
                      : "No rating"}

                  </div>


                  <h3>
                    {formatted.title}
                  </h3>


                  {formatted.year && (
                    <span>
                      {formatted.year}
                    </span>
                  )}

                </div>

              </div>

            );
          })}

      </div>


      {/* RIGHT ARROW */}

      <button
        type="button"
        className="shuffle-arrow shuffle-right"
        onClick={() =>
          onShuffle("right")
        }
        aria-label="Next featured movie"
      >
        ›
      </button>

    </div>
  );
}

export default ShuffleCards;