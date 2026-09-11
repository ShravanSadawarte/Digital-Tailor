// landingpage.jsx — Digital Tailor landing page (redesigned).
// Single-file page built from small components. Client-side only:
// no AI API calls, no image generation — the prompt card below is a
// static product demonstration visitors can copy.
import { useEffect, useRef, useState } from "react";
import "./App.css";

// Short demonstration prompt (kept concise on purpose).
const SAMPLE_PROMPT =
  "Create a realistic fashion visualization using the uploaded photo as the reference. " +
  "Keep the person's facial identity, body proportions, hairstyle, and natural appearance consistent. " +
  "Style them in a modern smart-casual outfit in navy and cream tones, relaxed tailored fit, soft daylight, " +
  "photorealistic, natural fabric drape.";

const STEPS = [
  {
    no: "STEP 01", title: "Choose Your Style",
    text: "Select your preferred occasion, outfit type, colors, fit, and overall style.",
    art: (<span className="mini-pick"><i className="a" /><i className="b" /><i className="c" /><b /></span>),
  },
  {
    no: "STEP 02", title: "Get Your AI Prompt",
    text: "Digital Tailor turns your preferences into a detailed, ready-to-use prompt.",
    art: (<span className="mini-doc"><i /><i /><i className="short" /><b>⧉</b></span>),
  },
  {
    no: "STEP 03", title: "Add Your Photo",
    text: "Copy the prompt and provide your photo in ChatGPT.",
    art: (<span className="mini-photo"><i className="sun" /><i className="mtn" /></span>),
  },
  {
    no: "STEP 04", title: "Visualize Your Look",
    text: "See how your selected style could look on you.",
    art: (<span className="mini-eye">✦</span>),
  },
];

const STYLES = [
  { title: "Casual", desc: "Easy everyday comfort that still looks put together." },
  { title: "Smart Casual", desc: "Polished but relaxed — dinners, dates, workdays." },
  { title: "Formal", desc: "Sharp tailoring for meetings and ceremonies." },
  { title: "Streetwear", desc: "Bold layers, sneakers and standout attitude." },
  { title: "Traditional", desc: "Festive classics with a modern tailored cut." },
  { title: "Party", desc: "Evening looks made to be noticed." },
  { title: "Date Night", desc: "Effortless, confident and memorable." },
  { title: "College", desc: "Fresh, affordable campus-ready outfits." },
];

const FACTORS = [
  ["◉", "Occasion"], ["◈", "Outfit type"], ["⬤", "Color preference"], ["▣", "Fit"],
  ["✦", "Style aesthetic"], ["❋", "Accessories"], ["⬔", "Footwear"], ["〜", "Overall vibe"],
];

const WHY = [
  { icon: "✦", title: "Personalized", text: "Recommendations based on your preferences." },
  { icon: "○", title: "Simple", text: "No complicated fashion terminology required." },
  { icon: "◇", title: "AI-Ready", text: "Get prompts designed for modern AI visual tools." },
  { icon: "♡", title: "Your Choice", text: "You decide the final look and where to use the prompt." },
];

// Fade-up on scroll; disabled automatically for reduced-motion users.
function Reveal({ className = "", children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

const NAV_LINKS = [
  ["Home", "#top"],
  ["How It Works", "#how"],
  ["Styles", "#styles"],
  ["About", "#about"],
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#top");
  const [progress, setProgress] = useState(0);
  const links = NAV_LINKS;
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
    NAV_LINKS.forEach(([, href]) => {
      const s = document.querySelector(href);
      if (s) io.observe(s);
    });
    return () => io.disconnect();
  }, []);
  return (
    <header className={`dt-nav${scrolled ? " scrolled" : ""}`}>
      <span className="dt-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="dt-container dt-nav-inner">
        <a className="dt-brand" href="#top" aria-label="Digital Tailor home">
          <span className="dt-brand-mark" aria-hidden="true">D</span>
          <span className="dt-brand-name">Digital Tailor<small>AI STYLING</small></span>
        </a>
        <nav className="dt-links" aria-label="Primary">
          {links.map(([label, href]) => (
            <a key={href} href={href} className={active === href ? "active" : ""} aria-current={active === href ? "true" : undefined}>{label}</a>
          ))}
        </nav>
        <a className="dt-btn dt-btn-primary dt-btn-sm dt-nav-cta" href="#preview">Try Digital Tailor</a>
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
          <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
        ))}
        <a href="#finale" onClick={() => setOpen(false)}>Try Digital Tailor →</a>
      </nav>
    </header>
  );
}

