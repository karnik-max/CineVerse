export function formatMovieTitle(movieName) {

  if (!movieName) {
    return {
      title: "",
      year: ""
    };
  }


  let title =
    String(movieName).trim();

  let year = "";


  const yearMatch =
    title.match(
      /\s*\((\d{4})\)\s*$/
    );


  if (yearMatch) {

    year = yearMatch[1];

    title =
      title
        .replace(
          /\s*\(\d{4}\)\s*$/,
          ""
        )
        .trim();

  }


  const articleMatch =
    title.match(
      /^(.+),\s+(The|A|An)$/i
    );


  if (articleMatch) {

    title =
      `${articleMatch[2]} ${articleMatch[1]}`;

  }


  return {
    title,
    year
  };
}