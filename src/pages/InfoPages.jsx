import About from "../components/About";
import Button from "../components/Button";
import Finale from "../components/Finale";
import SectionHeading from "../components/SectionHeading";
import PageShell from "./PageShell";

export function AboutPage() {
  return (
    <PageShell>
      <About />
      <Finale />
    </PageShell>
  );
}

const VISIT = [
  { title: "Visit the shop", text: "Sitabuldi, Nagpur, Maharashtra — walk in for fabrics, measurements and trials." },
  { title: "Shop hours", text: "Monday to Saturday, 10am to 8pm. Sundays by appointment." },
  { title: "Book ahead", text: "Festive season fills fast — reserve a measurement or trial visit online." },
];

export function ContactPage() {
  return (
    <PageShell>
      <section className="dt-section">
        <div className="dt-container">
          <SectionHeading
            eyebrow="Contact"
            title={<>Come, <em>say hello.</em></>}
            sub="Fabric in hand or just an idea — the tailor is happy to meet you."
            align="left"
          />
          <div className="dt-cards">
            {VISIT.map((v, i) => (
              <article className="dt-card" key={v.title}>
                <div className={`dt-card-art dt-art-${i}`} aria-hidden="true">
                  <span>{["◉", "◷", "✎"][i]}</span>
                </div>
                <div className="dt-card-body">
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="pg-cta-row">
            <Button variant="primary" to="/dashboard">
              Book a visit
            </Button>
            <Button variant="secondary" to="/customize">
              Personalize a dress
            </Button>
          </div>
        </div>
      </section>
      <Finale />
    </PageShell>
  );
}

export function NotFoundPage() {
  return (
    <PageShell>
      <section className="dt-section">
        <div className="dt-container dt-center">
          <SectionHeading
            eyebrow="404"
            title={<>Lost <em>your way?</em></>}
            sub="That page doesn't exist — but great style does."
            align="center"
          />
          <Button variant="primary" to="/">
            Back home
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
