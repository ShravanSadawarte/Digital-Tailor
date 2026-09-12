// landingpage.jsx — Digital Tailor landing page.
// Thin composition only: every section below is a reusable component
// from ./components (also usable on future pages). Client-side only —
// no AI API calls, no image generation.
import About from "./components/About";
import FeatureGrid from "./components/FeatureGrid";
import Finale from "./components/Finale";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Journey from "./components/Journey";
import Navbar from "./components/Navbar";
import Personalization from "./components/Personalization";
import PromptSection from "./components/PromptSection";
import StyleExplorer from "./components/StyleExplorer";
import Ticker from "./components/Ticker";
import { WHY_ITEMS } from "./data/content";

function LandingPage() {
  return (
    <div className="dt">
      <a className="dt-skip" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Ticker />
        <Journey />
        <PromptSection />
        <StyleExplorer />
        <Personalization />
        <FeatureGrid
          id="why"
          eyebrow="Why Digital Tailor"
          title={
            <>
              Why <em>Digital Tailor?</em>
            </>
          }
          items={WHY_ITEMS}
        />
        <About />
        <Finale />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
