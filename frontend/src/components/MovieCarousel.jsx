import {
  useEffect,
  useState
} from "react";

import MovieCard from "./MovieCard";


function MovieCarousel({
  title = "",
  movies = []
}) {

  const [page, setPage] =
    useState(0);

  const [visibleCount, setVisibleCount] =
    useState(5);

  const [direction, setDirection] =
    useState("next");

  const [isSliding, setIsSliding] =
    useState(false);


  // =====================================================
  // RESPONSIVE CARD COUNT
  // =====================================================

  useEffect(() => {

    const updateVisibleCount = () => {

      const width =
        window.innerWidth;

      if (width <= 650) {

        setVisibleCount(2);

      } else if (width <= 900) {

        setVisibleCount(3);

      } else if (width <= 1200) {

        setVisibleCount(4);

      } else {

        setVisibleCount(5);

      }

    };


    updateVisibleCount();


    window.addEventListener(
      "resize",
      updateVisibleCount
    );


    return () => {

      window.removeEventListener(
        "resize",
        updateVisibleCount
      );

    };

  }, []);


  // =====================================================
  // RESET WHEN MOVIES CHANGE
  // =====================================================

  useEffect(() => {

    setPage(0);

    setIsSliding(false);

    setDirection("next");

  }, [movies]);


  // =====================================================
  // TOTAL PAGES
  // =====================================================

  const totalPages =
    Math.ceil(
      movies.length /
      visibleCount
    );


  // =====================================================
  // CHANGE PAGE
  // =====================================================

  const changePage = (
    newPage,
    newDirection
  ) => {

    if (
      isSliding ||
      totalPages <= 1
    ) {

      return;

    }


    setDirection(
      newDirection
    );


    setIsSliding(true);


    /*
     * Keep this delay in sync with the
     * CSS animation duration below.
     */

    setTimeout(() => {

      setPage(newPage);


      setTimeout(() => {

        setIsSliding(false);

      }, 700);

    }, 50);

  };


  // =====================================================
  // PREVIOUS
  // =====================================================

  const handlePrevious = (
    event
  ) => {

    event.preventDefault();

    event.stopPropagation();


    if (
      totalPages <= 1 ||
      isSliding
    ) {

      return;

    }


    const previousPage =
      page <= 0
        ? totalPages - 1
        : page - 1;


    changePage(
      previousPage,
      "previous"
    );

  };


  // =====================================================
  // NEXT
  // =====================================================

  const handleNext = (
    event
  ) => {

    event.preventDefault();

    event.stopPropagation();


    if (
      totalPages <= 1 ||
      isSliding
    ) {

      return;

    }


    const nextPage =
      page >= totalPages - 1
        ? 0
        : page + 1;


    changePage(
      nextPage,
      "next"
    );

  };


  // =====================================================
  // CURRENT MOVIES
  // =====================================================

  const start =
    page * visibleCount;


  const end =
    start + visibleCount;


  const visibleMovies =
    movies.slice(
      start,
      end
    );


  // =====================================================
  // EMPTY
  // =====================================================

  if (
    !movies ||
    movies.length === 0
  ) {

    return null;

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <section className="movie-section">


      {/* =================================================
          HEADER
          ================================================= */}

      {title && (

        <div className="movie-section-header">

          <h2>
            {title}
          </h2>

        </div>

      )}


      {/* =================================================
          CAROUSEL
          ================================================= */}

      <div className="carousel">


        {/* =================================================
            LEFT ARROW
            ================================================= */}

        {totalPages > 1 && (

          <button
            type="button"

            className="
              carousel-arrow
              carousel-arrow-left
            "

            onClick={
              handlePrevious
            }

            aria-label="
              Previous movies
            "

            disabled={
              isSliding
            }
          >
            ‹
          </button>

        )}


        {/* =================================================
            VIEWPORT
            ================================================= */}

        <div className="carousel-viewport">

          <div
            className={`
              carousel-slide
              ${
                isSliding
                  ? `sliding-${direction}`
                  : ""
              }
            `}

            key={page}
          >

            {visibleMovies.map(
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

        </div>


        {/* =================================================
            RIGHT ARROW
            ================================================= */}

        {totalPages > 1 && (

          <button
            type="button"

            className="
              carousel-arrow
              carousel-arrow-right
            "

            onClick={
              handleNext
            }

            aria-label="
              Next movies
            "

            disabled={
              isSliding
            }
          >
            ›
          </button>

        )}

      </div>

    </section>

  );

}


export default MovieCarousel;