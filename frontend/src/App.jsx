import { useEffect, useState } from "react";

import "./App.css";

import Navbar from "./components/Navbar";
import FeaturedMovie from "./components/FeaturedMovie";
import ShuffleCards from "./components/ShuffleCards";
import GenreDropdown from "./components/GenreDropdown";
import MovieCarousel from "./components/MovieCarousel";


const API_BASE = "http://127.0.0.1:5000";


/* =========================================================
   RANDOMIZE ARRAY
   ========================================================= */

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


/* =========================================================
   APP
   ========================================================= */

function App() {

  const [movies, setMovies] = useState([]);

  const [allMovies, setAllMovies] = useState([]);

  const [genres, setGenres] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedGenre, setSelectedGenre] =
    useState("All");

  const [featuredMovies, setFeaturedMovies] =
    useState([]);

  const [moreMovies, setMoreMovies] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [isSearchMode, setIsSearchMode] =
    useState(false);


  /* =======================================================
     LOAD GENRES
     ======================================================= */

  useEffect(() => {

    const loadGenres = async () => {

      try {

        const response = await fetch(
          `${API_BASE}/api/genres`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load genres."
          );
        }

        const data =
          await response.json();

        setGenres(data);

      } catch (err) {

        console.error(
          "Genre error:",
          err
        );

      }
    };

    loadGenres();

  }, []);


  /* =======================================================
     LOAD HOMEPAGE
     ======================================================= */

  useEffect(() => {

    if (!isSearchMode) {
      loadHomeMovies();
    }

  }, [
    selectedGenre,
    isSearchMode
  ]);


  const loadHomeMovies = async () => {

    setLoading(true);
    setError("");

    try {

      const params =
        new URLSearchParams();

      params.set(
        "limit",
        "100"
      );


      if (
        selectedGenre !== "All"
      ) {

        params.set(
          "genre",
          selectedGenre
        );

      }


      const response =
        await fetch(
          `${API_BASE}/api/movies?${params.toString()}`
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Could not load movies."
        );

      }


      setMovies(data);

      setAllMovies(data);


      /* Random featured movies */

      setFeaturedMovies(
        shuffleArray(data).slice(
          0,
          4
        )
      );


      /* Random more-to-watch */

      setMoreMovies(
        shuffleArray(data).slice(
          0,
          20
        )
      );


    } catch (err) {

      console.error(err);

      setError(
        "Could not connect to the movie server."
      );

      setMovies([]);

      setAllMovies([]);

      setFeaturedMovies([]);

      setMoreMovies([]);

    } finally {

      setLoading(false);

    }
  };


  /* =======================================================
     SEARCH
     ======================================================= */

  const handleSearch = async () => {

    const query =
      search.trim();


    if (!query) {
      return;
    }


    setIsSearchMode(true);

    setLoading(true);

    setError("");


    /* Remove homepage-only content */

    setFeaturedMovies([]);


    try {

      /* ---------------------------------------------
         SEARCH RESULTS
         --------------------------------------------- */

      const searchParams =
        new URLSearchParams();

      searchParams.set(
        "limit",
        "80"
      );

      searchParams.set(
        "search",
        query
      );


      const searchResponse =
        await fetch(
          `${API_BASE}/api/movies?${searchParams.toString()}`
        );


      const searchData =
        await searchResponse.json();


      if (!searchResponse.ok) {

        throw new Error(
          searchData.error ||
          "Search failed."
        );

      }


      setMovies(searchData);


      /* ---------------------------------------------
         RANDOM MORE-TO-WATCH MOVIES
         --------------------------------------------- */

      const allParams =
        new URLSearchParams();

      allParams.set(
        "limit",
        "100"
      );


      const allResponse =
        await fetch(
          `${API_BASE}/api/movies?${allParams.toString()}`
        );


      const allData =
        await allResponse.json();


      if (!allResponse.ok) {

        throw new Error(
          allData.error ||
          "Could not load more movies."
        );

      }


      setAllMovies(allData);


      /* ---------------------------------------------
         Remove movies already in search results
         --------------------------------------------- */

      const searchIds =
        new Set(
          searchData.map(
            (movie) =>
              movie.canonical_movie_id
          )
        );


      const randomMoreMovies =
        shuffleArray(
          allData.filter(
            (movie) =>
              !searchIds.has(
                movie.canonical_movie_id
              )
          )
        ).slice(
          0,
          20
        );


      setMoreMovies(
        randomMoreMovies
      );


    } catch (err) {

      console.error(err);

      setError(
        "Could not complete the search."
      );

      setMovies([]);

      setMoreMovies([]);

    } finally {

      setLoading(false);

    }
  };


  /* =======================================================
     SEARCH ENTER KEY
     ======================================================= */

  const handleSearchKeyDown =
    (event) => {

      if (
        event.key === "Enter"
      ) {

        handleSearch();

      }

    };


  /* =======================================================
     RETURN HOME
     ======================================================= */

  const returnHome = () => {

    setSearch("");

    setIsSearchMode(false);

    setSelectedGenre("All");

  };


  /* =======================================================
     FEATURED SHUFFLE
     ======================================================= */

  const shuffleFeatured =
    (direction) => {

      if (
        featuredMovies.length < 2
      ) {

        return;

      }


      const updated =
        [...featuredMovies];


      if (
        direction === "right"
      ) {

        const first =
          updated.shift();


        if (first) {
          updated.push(first);
        }

      } else {

        const last =
          updated.pop();


        if (last) {
          updated.unshift(last);
        }

      }


      setFeaturedMovies(
        updated
      );

    };


  const featuredMovie =
    featuredMovies.length > 0
      ? featuredMovies[0]
      : null;


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div className="app">

      <Navbar />


      {/* ==================================================
          HOMEPAGE FEATURED SECTION
          ================================================== */}

      {!isSearchMode &&
        !loading &&
        featuredMovie && (

          <section
            className="featured-area"
            id="home"
          >

            <div className="featured-background">

              {featuredMovie.backdrop_url ? (

                <img
                  src={
                    featuredMovie.backdrop_url
                  }
                  alt=""
                />

              ) : featuredMovie.poster_url ? (

                <img
                  src={
                    featuredMovie.poster_url
                  }
                  alt=""
                />

              ) : (

                <div className="featured-background-fallback">
                  🎬
                </div>

              )}

            </div>


            <div className="featured-overlay"></div>


            <FeaturedMovie
              movie={featuredMovie}
            />


            <ShuffleCards
              movies={featuredMovies}
              onShuffle={
                shuffleFeatured
              }
            />

          </section>

        )}


      {/* ==================================================
          MAIN CONTENT
          ================================================== */}

      <main
        className={
          isSearchMode
            ? "main-content search-page"
            : "main-content"
        }
      >


        {/* =================================================
            SEARCH HEADER
            ================================================= */}

        <section className="search-page-header">

          <p className="toolbar-label">

            {isSearchMode
              ? "SEARCH"
              : "DISCOVER"}

          </p>


          <h1>

            {isSearchMode
              ? `Results for "${search}"`
              : "Discover your next favorite movie"}

          </h1>


          {!isSearchMode && (

            <p className="search-page-subtitle">

              Search thousands of movies,
              explore genres and find
              something worth watching.

            </p>

          )}


          <div className="search-shell search-page-input">

            <span className="search-icon">
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
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Search for a movie..."
            />


            <button
              type="button"
              onClick={
                handleSearch
              }
              disabled={loading}
            >

              {loading
                ? "Searching..."
                : "Search"}

            </button>

          </div>


          {!isSearchMode && (

            <p className="search-hint">

              Try: Toy Story,
              Star Wars,
              Forrest Gump

            </p>

          )}


          {isSearchMode && (

            <button
              type="button"
              className="back-home-button"
              onClick={
                returnHome
              }
            >
              ← Back to Home
            </button>

          )}

        </section>


        {/* =================================================
            HOMEPAGE GENRES
            ================================================= */}

        {!isSearchMode && (

          <div
            className="browse-toolbar"
            id="genres"
          >

            <div>

              <p className="toolbar-label">
                BROWSE
              </p>

              <h2>
                Explore movies
              </h2>

            </div>


            <GenreDropdown
              genres={genres}
              selectedGenre={
                selectedGenre
              }
              setSelectedGenre={
                setSelectedGenre
              }
            />

          </div>

        )}


        {/* =================================================
            SEARCH PAGE
            ================================================= */}

        {isSearchMode && !loading && !error && (

          <section className="search-results-section">


            {/* ==============================
                SEARCH RESULTS
                ============================== */}

            <div className="search-results-header">

              <div>

                <p className="toolbar-label">
                  SEARCH RESULTS
                </p>

                <h2>
                  {movies.length}{" "}
                  {movies.length === 1
                    ? "movie"
                    : "movies"}{" "}
                  found
                </h2>

              </div>


              <span className="search-query">
                “{search}”
              </span>

            </div>


            {movies.length > 0 ? (

              <MovieCarousel
                title=""
                movies={movies}
              />

            ) : (

              <div className="search-empty-state">

                <div className="search-empty-icon">
                  🎬
                </div>

                <h3>
                  No movies found
                </h3>

                <p>
                  Try another movie title.
                </p>

              </div>

            )}


            {/* ==============================
                MORE TO WATCH
                ============================== */}

            {moreMovies.length > 0 && (

              <section className="more-to-watch">

                <div className="more-to-watch-header">

                  <div>

                    <p className="toolbar-label">
                      KEEP EXPLORING
                    </p>

                    <h2>
                      More to Watch
                    </h2>

                  </div>

                  <span>
                    Random picks for you
                  </span>

                </div>


                <MovieCarousel
                  title=""
                  movies={moreMovies}
                />

              </section>

            )}

          </section>

        )}


        {/* =================================================
            HOMEPAGE MOVIES
            ================================================= */}

        {!isSearchMode && (

          <>

            {loading && (

              <div className="state">
                Loading movies...
              </div>

            )}


            {!loading &&
              error && (

                <div className="state error">
                  {error}
                </div>

              )}


            {!loading &&
              !error &&
              movies.length > 0 && (

                <>

                  <MovieCarousel
                    title={
                      selectedGenre === "All"
                        ? "Popular Movies"
                        : selectedGenre
                    }
                    movies={movies}
                  />


                  <MovieCarousel
                    title="More to Explore"
                    movies={moreMovies}
                  />

                </>

              )}

          </>

        )}

      </main>

    </div>

  );
}

export default App;