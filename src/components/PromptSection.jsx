import { SAMPLE_PROMPT } from "../data/content";
import PromptCard from "./PromptCard";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

// Prompt preview section: selling points left, live demo card right.
export default function PromptSection({
  id = "preview",
  eyebrow = "Prompt preview",
  title = (
    <>
      From your preferences <em>to the perfect prompt.</em>
    </>
  ),
  sub = "A realistic example of what Digital Tailor prepares for you.",
  points = [
    "Detailed enough for ChatGPT to work with.",
    "Protects what matters — your identity stays consistent.",
    "Yours to keep — use it anywhere you like.",
  ],
  prompt = SAMPLE_PROMPT,
}) {
  return (
    <section className="dt-section dt-section-alt" id={id}>
      <div className="dt-container dt-preview-grid">
        <div>
          <SectionHeading eyebrow={eyebrow} title={title} sub={sub} align="left" />
          <ul className="dt-preview-points">
            {points.map((p, i) => (
              <li key={p}>
                <span className="n">{i + 1}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <Reveal>
          <PromptCard prompt={prompt} />
        </Reveal>
      </div>
    </section>
  );
}
