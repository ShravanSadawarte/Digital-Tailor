import { TICKER_ITEMS } from "../data/content";

// Infinite occasion ribbon (pure CSS motion, pauses on hover).
export default function Ticker({ items = TICKER_ITEMS }) {
  return (
    <div className="dt-marquee" aria-hidden="true">
      <div className="dt-marquee-track">
        {[0, 1].map((half) => (
          <div className="dt-marquee-half" key={half}>
            {items.map((t) => (
              <span key={`${half}-${t}`}>
                {t}
                <i>✦</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
