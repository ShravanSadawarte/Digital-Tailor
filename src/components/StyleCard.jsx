import Reveal from "./Reveal";

// Selectable style card — keyboard-operable checkbox card.
export default function StyleCard({
  title,
  desc,
  index,
  selected = false,
  onToggle,
  actionHref = "#preview",
  actionLabel = "Use this style →",
  delay = 0,
}) {
  return (
    <Reveal className={`reveal-d${delay % 4}`}>
      <article
        className={`dt-card${selected ? " picked" : ""}`}
        role="checkbox"
        aria-checked={selected}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle?.();
          }
        }}
      >
        <div className={`dt-card-art dt-art-${index}`} aria-hidden="true">
          <span>{title[0]}</span>
          {selected && <b className="dt-picked">✓ Shortlisted</b>}
        </div>
        <div className="dt-card-body">
          <h3>{title}</h3>
          <p>{desc}</p>
          <a className="dt-card-go" href={actionHref} onClick={(e) => e.stopPropagation()}>
            {actionLabel}
          </a>
        </div>
      </article>
    </Reveal>
  );
}
