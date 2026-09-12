import Button from "./Button";
import Reveal from "./Reveal";

// Closing conversion panel.
export default function Finale({
  id = "finale",
  title = (
    <>
      Your next outfit <em>starts with an idea.</em>
    </>
  ),
  text = "Turn that idea into a personalized AI styling prompt and see where your style can take you.",
  primary = { label: "Try Digital Tailor", href: "#preview" },
  secondary = { label: "How It Works", href: "#how" },
  ticks = ["✓ Free preview", "✓ No photo upload", "✓ Tailor-crafted finish"],
}) {
  return (
    <section className="dt-section" id={id}>
      <div className="dt-container">
        <Reveal>
          <div className="dt-finale">
            <h2>{title}</h2>
            <p>{text}</p>
            <div className="dt-finale-actions">
              <Button variant="light" href={primary.href}>
                {primary.label}
              </Button>
              <Button variant="ghost-light" href={secondary.href}>
                {secondary.label}
              </Button>
            </div>
            <div className="dt-finale-ticks" aria-label="Highlights">
              {ticks.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
