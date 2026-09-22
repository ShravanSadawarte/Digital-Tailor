import { useState } from "react";
import { Link } from "react-router-dom";
import { NAV_LINKS } from "../data/content";
import Brand from "./Brand";
import Modal from "./Modal";

const DEFAULT_EXPLORE = NAV_LINKS;

// Site footer with Privacy / Terms dialogs (no router required).
export default function Footer({
  tagline = "Your neighborhood tailor shop, now online. Kurtis, suits & gowns stitched to fit — made with ♥ in Nagpur, Maharashtra.",
  exploreLinks = DEFAULT_EXPLORE,
  signoff = "Measurements once · Direct UPI · Festival offers",
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
                  <Link to={href}>{label}</Link>
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
            Digital Tailor stores your account, measurements and orders so the tailor can
            stitch your garments. Reference and payment screenshots are used only for your
            order.
          </p>
          <p>
            The optional AI Studio creates styling prompts from preferences you enter — we
            never ask for your photo on this site. Anything you upload to an external AI
            service is covered by that service's own privacy policy.
          </p>
        </Modal>
      )}
      {modal === "terms" && (
        <Modal title="Terms" onClose={() => setModal(null)}>
          <p>
            Orders are stitched to your measurements. Payments go directly to the shop via
            UPI — share the UTR and screenshot so the tailor can confirm quickly.
          </p>
          <p>
            Final measurements, fabric and finishing are confirmed with the tailor before
            delivery. Festival timelines are shared at order time.
          </p>
        </Modal>
      )}
    </footer>
  );
}
