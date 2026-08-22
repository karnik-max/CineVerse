import { Link } from "react-router-dom";
import Logo from "./Logo";

function Navbar() {
  return (
    <header className="navbar">

      <Link
        to="/"
        className="brand-link"
      >
        <Logo />
      </Link>


      <div className="navbar-right">

        <nav className="nav-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/explore">
            Explore
          </Link>

          <Link to="/genres">
            Genres
          </Link>

        </nav>


        <div className="nav-user">

          <div className="user-circle">
            U
          </div>

        </div>

      </div>

    </header>
  );
}

export default Navbar;