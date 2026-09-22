import { useEffect, useRef } from "react";
import Button from "./Button";

// Live look-book card: ambient video with parallax-aware overlays.
function HeroVisual({ videoSrc, tag, title, points, price, badges }) {
  const videoRef = useRef(null);
  const compoRef = useRef(null);
  // Calm users who prefer reduced motion: don't autoplay the ambience.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause();
    }
  }, []);
  // Subtle pointer parallax on the composition (fine pointers only).
  useEffect(() => {
    const stage = compoRef.current;
    if (!stage) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        stage.style.setProperty("--px", x.toFixed(3));
        stage.style.setProperty("--py", y.toFixed(3));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        stage.style.setProperty("--px", 0);
        stage.style.setProperty("--py", 0);
      });
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return (
    <div className="dt-stage dt-enter dt-enter-2" aria-hidden="true">
      <div className="dt-visual-compo" ref={compoRef}>
        <div className="dt-compo-bg" aria-hidden="true" />
        <div className="dt-portrait">
          <video
            ref={videoRef}
            className="dt-portrait-video"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            preload="auto"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="dt-portrait-content">
            <span className="dt-portrait-tag">{tag}</span>
            <h3>{title}</h3>
            <div className="dt-swatches">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <ul>
              {points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <span className="dt-portrait-price">{price}</span>
          </div>
        </div>
        {badges.map((b, i) => (
          <span key={b} className={`dt-style-chip dt-b${i + 1}`}>
            {b}
          </span>
        ))}
      </div>
      <div className="dt-prompt-float dt-float">
        <span className="dt-tag">How ordering works</span>
        <p>“Pick a design → add measurements → pay via UPI → tailor stitches & delivers.”</p>
        <span className="dt-prompt-copy">🛍 Shop the collection</span>
      </div>
    </div>
  );
}

// Home hero for local customers: the tailor shop first, AI studio second.
export default function Hero({
  kicker = "Nagpur's own tailor shop · now online",
  title = (
    <>
      Stitching that <em>fits you perfectly.</em>
    </>
  ),
  lead = "Shop father's kurtis, suits and gowns — or personalize your own dress with cloth, neck and sleeve designs. Add measurements once, pay directly via UPI, and get festive-ready stitching delivered in Nagpur.",
  primary = { label: "Shop the collection", to: "/#shop" },
  secondary = { label: "Personalize a dress", to: "/customize" },
  micro = "Save measurements once · Direct UPI, no extra charges · Diwali & festival offers live.",
  visual = {},
}) {
  return (
    <section className="dt-hero" id="top">
      <span className="dt-glow dt-glow-a" aria-hidden="true" />
      <span className="dt-glow dt-glow-b" aria-hidden="true" />
      <span className="dt-hero-word" aria-hidden="true">
        Style
      </span>
      <div className="dt-container dt-hero-grid">
        <div className="dt-hero-copy">
          <span className="dt-kicker">{kicker}</span>
          <h1>{title}</h1>
          <p className="dt-lead">{lead}</p>
          <div className="dt-hero-actions">
            <Button variant="primary" to={primary.to} href={primary.href}>
              {primary.label}
            </Button>
            <Button variant="secondary" to={secondary.to} href={secondary.href}>
              {secondary.label}
            </Button>
          </div>
          <p className="dt-micro">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="7" fill="none" stroke="#831C91" strokeWidth="1.6" />
              <path d="M8 7.2v3.4" stroke="#831C91" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="8" cy="5" r="1" fill="#831C91" />
            </svg>
            {micro}
          </p>
        </div>
        <HeroVisual
          videoSrc={`${import.meta.env.BASE_URL}hero-bg.mp4`}
          tag="FATHER'S FESTIVE EDIT · STITCHED IN NAGPUR"
          title="Kurtis & suits, made to measure"
          points={["Perfect-fit measurements", "Cloth, neck & sleeve of your choice", "Direct UPI · no extra charges"]}
          price="Stitching from ₹999"
          badges={["✦ Made in Nagpur", "🪔 Diwali ready"]}
          {...visual}
        />
      </div>
    </section>
  );
}
