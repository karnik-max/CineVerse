import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import MovieCard from "../components/MovieCard";

import { API_BASE } from "../config";
import { getOrCreateUserId } from "../utils/userId";


/* =========================================================
   SORT OPTIONS
   ========================================================= */

const SORT_OPTIONS = [
  {
    value: "random",
    label: "Random"
  },
  {
    value: "rating",
    label: "Highest Rated"
  },
  {
    value: "newest",
    label: "Newest"
  },
  {
    value: "oldest",
    label: "Oldest"
  },
  {
    value: "title",
    label: "A–Z"
  }
];


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffleArray(array) {
  const copy = [...array];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {
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


/* =========================================================
   EXPLORE PAGE
   ========================================================= */

function Explore() {

  const [movies, setMovies] =
    useState([]);

  const [genres, setGenres] =
    useState([]);

  const [selectedGenre, setSelectedGenre] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("random");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =======================================================
     LOAD MOVIES
     ======================================================= */

  useEffect(() => {

    loadMovies();

  }, []);


  const loadMovies = async () => {

    setLoading(true);

    setError("");


    try {

      const userId = getOrCreateUserId();
      const response =
        await fetch(
          `${API_BASE}/api/movies?limit=100&user_id=${encodeURIComponent(userId)}`
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Could not load movies."
        );

      }


      /*
       * Shuffle ONCE when Explore opens.
       *
       * This becomes the default Explore order.
       * It will not reshuffle every time React
       * renders the page.
       */

      setMovies(
        shuffleArray(data)
      );


    } catch (err) {

      console.error(
        "Explore movie error:",
        err
      );


      setError(
        "Could not connect to the movie server."
      );


      setMovies([]);

    } finally {

      setLoading(false);

    }

  };


  /* =======================================================
     LOAD GENRES
     ======================================================= */

  useEffect(() => {

    loadGenres();

  }, []);


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

      console.error(
        "Explore genre error:",
        err
      );

      setGenres([]);

    }

  };


  /* =======================================================
     SHUFFLE EXPLORE MOVIES
     ======================================================= */

  const shuffleExplore = () => {

    setMovies(
      shuffleArray(movies)
    );

    setSortBy("random");

  };


  /* =======================================================
     FILTER + SORT
     ======================================================= */

  const processedMovies =
    useMemo(() => {

      let result =
        [...movies];


      /* -----------------------------------------------
         GENRE FILTER
         ----------------------------------------------- */

      if (
        selectedGenre !== "All"
      ) {

        result =
          result.filter(
            (movie) =>
              String(
                movie.genres || ""
              )
                .toLowerCase()
                .includes(
                  selectedGenre.toLowerCase()
                )
          );

      }


      /* -----------------------------------------------
         SEARCH
         ----------------------------------------------- */

      const query =
        search
          .trim()
          .toLowerCase();


      if (query) {

        result =
          result.filter(
            (movie) =>
              String(
                movie.Movie_Name || ""
              )
                .toLowerCase()
                .includes(query)
          );

      }


      /* -----------------------------------------------
         SORT
         ----------------------------------------------- */

      if (
        sortBy === "rating"
      ) {

        result.sort(
          (a, b) =>
            Number(
              b.imdb_rating || 0
            ) -
            Number(
              a.imdb_rating || 0
            )
        );

      }


      if (
        sortBy === "newest"
      ) {

        result.sort(
          (a, b) =>
            Number(
              b.year || 0
            ) -
            Number(
              a.year || 0
            )
        );

      }


      if (
        sortBy === "oldest"
      ) {

        result.sort(
          (a, b) =>
            Number(
              a.year || 0
            ) -
            Number(
              b.year || 0
            )
        );

      }


      if (
        sortBy === "title"
      ) {

        result.sort(
          (a, b) =>
            String(
              a.Movie_Name || ""
            ).localeCompare(
              String(
                b.Movie_Name || ""
              )
            )
        );

      }


      /*
       * RANDOM:
       *
       * Do nothing here.
       *
       * The base movie array was already
       * shuffled when Explore loaded or when
       * the Shuffle button was pressed.
       */

      return result;

    }, [
      movies,
      selectedGenre,
      sortBy,
      search
    ]);


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div className="explore-page">

      <Navbar />


      <main className="explore-content">


        {/* =================================================
            HEADER
            ================================================= */}

        <section className="explore-header">

          <p className="toolbar-label">
            EXPLORE
          </p>


          <h1>
            Find something unexpected
          </h1>


          <p className="explore-subtitle">

            Browse random movies, discover
            hidden gems, explore genres and
            find something worth watching.

          </p>

        </section>


        {/* =================================================
            CONTROLS
            ================================================= */}

        <section className="explore-controls">


          {/* SEARCH */}

          <div className="explore-search">

            <span>
              ⌕
            </span>


            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search movies in Explore..."
            />

          </div>


          {/* SORT */}

          <select
            className="explore-sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value
              )
            }
          >

            {SORT_OPTIONS.map(
              (option) => (

                <option
                  key={option.value}
                  value={option.value}
                >
                  Sort: {option.label}
                </option>

              )
            )}

          </select>


          {/* SHUFFLE BUTTON */}

          <button
            type="button"
            className="explore-shuffle-button"
            onClick={
              shuffleExplore
            }
            title="Shuffle movies"
          >
            ⤨ Shuffle
          </button>

        </section>


        {/* =================================================
            GENRES
            ================================================= */}

        <section className="explore-genres">

          <div className="explore-section-label">
            Browse by Genre
          </div>


          <div className="genre-pills">

            <button
              type="button"
              className={
                selectedGenre === "All"
                  ? "genre-pill active"
                  : "genre-pill"
              }
              onClick={() =>
                setSelectedGenre(
                  "All"
                )
              }
            >
              All
            </button>


            {genres.map(
              (genre) => (

                <button
                  key={genre}
                  type="button"
                  className={
                    selectedGenre === genre
                      ? "genre-pill active"
                      : "genre-pill"
                  }
                  onClick={() =>
                    setSelectedGenre(
                      genre
                    )
                  }
                >
                  {genre}
                </button>

              )
            )}

          </div>

        </section>


        {/* =================================================
            MOVIES
            ================================================= */}

        <section className="explore-movies">


          {/* HEADER */}

          <div className="explore-movies-header">

            <div>

              <p className="toolbar-label">
                DISCOVER
              </p>


              <h2>

                {selectedGenre === "All"
                  ? "Random Movies"
                  : `${selectedGenre} Movies`}

              </h2>

            </div>


            <span>

              {processedMovies.length}{" "}
              {processedMovies.length === 1
                ? "movie"
                : "movies"}

            </span>

          </div>


          {/* LOADING */}

          {loading && (

            <div className="state">
              Loading movies...
            </div>

          )}


          {/* ERROR */}

          {!loading &&
            error && (

              <div className="state error">
                {error}
              </div>

            )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            processedMovies.length === 0 && (

              <div className="explore-empty">

                <div>
                  🎬
                </div>


                <h3>
                  No movies found
                </h3>


                <p>
                  Try another title or
                  choose a different genre.
                </p>

              </div>

            )}


          {/* MOVIE GRID */}

          {!loading &&
            !error &&
            processedMovies.length > 0 && (

              <div className="explore-grid">

                {processedMovies.map(
                  (movie) => (

                    <MovieCard
                      key={
                        movie.canonical_movie_id
                      }
                      movie={movie}
                    />

                  )
                )}

              </div>

            )}

        </section>

      </main>

    </div>

  );
}


export default Explore;