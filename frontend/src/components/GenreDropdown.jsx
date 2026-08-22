function GenreDropdown({
  genres,
  selectedGenre,
  setSelectedGenre
}) {

  return (
    <div className="genre-dropdown-wrapper">

      <button
        type="button"
        className="genre-dropdown-button"
      >

        <span>
          {selectedGenre === "All"
            ? "Genres"
            : selectedGenre}
        </span>

        <span className="dropdown-arrow">
          ▾
        </span>

      </button>


      <div className="genre-menu">

        <button
          type="button"
          className={
            selectedGenre === "All"
              ? "genre-option selected"
              : "genre-option"
          }
          onClick={() =>
            setSelectedGenre("All")
          }
        >
          All Genres
        </button>


        {genres.map((genre) => (

          <button
            type="button"
            key={genre}
            className={
              selectedGenre === genre
                ? "genre-option selected"
                : "genre-option"
            }
            onClick={() =>
              setSelectedGenre(genre)
            }
          >
            {genre}
          </button>

        ))}

      </div>

    </div>
  );
}

export default GenreDropdown;