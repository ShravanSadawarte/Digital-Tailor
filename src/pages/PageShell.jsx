import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

// Shared shell for inner pages: nav + content + footer.
export default function PageShell({ children }) {
  return (
    <div className="dt">
      <a className="dt-skip" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="dt-page">
        {children}
      </main>
      <Footer />
    </div>
  );
}
