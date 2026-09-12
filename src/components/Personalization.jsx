import { useState } from "react";
import { FACTORS } from "../data/content";
import Chip from "./Chip";
import CopyButton from "./CopyButton";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

function buildSnapshot(picked) {
  if (picked.length === 0) {
    return "Tap the ingredients of your style above — your snapshot appears here, ready to copy.";
  }
  return `My Digital Tailor style — ${picked.join(" · ")}. Turn this into a photorealistic ChatGPT visualization prompt that keeps my facial identity and body proportions consistent.`;
}

// Interactive picker: tapped ingredients compose a live, copyable snapshot.
export default function Personalization({
  id = "personalize",
  eyebrow = "Personalization",
  title = (
    <>
      Built around <em>your style.</em>
    </>
  ),
  sub = "Tap what matters — your snapshot updates live.",
  factors = FACTORS,
}) {
  const [picked, setPicked] = useState([]);
  function toggle(label) {
    setPicked((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }
  const snapshot = buildSnapshot(picked);
  return (
    <section className="dt-section dt-section-alt" id={id}>
      <div className="dt-container dt-center">
        <SectionHeading eyebrow={eyebrow} title={title} sub={sub} align="center" />
        <Reveal>
          <div className="dt-chips" role="group" aria-label="Style ingredients">
            {factors.map(([glyph, label]) => (
              <Chip
                key={label}
                glyph={glyph}
                selected={picked.includes(label)}
                onClick={() => toggle(label)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <div className="dt-snap">
            <p aria-live="polite">{snapshot}</p>
            <CopyButton
              key={picked.length}
              text={snapshot}
              idle="⧉ Copy my style"
              done="✓ Copied!"
              className="dt-btn dt-btn-primary dt-btn-sm"
              disabled={picked.length === 0}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
