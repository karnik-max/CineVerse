import {
  useEffect,
  useRef,
  useState
} from "react";

import { createPortal } from "react-dom";

import { useNavigate } from "react-router-dom";

import { formatMovieTitle } from "../utils/movieTitle";


const API_BASE =
  "http://127.0.0.1:5000";

const TABLET_WIDTH = 420;
const TABLET_HEIGHT = 236;
const EDGE_GAP = 12;


function MovieCard({ movie }) {

  const navigate = useNavigate();

  const cardRef =
    useRef(null);

  const timerRef =
    useRef(null);

  const [trailerUrl, setTrailerUrl] =
    useState(null);

  const [trailerChecked, setTrailerChecked] =
    useState(false);

  const [isPreview, setIsPreview] =
    useState(false);

  const [tabletStyle, setTabletStyle] =
    useState(null);


  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {

    return () => {

      if (timerRef.current) {

        clearTimeout(
          timerRef.current
        );

      }

    };

  }, []);


  // =====================================================
  // CALCULATE VIEWPORT POSITION
  // =====================================================

  const updateTabletPosition = () => {

    const card =
      cardRef.current;

    if (!card) {
      return;
    }


    const rect =
      card.getBoundingClientRect();


    /*
     * Center the tablet over the card.
     */

    let left =
      rect.left +
      rect.width / 2 -
      TABLET_WIDTH / 2;


    let top =
      rect.top +
      rect.height / 2 -
      TABLET_HEIGHT / 2;


    /*
     * Keep it inside browser viewport.
     */

    const maxLeft =
      window.innerWidth -
      TABLET_WIDTH -
      EDGE_GAP;

    const maxTop =
      window.innerHeight -
      TABLET_HEIGHT -
      EDGE_GAP;


    left = Math.max(
      EDGE_GAP,
      Math.min(
        left,
        maxLeft
      )
    );


    top = Math.max(
      EDGE_GAP,
      Math.min(
        top,
        maxTop
      )
    );


    setTabletStyle({
      left,
      top,
      width: TABLET_WIDTH,
      height: TABLET_HEIGHT
    });

  };


  // =====================================================
  // UPDATE POSITION
  // =====================================================

  useEffect(() => {

    if (!isPreview) {
      return;
    }


    updateTabletPosition();


    const handleUpdate = () => {
      updateTabletPosition();
    };


    window.addEventListener(
      "resize",
      handleUpdate
    );

    window.addEventListener(
      "scroll",
      handleUpdate,
      true
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleUpdate
      );

      window.removeEventListener(
        "scroll",
        handleUpdate,
        true
      );

    };

  }, [isPreview]);


  // =====================================================
  // GLOBAL POINTER TRACKING
  // =====================================================

  useEffect(() => {

    if (!isPreview) {
      return;
    }


    const handlePointerMove =
      (event) => {

        const card =
          cardRef.current;

        if (!card) {
          return;
        }


        const cardRect =
          card.getBoundingClientRect();


        const insideCard =
          event.clientX >=
            cardRect.left &&
          event.clientX <=
            cardRect.right &&
          event.clientY >=
            cardRect.top &&
          event.clientY <=
            cardRect.bottom;


        let insideTrailer = false;


        if (tabletStyle) {

          insideTrailer =
            event.clientX >=
              tabletStyle.left &&
            event.clientX <=
              tabletStyle.left +
                tabletStyle.width &&
            event.clientY >=
              tabletStyle.top &&
            event.clientY <=
              tabletStyle.top +
                tabletStyle.height;

        }


        if (
          !insideCard &&
          !insideTrailer
        ) {

          setIsPreview(false);
          setTabletStyle(null);

        }

      };


    window.addEventListener(
      "pointermove",
      handlePointerMove
    );


    return () => {

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

    };

  }, [
    isPreview,
    tabletStyle
  ]);


  // =====================================================
  // FETCH TRAILER
  // =====================================================

  const fetchTrailer = async () => {

    if (trailerChecked) {

      if (trailerUrl) {

        updateTabletPosition();

        setIsPreview(true);

      }

      return;

    }


    try {

      const response =
        await fetch(
          `${API_BASE}/api/movie/${movie.canonical_movie_id}/trailer`
        );


      const data =
        await response.json();


      setTrailerChecked(true);


      if (
        response.ok &&
        data.trailer_url
      ) {

        setTrailerUrl(
          data.trailer_url
        );


        requestAnimationFrame(() => {

          updateTabletPosition();

          setIsPreview(true);

        });

      }

    } catch (error) {

      console.error(
        "Trailer preview error:",
        error
      );

      setTrailerChecked(true);

      setIsPreview(false);

    }

  };


  // =====================================================
  // ALWAYS 5 SECOND HOVER
  // =====================================================

  const handleMouseEnter = () => {

    if (timerRef.current) {

      clearTimeout(
        timerRef.current
      );

    }


    setIsPreview(false);
    setTabletStyle(null);


    timerRef.current =
      setTimeout(() => {

        timerRef.current = null;

        fetchTrailer();

      }, 5000);

  };


  // =====================================================
  // LEAVE
  // =====================================================

  const handleMouseLeave = () => {

    if (timerRef.current) {

      clearTimeout(
        timerRef.current
      );

      timerRef.current = null;

    }

    /*
     * The global pointer listener decides whether
     * the mouse went into the floating trailer.
     */

  };


  // =====================================================
  // OPEN MOVIE
  // =====================================================

  const openMovie = () => {

    if (isPreview) {
      return;
    }


    navigate(
      `/movie/${movie.canonical_movie_id}`
    );

  };


  // =====================================================
  // KEYBOARD
  // =====================================================

  const handleKeyDown =
    (event) => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openMovie();

      }

    };


  const formatted =
    formatMovieTitle(
      movie.Movie_Name
    );


  // =====================================================
  // FLOATING TRAILER
  // =====================================================

  const trailerTablet =
    isPreview &&
    trailerUrl &&
    tabletStyle
      ? createPortal(

          <div
            className="
              floating-trailer-tablet
            "

            style={{
              left:
                `${tabletStyle.left}px`,

              top:
                `${tabletStyle.top}px`,

              width:
                `${tabletStyle.width}px`,

              height:
                `${tabletStyle.height}px`
            }}

            onClick={(event) => {
              event.stopPropagation();
            }}

            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >

            <iframe
              className="
                floating-trailer-frame
              "

              src={trailerUrl}

              title={
                `${formatted.title} trailer`
              }

              allow="
                autoplay;
                encrypted-media;
                picture-in-picture;
                fullscreen
              "

              allowFullScreen
            />


            <div
              className="
                floating-trailer-label
              "
            >
              ▶ TRAILER
            </div>


            <div
              className="
                floating-trailer-info
              "
            >

              {movie.imdb_rating && (

                <div className="poster-rating">
                  ⭐ {movie.imdb_rating}
                </div>

              )}


              <h3>
                {formatted.title}
              </h3>


              {formatted.year && (

                <span>
                  {formatted.year}
                </span>

              )}

            </div>

          </div>,

          document.body

        )
      : null;


  // =====================================================
  // NORMAL CARD
  // =====================================================

  return (

    <>

      <article
        ref={cardRef}

        className="movie-card"

        onMouseEnter={
          handleMouseEnter
        }

        onMouseLeave={
          handleMouseLeave
        }

        onClick={
          openMovie
        }

        onKeyDown={
          handleKeyDown
        }

        role="button"

        tabIndex={0}
      >

        <div className="poster">

          {movie.poster_url ? (

            <img
              className="
                movie-poster-image
              "

              src={
                movie.poster_url
              }

              alt={
                formatted.title
              }

              loading="lazy"
            />

          ) : (

            <div className="poster-fallback">
              🎬
            </div>

          )}


          <div className="poster-shade" />


          <div className="poster-info">

            {movie.imdb_rating && (

              <div className="poster-rating">
                ⭐ {movie.imdb_rating}
              </div>

            )}


            <h3>
              {formatted.title}
            </h3>


            {formatted.year && (

              <span className="movie-year">
                {formatted.year}
              </span>

            )}

          </div>

        </div>

      </article>


      {trailerTablet}

    </>

  );

}


export default MovieCard;