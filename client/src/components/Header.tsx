import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="wordmark" aria-label="sofer home">
          <span className="wordmark__mark" aria-hidden="true">س</span>
          sofer
        </NavLink>
        <nav className="site-nav" aria-label="Primary">
          <NavLink to="/lessons">Learn</NavLink>
          <NavLink to="/alphabet">Alphabet</NavLink>
          <NavLink to="/progress">Progress</NavLink>
          <NavLink to="/practice">Practice</NavLink>
          <NavLink to="/review">Review</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <details className="site-menu">
          <summary aria-label="Open menu">Menu</summary>
          <ul>
            <li><NavLink to="/lessons">Learn</NavLink></li>
            <li><NavLink to="/alphabet">Alphabet</NavLink></li>
            <li><NavLink to="/progress">Progress</NavLink></li>
            <li><NavLink to="/practice">Practice</NavLink></li>
            <li><NavLink to="/review">Review</NavLink></li>
            <li><NavLink to="/settings">Settings</NavLink></li>
          </ul>
        </details>
      </div>
    </header>
  );
}
