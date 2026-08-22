import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Genres from "./pages/Genres.jsx";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import "./index.css";
import "./App.css";

import App from "./App.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import Explore from "./pages/Explore.jsx";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/explore"
          element={<Explore />}
        />

        <Route
          path="/movie/:movieId"
          element={<MovieDetails />}
        />

        <Route
          path="/genres"
          element={<Genres />}
        />

      </Routes>

    </BrowserRouter>
  </StrictMode>
);