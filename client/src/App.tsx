import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import LessonList from "./pages/LessonList";
import LessonPlayer from "./pages/LessonPlayer";
import Alphabet from "./pages/Alphabet";
import Progress from "./pages/Progress";

export default function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header />
      <main id="main" className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lessons" element={<LessonList />} />
          <Route path="/lessons/:lessonId" element={<LessonPlayer />} />
          <Route path="/alphabet" element={<Alphabet />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <small>
          sofer — a proof-of-concept Arabic tutor. Built for the Devpost Build
          With AI: Basics hackathon.
        </small>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <section className="page">
      <h1>Page not found</h1>
      <p>The page you were looking for does not exist.</p>
    </section>
  );
}