function Hero() {
  const videoRef = useRef(null);
  // Calm users who prefer reduced motion: don't autoplay the ambience.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause();
    }
  }, []);
  return (
    <section className="dt-hero" id="top">
      <span className="dt-glow dt-glow-a" aria-hidden="true" />
      <span className="dt-glow dt-glow-b" aria-hidden="true" />
      <span className="dt-hero-word" aria-hidden="true">Style</span>
      <div className="dt-container dt-hero-grid">
        <div className="dt-enter">
          <span className="dt-kicker">AI-assisted fashion styling</span>
          <h1>See Your Style <em>Before You Wear It.</em></h1>
          <p className="dt-lead">
            Discover personalized outfit ideas and turn them into ready-to-use AI prompts.
            Add your photo in ChatGPT and visualize your next look before you step out.
          </p>
            <div className="dt-hero-actions">
              <a className="dt-btn dt-btn-primary" href="#preview">Try Digital Tailor</a>
              <a className="dt-btn dt-btn-secondary" href="#how">How It Works</a>
            </div>
          <p className="dt-micro">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="#831C91" strokeWidth="1.6" /><path d="M8 7.2v3.4" stroke="#831C91" strokeWidth="1.6" strokeLinecap="round" /><circle cx="8" cy="5" r="1" fill="#831C91" /></svg>
            Personalized styling. Ready-to-use AI prompts. Your photo stays in your hands.
          </p>
        </div>

        <div className="dt-stage dt-enter dt-enter-2" aria-hidden="true">
          <div className="dt-visual-compo">
            <div className="dt-compo-bg" aria-hidden="true" />
            <div className="dt-portrait">
            <video
              ref={videoRef}
              className="dt-portrait-video"
              src={`${import.meta.env.BASE_URL}hero-bg.mp4`}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              preload="auto"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div className="dt-portrait-content">
              <span className="dt-portrait-tag">THE EMBROIDERY EDIT · Nº 04</span>
              <h3>White embroidered suit, live</h3>
              <div className="dt-swatches"><i /><i /><i /><i /><i /></div>
              <ul>
                <li>Chikankari-style embroidery</li>
                <li>Lace-detailed finish</li>
                <li>Relaxed straight fit</li>
              </ul>
              <span className="dt-portrait-price">Tailored from ₹999</span>
            </div>
          </div>
            <span className="dt-style-chip dt-b1">⧉ Embroidery edit</span>
            <span className="dt-style-chip dt-b2">✦ Festive ready</span>
          </div>
          <div className="dt-prompt-float dt-float">
            <span className="dt-tag">Your AI prompt</span>
            <p>“Create a realistic visualization… keep facial identity consistent… embroidered festive suit…”</p>
            <span className="dt-prompt-copy">⧉ Copy Prompt</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const items = ["Festive", "Wedding", "Smart Casual", "Traditional", "Streetwear", "Party", "Date Night", "College"];
  return (
    <div className="dt-marquee" aria-hidden="true">
      <div className="dt-marquee-track">
        {[0, 1].map((half) => (
          <div className="dt-marquee-half" key={half}>
            {items.map((t) => (
              <span key={`${half}-${t}`}>{t}<i>✦</i></span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="dt-section" id="how">
      <div className="dt-container">
        <Reveal className="dt-head-left">
          <p className="dt-eyebrow">How it works</p>
          <h2 className="dt-h2">Your style, <em>one prompt away.</em></h2>
        </Reveal>
        <div className="dt-steps" role="list">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} className={`reveal-d${i % 4}`}>
              <article className="dt-step" role="listitem">
                <div className={`dt-step-art dt-sart-${i}`} aria-hidden="true">{s.art}</div>
                <div className="dt-step-body">
                  <span className="dt-step-no">{s.no}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PromptPreview() {
  const [copied, setCopied] = useState(false);
  return (
    <section className="dt-section dt-section-alt" id="preview">
      <div className="dt-container dt-preview-grid">
        <Reveal>
          <p className="dt-eyebrow">Prompt preview</p>
          <h2 className="dt-h2">From your preferences <em>to the perfect prompt.</em></h2>
          <p className="dt-sub">A realistic example of what Digital Tailor prepares for you.</p>
          <ul className="dt-preview-points">
            <li><span className="n">1</span>Detailed enough for ChatGPT to work with.</li>
            <li><span className="n">2</span>Protects what matters — your identity stays consistent.</li>
            <li><span className="n">3</span>Yours to keep — use it anywhere you like.</li>
          </ul>
        </Reveal>
        <Reveal>
          <div className="dt-prompt-card">
            <div className="dt-prompt-card-inner">
              <div className="dt-prompt-head">
                <span>YOUR STYLING PROMPT</span>
                <span className="dt-dots" aria-hidden="true"><i /><i /><i /></span>
              </div>
              <p className="dt-prompt-text">“{SAMPLE_PROMPT}”</p>
              <div className="dt-prompt-foot">
                <span className="dt-prompt-meta">{SAMPLE_PROMPT.length} characters · demo text</span>
                <button
                  className="dt-copy-btn"
                  onClick={async () => { await copyText(SAMPLE_PROMPT); setCopied(true); }}
                  aria-live="polite"
                >
                  {copied ? "✓ Copied!" : "⧉ Copy Prompt"}
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StyleExplorer() {
  return (
    <section className="dt-section" id="styles">
      <div className="dt-container">
        <Reveal className="dt-head-left">
          <p className="dt-eyebrow">Style explorer</p>
          <h2 className="dt-h2">Find the look <em>that feels like you.</em></h2>
          <p className="dt-sub">Eight aesthetics to start from — every one becomes a personalized prompt.</p>
        </Reveal>
        <div className="dt-cards">
          {STYLES.map((s, i) => (
            <Reveal key={s.title} className={`reveal-d${i % 4}`}>
              <article className="dt-card">
                <div className={`dt-card-art dt-art-${i}`} aria-hidden="true"><span>{s.title[0]}</span></div>
                <div className="dt-card-body">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <a className="dt-card-go" href="#preview">Use this style →</a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Personalization() {
  const [picked, setPicked] = useState([]);
  const [copied, setCopied] = useState(false);
  function toggle(label) {
    setCopied(false);
    setPicked((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  }
  const snapshot =
    picked.length > 0
      ? `My Digital Tailor style — ${picked.join(" · ")}. Turn this into a photorealistic ChatGPT visualization prompt that keeps my facial identity and body proportions consistent.`
      : "Tap the ingredients of your style above — your snapshot appears here, ready to copy.";
  return (
    <section className="dt-section dt-section-alt" id="personalize">
      <div className="dt-container dt-center">
        <Reveal>
          <p className="dt-eyebrow">Personalization</p>
          <h2 className="dt-h2">Built around <em>your style.</em></h2>
          <p className="dt-sub">Tap what matters — your snapshot updates live.</p>
        </Reveal>
        <Reveal>
          <div className="dt-chips" role="group" aria-label="Style ingredients">
            {FACTORS.map(([glyph, label]) => (
              <button
                key={label}
                className={`dt-chip${picked.includes(label) ? " on" : ""}`}
                aria-pressed={picked.includes(label)}
                onClick={() => toggle(label)}
              >
                <i aria-hidden="true">{glyph}</i>{label}
              </button>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <div className="dt-snap">
            <p aria-live="polite">{snapshot}</p>
            <button
              className="dt-btn dt-btn-primary dt-btn-sm"
              disabled={picked.length === 0}
              onClick={async () => { await copyText(snapshot); setCopied(true); }}
            >
              {copied ? "✓ Copied!" : "⧉ Copy my style"}
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section className="dt-section" id="why">
      <div className="dt-container">
        <Reveal className="dt-head-left">
          <p className="dt-eyebrow">Why Digital Tailor</p>
          <h2 className="dt-h2">Why <em>Digital Tailor?</em></h2>
        </Reveal>
        <div className="dt-why">
          {WHY.map((f, i) => (
            <Reveal key={f.title} className={`reveal-d${i % 4}`}>
              <article className="dt-why-card">
                <span className="dt-why-icon" aria-hidden="true">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="dt-section dt-section-alt" id="about">
      <div className="dt-container dt-about">
        <Reveal>
          <div className="dt-about-figure" aria-hidden="true">
            <blockquote>“Good style starts before the first stitch — it starts with an idea.”</blockquote>
          </div>
        </Reveal>
        <Reveal>
          <p className="dt-eyebrow">About</p>
          <h2>From a real tailor shop to your screen.</h2>
          <p>
            Digital Tailor began as a small tailoring business helping customers choose fabrics,
            fits and designs. Now it helps you explore styles digitally first — then brings
            your favourite look to life with expert stitching.
          </p>
          <p>
            We don’t generate your photo. We help you describe your style so clearly that
            any modern AI visual tool can show it back to you.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Finale() {
  return (
    <section className="dt-section" id="finale">
      <div className="dt-container">
        <Reveal>
          <div className="dt-finale">
            <h2>Your next outfit <em>starts with an idea.</em></h2>
            <p>Turn that idea into a personalized AI styling prompt and see where your style can take you.</p>
            <div className="dt-finale-actions">
              <a className="dt-btn dt-btn-light" href="#preview">Try Digital Tailor</a>
              <a className="dt-btn dt-btn-ghost-light" href="#how">How It Works</a>
            </div>
            <div className="dt-finale-ticks" aria-label="Highlights">
              <span>✓ Free preview</span>
              <span>✓ No photo upload</span>
              <span>✓ Tailor-crafted finish</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="dt-modal-backdrop" onClick={onClose}>
      <div className="dt-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
        <button className="dt-btn dt-btn-primary dt-btn-sm dt-modal-close" onClick={onClose} autoFocus>Close</button>
      </div>
    </div>
  );
}

function Footer() {
  const [modal, setModal] = useState(null);
  return (
    <footer className="dt-footer">
      <div className="dt-container">
        <div className="dt-footer-grid">
          <div>
            <a className="dt-brand" href="#top" aria-label="Digital Tailor home">
              <span className="dt-brand-mark" aria-hidden="true">D</span>
              <span className="dt-brand-name">Digital Tailor<small>AI STYLING</small></span>
            </a>
            <p>Personalized fashion styling, powered by AI prompts.</p>
          </div>
          <nav aria-label="Footer">
            <h4>Explore</h4>
            <ul className="dt-footer-links">
              <li><a href="#top">Home</a></li>
              <li><a href="#how">How It Works</a></li>
              <li><a href="#styles">Styles</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h4>Legal</h4>
            <ul className="dt-footer-links">
              <li><button onClick={() => setModal("privacy")}>Privacy</button></li>
              <li><button onClick={() => setModal("terms")}>Terms</button></li>
            </ul>
          </nav>
        </div>
        <div className="dt-footer-base">
          <span>© 2026 Digital Tailor. All rights reserved.</span>
          <span>Prompts, not photos. Hero video via Pexels.</span>
        </div>
      </div>
      {modal === "privacy" && (
        <Modal title="Privacy" onClose={() => setModal(null)}>
          <p>Digital Tailor creates styling prompts from the preferences you enter. We never ask for your photo on this site.</p>
          <p>When you use your prompt with an external AI service such as ChatGPT, that service’s own privacy policy applies to anything you upload there.</p>
        </Modal>
      )}
      {modal === "terms" && (
        <Modal title="Terms" onClose={() => setModal(null)}>
          <p>Prompts are styling suggestions for inspiration. Visualizations produced elsewhere may differ from the final tailored garment.</p>
          <p>Final measurements, fabric and stitching are confirmed with the tailor before any order is made.</p>
        </Modal>
      )}
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="dt">
      <a className="dt-skip" href="#main">Skip to content</a>
      <Navbar />
      <main id="main">
        <Hero />
        <Ticker />
        <HowItWorks />
        <PromptPreview />
        <StyleExplorer />
        <Personalization />
        <Why />
        <About />
        <Finale />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
