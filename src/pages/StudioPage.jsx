import { useEffect, useState } from "react";
import { get, post } from "../api/client";
import Button from "../components/Button";
import PromptCard from "../components/PromptCard";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import PageShell from "./PageShell";

const FIELDS = [
  ["occasion", "Occasion", ["Festive (Diwali)", "Wedding", "Eid", "Navratri Nights", "Office", "Casual Day Out"]],
  ["outfit", "Outfit", ["Kurti + Palazzo Set", "Salwar Suit", "Pant Kurti", "One-Piece Dress", "Festive Gown"]],
  ["color", "Color", ["Emerald Green", "Royal Maroon", "Blush Pink", "Sky Blue", "Mustard Yellow", "Lavender"]],
  ["fabric", "Fabric", ["Cotton", "Silk", "Georgette", "Velvet", "Linen", "Chanderi"]],
  ["style", "Style", ["Traditional", "Modern", "Modest Festive", "Minimal Office"]],
  ["fit", "Fit", ["Relaxed", "Straight", "Tailored"]],
  ["footwear", "Footwear", ["Nude block heels", "Gold juttis", "Kolhapuris", "White sneakers"]],
  ["lighting", "Lighting", ["Soft natural daylight", "Warm festive glow", "Studio softbox light"]],
];

const DEFAULTS = Object.fromEntries(FIELDS.map(([k, , opts]) => [k, opts[0]]));

// Interactive prompt studio — preferences in, ChatGPT-ready text out.
export default function StudioPage() {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    get("/prompts/history?limit=5").then((d) => setHistory(d.data)).catch(() => setHistory(null));
  }, []);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const data = await post("/prompts/generate", prefs);
      setPrompt(data.prompt);
      get("/prompts/history?limit=5").then((d) => setHistory(d.data)).catch(() => {});
    } catch (e) {
      setError(e.code === "RATE_LIMITED" ? "Slow down — prompt quota reached. Try again in a bit." : "Could not reach the studio API. Is the server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <section className="dt-section">
        <div className="dt-container">
          <SectionHeading
            eyebrow="Prompt Studio"
            title={<>Design it. <em>Describe it.</em></>}
            sub="Choose your look — get a personalized prompt to visualize with your photo in ChatGPT."
            align="left"
          />
          <div className="pg-studio">
            <div className="pg-panel">
              <h3>Your preferences</h3>
              <p className="pg-muted">Everything the prompt needs.</p>
              {FIELDS.map(([key, label, opts]) => (
                <div className="pg-field" key={key}>
                  <label htmlFor={`st-${key}`}>{label}</label>
                  <select
                    id={`st-${key}`}
                    value={prefs[key]}
                    onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.value }))}
                  >
                    {opts.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}
              <Button variant="primary" onClick={generate} disabled={busy}>
                {busy ? "Generating…" : "✦ Generate my prompt"}
              </Button>
            </div>
            <div>
              {error && (
                <p className="pg-error" role="alert">
                  {error}
                </p>
              )}
              {prompt ? (
                <PromptCard key={prompt} prompt={prompt} />
              ) : (
                <div className="pg-panel pg-empty">
                  <h3>Your prompt appears here</h3>
                  <p className="pg-muted">Pick preferences and hit generate — then copy it into ChatGPT with your photo.</p>
                </div>
              )}
              <div className="pg-howto">
                <strong>Use it in ChatGPT:</strong>
                <ol>
                  <li>Copy your prompt above.</li>
                  <li>Open ChatGPT.</li>
                  <li>Upload your photo.</li>
                  <li>Paste the prompt.</li>
                  <li>Generate your visualization.</li>
                </ol>
              </div>
            </div>
          </div>
          {history && history.length > 0 && (
            <Reveal>
              <h3 className="pg-h3">Recent prompts</h3>
              <div className="pg-history">
                {history.map((h) => (
                  <button key={h.id} className="pg-history-item" onClick={() => setPrompt(h.prompt_text)}>
                    {h.prompt_text.slice(0, 90)}…
                  </button>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </PageShell>
  );
}
