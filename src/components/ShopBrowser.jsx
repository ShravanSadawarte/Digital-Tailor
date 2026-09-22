import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { useCart, useWishlist } from "../cart/CartContext";
import Button from "./Button";
import MeasurementOnboarding from "./MeasurementOnboarding";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

// The full shop — father's catalog as a real store: search, filter, wishlist,
// add-to-cart, personalize. Lives on the home page (id="shop") so home IS the
// shop. Measurement onboarding appears once after login (skippable).
export default function ShopBrowser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart, count } = useCart();
  const { wishlist, toggleWish } = useWishlist();
  const [categories, setCategories] = useState([]);
  const [garments, setGarments] = useState([]);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [error, setError] = useState("");
  const [showMeasure, setShowMeasure] = useState(false);
  const [toast, setToast] = useState("");

  // First-login onboarding: only when logged in, no profiles, not skipped recently.
  useEffect(() => {
    if (!user || user.role === "admin") return;
    let skipped = null;
    try { skipped = localStorage.getItem("dt_measure_skip"); } catch { /* noop */ }
    if (skipped && Date.now() - Number(skipped) < 7 * 86400000) return;
    get("/measurements")
      .then((d) => {
        if (!d.data?.length) setShowMeasure(true);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    get("/categories").then((d) => setCategories(d.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (cat) params.set("category", cat);
      if (q) params.set("q", q);
      get(`/garments?${params}`)
        .then((d) => setGarments(d.data))
        .catch(() => setError("Shop is offline — start the API server."));
    }, 250);
    return () => clearTimeout(t);
  }, [cat, q]);

  const sorted = useMemo(() => {
    const list = [...garments];
    if (sort === "low") list.sort((a, b) => a.base_price - b.base_price);
    if (sort === "high") list.sort((a, b) => b.base_price - a.base_price);
    return list;
  }, [garments, sort]);

  function quickAdd(g) {
    addToCart({ garment_id: g.id, garment_name: g.name, base_price: g.base_price, estimate: g.base_price, title: g.name });
    setToast(`Added “${g.name}” to bag ✓`);
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <section className="dt-section shop-sec" id="shop">
      <div className="dt-container">
        <SectionHeading
          eyebrow={user ? `Welcome${user.name ? `, ${user.name.split(" ")[0]}` : ""} · Shop` : "Shop · stitched by father"}
          title={<>Father's collection, <em>stitched for you.</em></>}
          sub="Like shopping — pick a design, personalize it, add to bag. Measurements? Add now or later in Cart."
          align="left"
        />
        <div className="shop-actions">
          <Button variant="primary" size="sm" to="/customize">✦ Personalize a dress</Button>
          <Button variant="secondary" size="sm" to="/cart">🛍 Bag{count ? ` (${count})` : ""}</Button>
          {!user && <Button variant="secondary" size="sm" to="/login">Log in to order</Button>}
        </div>
        {toast && <p className="pg-ok" role="status">{toast}</p>}
        {error && <p className="pg-error" role="alert">{error}</p>}

        <div className="pg-toolbar">
          <div className="dt-chips pg-chips">
            <button className={`dt-chip${!cat ? " on" : ""}`} onClick={() => setCat("")}>All</button>
            {categories.map((c) => (
              <button key={c.id} className={`dt-chip${cat === c.slug ? " on" : ""}`} onClick={() => setCat(c.slug)}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="shop-tools">
            <input className="pg-search" placeholder="Search kurtis, suits…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products" className="pg-search">
              <option value="new">Newest</option>
              <option value="low">Price: low → high</option>
              <option value="high">Price: high → low</option>
            </select>
          </div>
        </div>

        <div className="shop-grid">
          {sorted.map((g, i) => {
            const wished = wishlist.some((w) => w.id === g.id);
            return (
              <Reveal key={g.id} className={`reveal-d${i % 4}`}>
                <article className="shop-card">
                  <div className={`dt-card-art dt-art-${i % 8}`} aria-hidden="true">
                    {g.image_path ? <img src={g.image_path} alt="" loading="lazy" /> : <span>{g.name[0]}</span>}
                    <button
                      className={`wish-btn${wished ? " on" : ""}`}
                      onClick={() => toggleWish(g)}
                      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                      title="Wishlist"
                    >
                      {wished ? "♥" : "♡"}
                    </button>
                  </div>
                  <div className="dt-card-body">
                    <p className="pg-muted pg-small">{g.category_name}</p>
                    <h3>{g.name}</h3>
                    <span className="pg-price">from ₹{Number(g.base_price).toFixed(0)}</span>
                    <div className="shop-card-btns">
                      <button className="pg-btn" onClick={() => quickAdd(g)}>Add to bag 🛍</button>
                      <button className="pg-btn pg-btn-ghost" onClick={() => navigate(`/customize?garment=${g.id}`)}>
                        Personalize ✦
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        {!error && sorted.length === 0 && (
          <p className="dt-sub">No pieces found. Try another search — or <Link to="/contact">ask the tailor</Link>.</p>
        )}
      </div>
      {showMeasure && (
        <MeasurementOnboarding onSaved={() => setShowMeasure(false)} onSkip={() => setShowMeasure(false)} />
      )}
    </section>
  );
}
