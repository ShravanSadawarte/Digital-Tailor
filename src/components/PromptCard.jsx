import { useEffect, useRef, useState } from "react";
import CopyButton from "./CopyButton";

// Dark prompt card: the demo prompt types itself out on first view,
// then copies with one click.
export default function PromptCard({ prompt, title = "YOUR STYLING PROMPT" }) {
  const [typed, setTyped] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? prompt : ""
  );
  const started = useRef(false);
  const boxRef = useRef(null);
  // Progressively reveal the demo prompt on first view (quick, ~1.6s).
  useEffect(() => {
    const el = boxRef.current;
    if (!el || started.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        let i = 0;
        const timer = setInterval(() => {
          i += 3;
          setTyped(prompt.slice(0, i));
          if (i >= prompt.length) clearInterval(timer);
        }, 14);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prompt]);
  const done = typed.length >= prompt.length;
  return (
    <div className="dt-prompt-card">
      <div className="dt-prompt-card-inner">
        <div className="dt-prompt-head">
          <span>{title}</span>
          <span className="dt-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
        <p className="dt-prompt-text" ref={boxRef}>
          <span className="dt-sr">“{prompt}”</span>
          <span aria-hidden="true">
            “{typed}
            {!done && <span className="dt-caret">▍</span>}”
          </span>
        </p>
        <div className="dt-prompt-foot">
          <span className="dt-prompt-meta">
            {prompt.length} characters · demo text
          </span>
          <CopyButton text={prompt} idle="⧉ Copy Prompt" done="✓ Copied!" />
        </div>
      </div>
    </div>
  );
}
