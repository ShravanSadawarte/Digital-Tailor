// Reusable CTA — router Link when `to` is given, anchor for `href`
// (incl. #hash links), otherwise a <button>.
// variant: primary | secondary | light | ghost-light · size: "" | "sm"
import { Link } from "react-router-dom";

export default function Button({ variant = "primary", size = "", href, to, type = "button", children, className = "", ...rest }) {
  const cls = `dt-btn dt-btn-${variant}${size ? ` dt-btn-${size}` : ""}${className ? ` ${className}` : ""}`;
  if (to) {
    return (
      <Link className={cls} to={to} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a className={cls} href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} type={type} {...rest}>
      {children}
    </button>
  );
}
