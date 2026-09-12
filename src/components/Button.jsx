// Reusable CTA — an anchor when `href` is given, otherwise a <button>.
// variant: primary | secondary | light | ghost-light · size: "" | "sm"
export default function Button({ variant = "primary", size = "", href, children, className = "", ...rest }) {
  const cls = `dt-btn dt-btn-${variant}${size ? ` dt-btn-${size}` : ""}${className ? ` ${className}` : ""}`;
  if (href) {
    return (
      <a className={cls} href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} type="button" {...rest}>
      {children}
    </button>
  );
}
