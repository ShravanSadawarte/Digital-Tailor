import { useEffect, useState } from "react";
import { NAV_LINKS } from "../data/content";
import Brand from "./Brand";
import Button from "./Button";

// Sticky site navbar: scroll-spy links, progress bar, mobile menu.
export default function Navbar({ links = NAV_LINKS }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#top");
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: "-38% 0px -55% 0px" }
    );
    links.forEach(([, href]) => {
      const s = document.querySelector(href);
      if (s) io.observe(s);
    });
    return () => io.disconnect();
  }, [links]);
  return (
    <header className={`dt-nav${scrolled ? " scrolled" : ""}`}>
      <span
        className="dt-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
      <div className="dt-container dt-nav-inner">
        <Brand />
        <nav className="dt-links" aria-label="Primary">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={active === href ? "active" : ""}
              aria-current={active === href ? "true" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <Button variant="primary" size="sm" href="#preview" className="dt-nav-cta">
          Try Digital Tailor
        </Button>
        <button
          className="dt-menu-btn"
          aria-expanded={open}
          aria-controls="dt-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      <nav id="dt-mobile-menu" className={`dt-mobile-menu${open ? " open" : ""}`} aria-label="Mobile">
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
        <a href="#finale" onClick={() => setOpen(false)}>
          Try Digital Tailor →
        </a>
      </nav>
    </header>
  );
}
