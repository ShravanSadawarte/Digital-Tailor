// Pill chip — a toggle button when `onClick` is given (with
// `aria-pressed`), otherwise a static span.
export default function Chip({ glyph, children, selected = false, onClick, label }) {
  const inner = (
    <>
      {glyph && <i aria-hidden="true">{glyph}</i>}
      {children}
    </>
  );
  if (!onClick) {
    return (
      <span className="dt-chip" aria-label={label}>
        {inner}
      </span>
    );
  }
  return (
    <button
      className={`dt-chip${selected ? " on" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}
