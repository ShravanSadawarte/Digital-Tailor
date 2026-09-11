function App() {
  return (
    <div className="page">
      {/* Navbar */}
      <header className="nav">
        <div className="container nav-inner">
          <a href="#" className="logo">
            <span className="logo-mark">✂</span>
            Digital Tailor
          </a>
          <nav className="nav-links">
            <a href="#services">Services</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#reviews">Reviews</a>
          </nav>
          <div className="nav-cta">
            <a href="#contact" className="btn btn-dark">Book a fitting</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="badge">★ Rated 4.9 by 2,000+ happy customers</div>
            <h1>
              Perfect fit,
              <br />
              without the tailor shop visit.
            </h1>
            <p className="lead">
              Digital Tailor brings custom suits, alterations and wardrobe fixes
              to your door. Book online, get measured at home, and receive
              clothes that fit like they were made for you — because they were.
            </p>
            <div className="hero-actions">
              <a href="#pricing" className="btn btn-dark">Get started</a>
              <a href="#services" className="btn btn-outline">View services</a>
            </div>
            <div className="hero-stats">
              <div><strong>48h</strong><span>Express alterations</span></div>
              <div><strong>15k+</strong><span>Garments tailored</span></div>
              <div><strong>100%</strong><span>Fit guarantee</span></div>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-image">🧥</div>
            <div className="hero-card-body">
              <h3>Custom 2-piece suit</h3>
              <p>From design to doorstep in 14 days</p>
              <div className="hero-card-row">
                <span className="price">from $299</span>
                <span className="pill">● Free home fitting</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section section-soft">
        <div className="container">
          <p className="eyebrow">Services</p>
          <h2>Everything a tailor does, now digital</h2>
          <p className="sub">Transparent pricing, pickup & delivery included.</p>
          <div className="grid-4">
            <div className="card">
              <div className="icon">🤵</div>
              <h3>Custom Suits & Blazers</h3>
              <p>Made-to-measure from 200+ premium fabrics. Perfect for weddings and work.</p>
              <span className="link">from $299 →</span>
            </div>
            <div className="card">
              <div className="icon">👔</div>
              <h3>Shirts & Blouses</h3>
              <p>Collar, cuff and body cut to your exact measurements.</p>
              <span className="link">from $49 →</span>
            </div>
            <div className="card">
              <div className="icon">👖</div>
              <h3>Alterations & Repair</h3>
              <p>Hemming, tapering, zippers and resizing in 48 hours.</p>
              <span className="link">from $15 →</span>
            </div>
            <div className="card">
              <div className="icon">👰</div>
              <h3>Bridal & Occasion</h3>
              <p>Gowns, lehengas and dresses altered with extra care.</p>
              <span className="link">from $59 →</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2>Get tailored in 3 easy steps</h2>
          <div className="grid-3">
            <div className="step">
              <span className="step-num">1</span>
              <h3>Book online</h3>
              <p>Pick a service and time slot. We come to you or arrange free pickup.</p>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <h3>Get measured</h3>
              <p>Expert tailor takes 20+ measurements or guide yourself with video.</p>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <h3>Receive perfect fit</h3>
              <p>Delivered pressed and ready. Free re-fit if it's not perfect.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section section-soft">
        <div className="container">
          <p className="eyebrow">Pricing</p>
          <h2>Simple, honest pricing</h2>
          <p className="sub">Pickup, delivery and fit guarantee included in every plan.</p>
          <div className="grid-3">
            <div className="card price-card">
              <h3>Alteration</h3>
              <p className="amount">$15<span>/item+</span></p>
              <ul>
                <li>✓ Hemming & tapering</li>
                <li>✓ 48-hour turnaround</li>
                <li>✓ Free pickup & delivery</li>
              </ul>
              <a href="#contact" className="btn btn-outline full">Book now</a>
            </div>
            <div className="card price-card featured">
              <span className="flag">Most popular</span>
              <h3>Custom Shirt</h3>
              <p className="amount">$49<span>/shirt</span></p>
              <ul>
                <li>✓ Made-to-measure fit</li>
                <li>✓ 50+ fabrics & styles</li>
                <li>✓ Free re-fit guarantee</li>
              </ul>
              <a href="#contact" className="btn btn-dark full">Book now</a>
            </div>
            <div className="card price-card">
              <h3>Custom Suit</h3>
              <p className="amount">$299<span>/suit+</span></p>
              <ul>
                <li>✓ Home fitting session</li>
                <li>✓ 200+ premium fabrics</li>
                <li>✓ Delivered in 14 days</li>
              </ul>
              <a href="#contact" className="btn btn-outline full">Book now</a>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="section">
        <div className="container">
          <p className="eyebrow">Reviews</p>
          <h2>Loved by well-dressed people</h2>
          <div className="grid-3">
            <blockquote className="card">
              <p>“My wedding suit fit better than anything off the rack ever has. The home fitting was so easy.”</p>
              <footer>— Arjun M. ★★★★★</footer>
            </blockquote>
            <blockquote className="card">
              <p>“Hemmed 4 pairs of trousers in 2 days. Pickup and delivery were right on time.”</p>
              <footer>— Sarah K. ★★★★★</footer>
            </blockquote>
            <blockquote className="card">
              <p>“Finally shirts that fit my shoulders and arms. I’ve ordered 6 already.”</p>
              <footer>— David L. ★★★★★</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="section">
        <div className="container">
          <div className="cta">
            <div>
              <h2>Ready for clothes that actually fit?</h2>
              <p>Book your free home fitting today. No advance payment required.</p>
            </div>
            <form
              className="cta-form"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thanks! We'll contact you to schedule your fitting.");
              }}
            >
              <input type="text" placeholder="Your name" required aria-label="Your name" />
              <input type="tel" placeholder="Phone number" required aria-label="Phone number" />
              <button type="submit" className="btn btn-gold">Book free fitting</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <span className="logo"><span className="logo-mark">✂</span> Digital Tailor</span>
            <p>© 2026 Digital Tailor. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
            <a href="#reviews">Reviews</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
