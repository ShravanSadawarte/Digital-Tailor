import { useEffect } from "react";
import Button from "./Button";

// Accessible dialog — closes on Escape and backdrop click.
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="dt-modal-backdrop" onClick={onClose}>
      <div
        className="dt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
        <Button variant="primary" size="sm" className="dt-modal-close" onClick={onClose} autoFocus>
          Close
        </Button>
      </div>
    </div>
  );
}
