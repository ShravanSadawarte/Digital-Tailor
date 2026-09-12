import { useState } from "react";
import { STYLES } from "../data/content";
import SectionHeading from "./SectionHeading";
import StyleCard from "./StyleCard";

// Shortlistable style gallery.
export default function StyleExplorer({
  id = "styles",
  eyebrow = "Style explorer",
  title = (
    <>
      Find the look <em>that feels like you.</em>
    </>
  ),
  sub = "Eight aesthetics to start from — tap one to shortlist it.",
  styles = STYLES,
}) {
  const [selected, setSelected] = useState(null);
  return (
    <section className="dt-section" id={id}>
      <div className="dt-container">
        <SectionHeading eyebrow={eyebrow} title={title} sub={sub} align="left" />
        <div className="dt-cards">
          {styles.map((s, i) => (
            <StyleCard
              key={s.title}
              title={s.title}
              desc={s.desc}
              index={i}
              delay={i}
              selected={selected === s.title}
              onToggle={() => setSelected(selected === s.title ? null : s.title)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
