import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="page">
      <h1>Learn your first Arabic sentences.</h1>
      <p>
        sofer is a calm, accessible place to begin reading Modern Standard
        Arabic. Tap any word in a real sentence to see what it means, why it is
        written that way, and how it fits together.
      </p>
      <p>
        <Link to="/lessons" className="btn btn--primary">
          Start Learning
        </Link>
      </p>
      <p style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Link to="/alphabet" className="btn">Browse the alphabet</Link>
        <Link to="/progress" className="btn">View your progress</Link>
      </p>
    </section>
  );
}