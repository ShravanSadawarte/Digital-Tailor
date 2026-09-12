import { useState } from "react";
import { NAV_LINKS } from "../data/content";
import Brand from "./Brand";
import Modal from "./Modal";

const DEFAULT_EXPLORE = NAV_LINKS;

// Site footer with Privacy / Terms dialogs (no router required).
export default function Footer({
  tagline = "Personalized fashion styling, powered by AI prompts. Made with ♥ in Nagpur, Maharashtra.",
  exploreLinks = DEFAULT_EXPLORE,
  signoff = "Prompts, not photos. Hero video via Pexels.",
}) {
  const [modal, setModal] = useState(null);
  return (
    <footer className="dt-footer">
      <div className="dt-container">
        <div className="dt-footer-grid">
          <div>
            <Brand />
            <p>{tagline}</p>
          </div>
          <nav aria-label="Footer">
            <h4>Explore</h4>
            <ul className="dt-footer-links">
              {exploreLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h4>Legal</h4>
            <ul className="dt-footer-links">
              <li>
                <button onClick={() => setModal("privacy")}>Privacy</button>
              </li>
              <li>
                <button onClick={() => setModal("terms")}>Terms</button>
              </li>
            </ul>
          </nav>
        </div>
        <div className="dt-footer-base">
          <span>© 2026 Digital Tailor. All rights reserved.</span>
          <span>{signoff}</span>
        </div>
      </div>
      {modal === "privacy" && (
        <Modal title="Privacy" onClose={() => setModal(null)}>
          <p>
            Digital Tailor creates styling prompts from the preferences you enter. We never
            ask for your photo on this site.
          </p>
          <p>
            When you use your prompt with an external AI service such as ChatGPT, that
            service’s own privacy policy applies to anything you upload there.
          </p>
        </Modal>
      )}
      {modal === "terms" && (
        <Modal title="Terms" onClose={() => setModal(null)}>
          <p>
            Prompts are styling suggestions for inspiration. Visualizations produced elsewhere
            may differ from the final tailored garment.
          </p>
          <p>
            Final measurements, fabric and stitching are confirmed with the tailor before any
            order is made.
          </p>
        </Modal>
      )}
    </footer>
  );
}
