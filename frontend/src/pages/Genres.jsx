import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import MovieCard from "../components/MovieCard";

const API_BASE = "http://127.0.0.1:5000";


function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [copy[i], copy[j]] = [
      copy[j],
      copy[i]
    ];
  }

  return copy;
}


function Genres() {

  const [genres, setGenres] =
    useState([]);

  const [movies, setMovies] =
    useState([]);

  const [selectedGenre, setSelectedGenre] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD GENRES
  // =====================================================

  useEffect(() => {

    const loadGenres = async () => {

      try {

        const response =
          await fetch(
            `${API_BASE}/api/genres`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            "Could not load genres."
          );
        }

        setGenres(data);

      } catch (err) {

        console.error(err);

        setError(
          "Could not load genres."
        );

      }

    };

    loadGenres();

  }, []);


  // =====================================================
  // LOAD MOVIES FOR GENRE
  // =====================================================

  useEffect(() => {

    if (!selectedGenre) {
      return;
    }

    const loadGenreMovies =
      async () => {

        setLoading(true);

        try {

          const response =
            await fetch(
              `${API_BASE}/api/movies?genre=${encodeURIComponent(
                selectedGenre
              )}&limit=100`
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              "Could not load movies."
            );
          }

          setMovies(
            shuffleArray(data)
          );

        } catch (err) {

          console.error(err);

          setMovies([]);

          setError(
            "Could not load movies."
          );

        } finally {

          setLoading(false);

        }

      };

    loadGenreMovies();

  }, [selectedGenre]);


  return (
    <div className="genres-page">

      <Navbar />


      <main className="genres-content">

        {/* =========================================
            HEADER
            ========================================= */}

        <section className="genres-header">

          <p className="toolbar-label">
            GENRES
          </p>

          <h1>
            Explore by genre
          </h1>

          <p>
            Pick a genre and discover
            movies worth watching.
          </p>

        </section>


        {/* =========================================
            GENRE GRID
            ========================================= */}

        <section className="genre-browser">

          {genres.map((genre) => (

            <button
              key={genre}
              type="button"
              className={
                selectedGenre === genre
                  ? "genre-browser-card active"
                  : "genre-browser-card"
              }
              onClick={() =>
                setSelectedGenre(genre)
              }
            >
              {genre}
            </button>

          ))}

        </section>


        {/* =========================================
            SELECTED GENRE
            ========================================= */}

        {!selectedGenre && (

          <div className="genre-empty">

            <div>
              🎬
            </div>

            <h2>
              Choose a genre
            </h2>

            <p>
              Select a genre above to
              start exploring.
            </p>

          </div>

        )}


        {selectedGenre && (

          <section className="genre-results">

            <div className="genre-results-header">

              <div>

                <p className="toolbar-label">
                  BROWSE
                </p>

                <h2>
                  {selectedGenre} Movies
                </h2>

              </div>

              <span>
                {movies.length} movies
              </span>

            </div>


            {loading && (

              <div className="state">
                Loading movies...
              </div>

            )}


            {!loading &&
              !error &&
              movies.length > 0 && (

                <div className="genre-movie-grid">

                  {movies.map((movie) => (

                    <MovieCard
                      key={
                        movie.canonical_movie_id
                      }
                      movie={movie}
                    />

                  ))}

                </div>

              )}


            {!loading &&
              !error &&
              movies.length === 0 && (

                <div className="genre-empty">

                  <div>
                    🎬
                  </div>

                  <h2>
                    No movies found
                  </h2>

                </div>

              )}

          </section>

        )}

      </main>

    </div>
  );
}


export default Genres;