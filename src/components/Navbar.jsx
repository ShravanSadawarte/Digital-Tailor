import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { useCart } from "../cart/CartContext.jsx";
import { NAV_LINKS } from "../data/content";
import Brand from "./Brand";
import Button from "./Button";

// Sticky site navbar: route-aware links, progress bar, mobile menu.
export default function Navbar({ links = NAV_LINKS }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { count: bagCount } = useCart();
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close menu on navigation
    setOpen(false);
  }, [pathname]);
  const isActive = (href) => {
    const [path] = href.split("#");
    if (!path || path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };
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
            <Link
              key={href}
              to={href}
              className={isActive(href) ? "active" : ""}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link to="/cart" aria-label={`Shopping bag${bagCount ? `, ${bagCount} items` : ""}`} style={{ textDecoration: "none", fontWeight: 800, padding: "8px 10px" }}>
            🛍{bagCount ? ` ${bagCount}` : ""}
          </Link>
          <Button variant="secondary" size="sm" to={user ? "/profile" : "/login"} className="dt-nav-cta">
            {user ? user.name?.split(" ")[0] || "Profile" : "Log in"}
          </Button>
          <Button variant="primary" size="sm" to="/#shop" className="dt-nav-cta">
            Shop now
          </Button>
        </div>
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
          <Link key={href} to={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
        <Link to="/cart" onClick={() => setOpen(false)}>
          🛍 Bag{bagCount ? ` (${bagCount})` : ""} →
        </Link>
        <Link to={user ? "/profile" : "/login"} onClick={() => setOpen(false)}>
          {user ? "Profile →" : "Log in →"}
        </Link>
        <Link to="/customize" onClick={() => setOpen(false)}>
          Personalize ✦ →
        </Link>
      </nav>
    </header>
  );
}
