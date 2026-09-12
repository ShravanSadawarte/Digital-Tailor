import { useState } from "react";
import { STEPS } from "../data/content";
import Button from "./Button";
import SectionHeading from "./SectionHeading";

// Stage visuals for the journey — each mirrors what the step describes.
function JourneyArt({ index }) {
  if (index === 0) {
    return (
      <div className="dt-jart" aria-hidden="true">
        <span className="dt-jpill">Festive</span>
        <span className="dt-jpill">Lavender</span>
        <span className="dt-jpill">Relaxed fit</span>
        <span className="dt-jpill">Silk</span>
        <span className="dt-jpill">Juttis</span>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="dt-jart" aria-hidden="true">
        <span className="dt-jdoc">
          <i />
          <i />
          <i className="short" />
          <b>⧉</b>
        </span>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="dt-jart" aria-hidden="true">
        <span className="dt-jphoto">
          ＋<small>Your photo</small>
        </span>
        <span className="dt-jarrow">→</span>
        <span className="dt-jchat">ChatGPT</span>
      </div>
    );
  }
  return (
    <div className="dt-jart" aria-hidden="true">
      <span className="dt-jframe">
        ✦<small>Preview</small>
      </span>
    </div>
  );
}

// Interactive journey: step tabs drive a swapping visual stage.
export default function Journey({
  id = "how",
  eyebrow = "How it works",
  title = (
    <>
      Your style, <em>one prompt away.</em>
    </>
  ),
  sub = "Tap a step — watch the story unfold.",
  steps = STEPS,
}) {
  const [active, setActive] = useState(0);
  const step = steps[active];
  return (
    <section className="dt-section" id={id}>
      <div className="dt-container">
        <SectionHeading eyebrow={eyebrow} title={title} sub={sub} align="left" />
        <div className="dt-journey">
          <div className="dt-journey-steps" role="tablist" aria-label="How it works steps">
            {steps.map((s, i) => (
              <button
                key={s.no}
                role="tab"
                id={`dt-jtab-${i}`}
                aria-selected={active === i}
                aria-controls="dt-jpanel"
                className={`dt-jstep${active === i ? " on" : ""}`}
                onClick={() => setActive(i)}
              >
                <span className="dt-jstep-no">{s.no}</span>
                <span className="dt-jstep-title">{s.title}</span>
                <span className="dt-jstep-check" aria-hidden="true">
                  {active === i ? "●" : "○"}
                </span>
              </button>
            ))}
          </div>
          <div className="dt-journey-stage">
            <div
              key={active}
              id="dt-jpanel"
              role="tabpanel"
              aria-labelledby={`dt-jtab-${active}`}
              className="dt-jpanel"
              tabIndex={0}
            >
              <JourneyArt index={active} />
              <div>
                <p className="dt-eyebrow">{step.no}</p>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                {active < steps.length - 1 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="dt-jnext"
                    onClick={() => setActive(active + 1)}
                  >
                    Next step →
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" className="dt-jnext" href="#preview">
                    Try the demo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Re-exported for pages that render the art standalone.
export { JourneyArt };
