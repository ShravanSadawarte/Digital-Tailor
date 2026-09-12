import Reveal from "./Reveal";

// Standard eyebrow + heading + subheading block. `title` accepts
// rich nodes (e.g. <>Find the look <em>like you.</em></>).
export default function SectionHeading({ eyebrow, title, sub, align = "center" }) {
  return (
    <Reveal className={align === "left" ? "dt-head-left" : "dt-center"}>
      {eyebrow && <p className="dt-eyebrow">{eyebrow}</p>}
      {title && <h2 className="dt-h2">{title}</h2>}
      {sub && <p className="dt-sub">{sub}</p>}
    </Reveal>
  );
}
