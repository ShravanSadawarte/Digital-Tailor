import Button from "./Button";
import Reveal from "./Reveal";

// Closing conversion panel — tailor-first for local customers.
export default function Finale({
  id = "finale",
  title = (
    <>
      Your festive outfit <em>starts here.</em>
    </>
  ),
  text = "Shop father's collection or personalize your own dress — measurements once, UPI direct, stitched in Nagpur.",
  primary = { label: "Shop the collection", to: "/#shop" },
  secondary = { label: "Personalize a dress", to: "/customize" },
  ticks = ["✓ Perfect-fit measurements", "✓ Direct UPI · no extra charges", "✓ Diwali & festival offers"],
}) {
  return (
    <section className="dt-section" id={id}>
      <div className="dt-container">
        <Reveal>
          <div className="dt-finale">
            <h2>{title}</h2>
            <p>{text}</p>
            <div className="dt-finale-actions">
              <Button variant="light" to={primary.to} href={primary.href}>
                {primary.label}
              </Button>
              <Button variant="ghost-light" to={secondary.to} href={secondary.href}>
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
