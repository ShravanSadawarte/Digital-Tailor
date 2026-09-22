import { Link } from "react-router-dom";

// Digital Tailor wordmark — shared by navbar and footer.
export default function Brand() {
  return (
    <Link className="dt-brand" to="/" aria-label="Digital Tailor home">
      <span className="dt-brand-mark" aria-hidden="true">
        D
      </span>
      <span className="dt-brand-name">
        Digital Tailor<small>AI STYLING</small>
      </span>
    </Link>
  );
}
