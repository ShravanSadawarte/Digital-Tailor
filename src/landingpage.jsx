// Home page — home IS the shop for local customers.
// Order: hero → occasions → festival offers → FULL shop → personalize
// → how ordering works → why the shop → about → visit → finale.
import About from "./components/About";
import FeatureGrid from "./components/FeatureGrid";
import Finale from "./components/Finale";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Journey from "./components/Journey";
import Navbar from "./components/Navbar";
import OffersBar from "./components/OffersBar";
import PersonalizeCTA from "./components/PersonalizeCTA";
import ShopBrowser from "./components/ShopBrowser";
import Ticker from "./components/Ticker";
import VisitShop from "./components/VisitShop";
import { HOME_STEPS, HOME_WHY } from "./data/content";

function HomePage() {
  return (
    <div className="dt">
      <a className="dt-skip" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Ticker />
        <OffersBar />
        <ShopBrowser />
        <PersonalizeCTA />
        <Journey
          eyebrow="How ordering works"
          title={<>From idea to outfit, <em>in 4 steps.</em></>}
          sub="Order online or walk in — the tailor handles the rest."
          steps={HOME_STEPS}
        />
        <FeatureGrid
          id="why"
          eyebrow="Why our shop"
          title={
            <>
              Why <em>neighbors trust us.</em>
            </>
          }
          items={HOME_WHY}
        />
        <About />
        <VisitShop />
        <Finale />
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
