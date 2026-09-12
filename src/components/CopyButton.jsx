import { useCopy } from "../hooks/useCopy";

// One-click copy with auto-reverting success label.
export default function CopyButton({
  text,
  idle = "⧉ Copy",
  done = "✓ Copied!",
  className = "dt-copy-btn",
  ...rest
}) {
  const { copied, copy } = useCopy();
  return (
    <button className={className} aria-live="polite" onClick={() => copy(text)} {...rest}>
      {copied ? done : idle}
    </button>
  );
}
