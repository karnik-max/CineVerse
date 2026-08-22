import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

const API_BASE = "http://127.0.0.1:5000";


function MovieDetails() {

  const { movieId } = useParams();

  const [movie, setMovie] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const [selectedRating, setSelectedRating] =
    useState(0);

  const [savedRating, setSavedRating] =
    useState(null);

  const [ratingMessage, setRatingMessage] =
    useState("");


  // =====================================================
  // LOCAL USER ID
  // =====================================================

  const getUserId = () => {

    let userId =
      localStorage.getItem(
        "cineverse_user_id"
      );

    if (!userId) {

      userId =
        crypto.randomUUID();

      localStorage.setItem(
        "cineverse_user_id",
        userId
      );

    }

    return userId;
  };


  // =====================================================
  // LOAD MOVIE
  // =====================================================

  useEffect(() => {

    const loadMovie = async () => {

      setLoading(true);
      setError("");

      try {

        const response =
          await fetch(
            `${API_BASE}/api/movie/${movieId}`
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.error ||
            "Movie not found."
          );

        }

        setMovie(data);

      } catch (err) {

        console.error(err);

        setError(
          err.message ||
          "Could not load movie."
        );

      } finally {

        setLoading(false);

      }
    };


    loadMovie();

  }, [movieId]);


  // =====================================================
  // LOAD USER RATING
  // =====================================================

  useEffect(() => {

    const loadRating = async () => {

      const userId =
        getUserId();

      try {

        const response =
          await fetch(
            `${API_BASE}/api/rating` +
            `?user_id=${encodeURIComponent(userId)}` +
            `&movie_id=${encodeURIComponent(movieId)}`
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data.rating
        ) {

          setSavedRating(
            data.rating
          );

          setSelectedRating(
            data.rating
          );

        }

      } catch (err) {

        console.error(
          "Rating load error:",
          err
        );

      }

    };


    loadRating();

  }, [movieId]);


  // =====================================================
  // SAVE RATING
  // =====================================================

  const saveMovieRating = async () => {

    if (
      selectedRating < 1
    ) {

      return;

    }

    const userId =
      getUserId();

    setRatingMessage(
      "Saving..."
    );

    try {

      const response =
        await fetch(
          `${API_BASE}/api/rating`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              user_id:
                userId,

              canonical_movie_id:
                Number(movieId),

              rating:
                selectedRating
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Could not save rating."
        );

      }

      setSavedRating(
        data.rating
      );

      setRatingMessage(
        "Your rating was saved."
      );

    } catch (err) {

      console.error(err);

      setRatingMessage(
        "Could not save your rating."
      );

    }

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <div className="details-page">

        <Navbar />

        <div className="details-state">
          Loading movie...
        </div>

      </div>
    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error || !movie) {

    return (
      <div className="details-page">

        <Navbar />

        <div className="details-state error">
          {error || "Movie not found."}
        </div>

      </div>
    );

  }


  // =====================================================
  // GENRES
  // =====================================================

  const genres =
    movie.genres
      ? movie.genres
          .split("|")
          .filter(Boolean)
      : [];


  // =====================================================
  // CAST
  // =====================================================

  const cast = [
    movie.actor_1,
    movie.actor_2,
    movie.actor_3
  ].filter(Boolean);


  // =====================================================
  // TITLE
  // =====================================================

  const title =
    movie.tmdb_title ||
    movie.Movie_Name;


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="details-page">

      <Navbar />


      {/* =================================================
          BACKDROP
          ================================================= */}

      <section className="movie-detail-hero">

        {movie.backdrop_url && (

          <div className="movie-detail-backdrop">

            <img
              src={movie.backdrop_url}
              alt=""
            />

          </div>

        )}

        <div className="movie-detail-overlay"></div>


        <div className="movie-detail-content">

          <Link
            to="/"
            className="details-back-button"
          >
            ← Back to CineVerse
          </Link>


          <div className="movie-detail-main">


            {/* ===============================
                POSTER
                =============================== */}

            <div className="movie-detail-poster">

              {movie.poster_url ? (

                <img
                  src={movie.poster_url}
                  alt={title}
                />

              ) : (

                <div className="details-poster-fallback">
                  🎬
                </div>

              )}

            </div>


            {/* ===============================
                INFORMATION
                =============================== */}

            <div className="movie-detail-info">

              <p className="details-label">
                MOVIE DETAILS
              </p>


              <h1>
                {title}
              </h1>


              <div className="details-meta">

                {movie.year && (
                  <span>
                    {Number(movie.year)}
                  </span>
                )}

                {movie.imdb_rating && (
                  <span>
                    ⭐ {movie.imdb_rating}
                  </span>
                )}

              </div>


              {/* Genres */}

              {genres.length > 0 && (

                <div className="details-genres">

                  {genres.map((genre) => (

                    <span
                      key={genre}
                    >
                      {genre}
                    </span>

                  ))}

                </div>

              )}


              {/* Director */}

              {movie.director && (

                <p className="details-person">

                  <strong>
                    Director
                  </strong>

                  <span>
                    {movie.director}
                  </span>

                </p>

              )}


              {/* Cast */}

              {cast.length > 0 && (

                <p className="details-person">

                  <strong>
                    Cast
                  </strong>

                  <span>
                    {cast.join(" • ")}
                  </span>

                </p>

              )}


              {/* External links */}

              <div className="details-links">

                {movie.imdb_url && (

                  <a
                    href={movie.imdb_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    IMDb ↗
                  </a>

                )}

                {movie.tmdb_url && (

                  <a
                    href={movie.tmdb_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    TMDB ↗
                  </a>

                )}

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          OVERVIEW
          ================================================= */}

      <main className="movie-detail-body">

        <section className="overview-section">

          <p className="toolbar-label">
            ABOUT
          </p>

          <h2>
            About this movie
          </h2>

          <p className="movie-overview">

            {movie.overview ||
              "No overview is available for this movie."}

          </p>

        </section>


        {/* =================================================
            USER RATING
            ================================================= */}

        <section className="rating-section">

          <p className="toolbar-label">
            YOUR RATING
          </p>

          <h2>
            How would you rate this movie?
          </h2>


          <div className="rating-stars">

            {[1, 2, 3, 4, 5].map(
              (star) => (

                <button
                  key={star}
                  type="button"
                  className={
                    star <= selectedRating
                      ? "rating-star active"
                      : "rating-star"
                  }
                  onClick={() =>
                    setSelectedRating(
                      star
                    )
                  }
                  aria-label={
                    `${star} star rating`
                  }
                >
                  ★
                </button>

              )
            )}

          </div>


          <button
            type="button"
            className="save-rating-button"
            onClick={
              saveMovieRating
            }
            disabled={
              selectedRating < 1
            }
          >
            Save Rating
          </button>


          {savedRating && (
            <p className="saved-rating-message">
              Your current rating:{" "}
              <strong>
                {savedRating}/5
              </strong>
            </p>
          )}


          {ratingMessage && (
            <p className="rating-message">
              {ratingMessage}
            </p>
          )}

        </section>

      </main>

    </div>
  );
}

export default MovieDetails;