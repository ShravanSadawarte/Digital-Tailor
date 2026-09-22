import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Button from "../components/Button";
import SectionHeading from "../components/SectionHeading";
import PageShell from "./PageShell";

function AuthShell({ title, sub, children }) {
  return (
    <PageShell>
      <section className="dt-section">
        <div className="dt-container">
          <div className="pg-narrow">
            <SectionHeading eyebrow="Account" title={title} sub={sub} align="center" />
            {children}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await login(identifier.trim(), password);
      navigate(u?.role === "admin" ? "/admin" : "/#shop");
    } catch {
      setError("Invalid phone/email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back." sub="Log in to shop father's collection, personalize dresses & pay via UPI — staff get the Admin dashboard.">
      <form className="pg-form" onSubmit={submit}>
        {error && (
          <p className="pg-error" role="alert">
            {error}
          </p>
        )}
        <div className="pg-field">
          <label htmlFor="login-id">Phone or email</label>
          <input id="login-id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" placeholder="e.g. 98765 43210" />
        </div>
        <div className="pg-field">
          <label htmlFor="login-pw">Password</label>
          <input id="login-pw" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <div className="pg-field">
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 500 }}>
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} style={{ width: "auto" }} /> Show password
          </label>
        </div>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in & shop →"}
        </Button>
        <p className="pg-muted">
          New here? <Link to="/register">Create an account</Link> · <Link to="/#shop">Browse shop as guest →</Link>
        </p>
        <p className="pg-muted pg-small">Shop staff? Log in with your admin phone to open the Admin dashboard — orders, products, designs, offers & visits.</p>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({ ...form, email: form.email || undefined });
      navigate("/#shop");
    } catch (err) {
      setError(err.code === "CONFLICT" ? "That phone or email is already registered." : "Please check your details (password needs 8+ characters).");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Join Digital Tailor." sub="Save measurements once, reorder forever.">
      <form className="pg-form" onSubmit={submit}>
        {error && (
          <p className="pg-error" role="alert">
            {error}
          </p>
        )}
        <div className="pg-field">
          <label htmlFor="reg-name">Full name</label>
          <input id="reg-name" value={form.name} onChange={set("name")} required minLength={2} autoComplete="name" />
        </div>
        <div className="pg-field">
          <label htmlFor="reg-phone">Phone</label>
          <input id="reg-phone" value={form.phone} onChange={set("phone")} required autoComplete="tel" />
        </div>
        <div className="pg-field">
          <label htmlFor="reg-email">Email (optional)</label>
          <input id="reg-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" />
        </div>
        <div className="pg-field">
          <label htmlFor="reg-pw">Password (8+ characters)</label>
          <input id="reg-pw" type="password" value={form.password} onChange={set("password")} required minLength={8} autoComplete="new-password" />
        </div>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </Button>
        <p className="pg-muted">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
