# Digital Tailor — UI Specification (UI_SPEC)

> `CURRENT UI: NOT IMPLEMENTED`
> Below is the `RECOMMENDED` UI for future implementation.
> Frontend (planned): HTML5 + CSS3 + Vanilla JS, mobile-first, no framework.
>
> **Boundary (2026-09-11):** No in-site image generation, no "Generate Image" / "Try On" buttons,
> no image-generation loading states or galleries. The UI prioritizes preference selection,
> prompt preview, copy-to-clipboard, and ChatGPT instructions.

- Related: PRD.md (§10), ARCHITECTURE.md (§6), API_SPEC.md (§6), SECURITY.md (§12)
- Audience: primarily female customers; must feel elegant, modern, clean, trustworthy, image-oriented, easy to use — not excessively decorative. No single locked palette; use CSS variables so the tailor can adjust.

---

## 1. Design System (RECOMMENDED)

### CSS variables (define in `public/css/style.css`)

```css
:root {
  --bg: #fffaf7;            /* warm neutral, adjustable */
  --surface: #ffffff;
  --ink: #2b2220;           /* body text */
  --muted: #8a7d78;
  --border: #f0e4dc;
  --brand: #9d3b5e;         /* maroon-rose, adjustable */
  --brand-ink: #ffffff;
  --accent: #c9a24b;        /* gold, sparing use */
  --success: #1a7f37; --danger: #b42318; --warn: #9a6700;
  --radius: 14px; --radius-sm: 9px;
  --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px; --space-5: 40px;
  --font: Inter, system-ui, "Segoe UI", Roboto, "Noto Sans", sans-serif;
}
```

### Typography / Spacing / Components

- **Type:** system stack; H1 32–40 mobile / 44–56 desktop; body 16; small 14; line-height 1.5–1.6.
- **Buttons:** pill, 44px min height; variants primary (brand), secondary (outline), ghost; disabled state; loading spinner text ("Saving…" / "Generating prompt…"). No image-generation button variant exists.
- **Cards:** surface, 1px border, 14px radius, 16–24px padding; garment cards show catalog image (4:5), name, base price, "Customize →".
- **Forms:** label above input; help text under; inline error in danger color + `aria-describedby`; preference selects as cards/chips; numeric measurement inputs with `cm` suffix.
- **Prompt box:** readonly textarea + Copy Prompt button (clipboard API + fallback + "Copied ✓" confirmation) + Regenerate/Edit + Open ChatGPT link + numbered ChatGPT steps.
- **Modals:** confirm destructive actions (delete design/profile); focus trap + Esc.
- **Navigation:** top bar (logo, Garments, Prompt Studio, Offers, My Orders, Book Visit, Login/Account) + bottom tab bar on mobile (Home, Garments, Prompt, Orders, Account); breadcrumbs on detail pages.
- **Breakpoints:** `360 / 640 / 900 / 1200px`; grids collapse 4→2→1; touch targets ≥44px; catalog images lazy + `srcset`.

### Accessibility (every screen)

Semantic landmarks, one H1, labels for all inputs, visible focus, contrast ≥4.5:1 body, alt text on catalog images, keyboard-operable preference form, prompt readable by screen readers, `aria-live` for generation/loading/error/copy confirmations.

---

## 2. Screen Template (apply to every screen below)

```text
Screen: <name>
Route: <planned path, e.g. /customize.html?garment=3>
Purpose: <why it exists>
User: <customer | admin | public>
Components: <header/nav, hero/cards/forms, footer>
Inputs: <fields + types + constraints>
Actions: <buttons/links + result>
API calls: <API_SPEC IDs, e.g. API-G02, API-D01, API-P11>
Loading state: <skeleton/spinner>
Empty state: <message + CTA>
Error state: <message + retry>
Success state: <message + next step>
Responsive: <mobile behavior>
Accessibility: <notes>
```

---

## 3. Customer Screens (RECOMMENDED)

### Screen: Home — Route: `/index.html` — User: public
- **Purpose:** explain value ("Decide what to wear + get a ChatGPT-ready prompt"), drive to garments/prompt/offers/booking.
- **Components:** hero ("Decide what to wear — visualize it in ChatGPT"), CTA trio (Browse garments / Create prompt / Book visit), category strip, how-it-works (prompt flow), Today Special banner (admin-controlled), testimonials, contact strip, footer.
- **API:** API-G01 (featured), API-F01 (active offers).
- **States:** loading skeletons; empty (no offers → hide banner); error (retry).

### Screen: About — Route: `/about.html`
- Purpose: shop story, tailor intro, process, address/hours, prompt-vs-stitching explainer. Static + contact info.

### Screen: Garment Categories — Route: `/garments.html`
- Components: search + category filter chips + garment grid (catalog photos).
- API: API-G01, API-G03. Empty: "No garments in this category yet." Responsive: 2-col mobile grid.

### Screen: Garment Details — Route: `/garment.html?id=`
- Components: catalog gallery, base price, available options summary, CTAs "Customize this" / "Create prompt" / "Book visit".
- API: API-G02. Error: invalid id → friendly 404 + back link.

### Screen: Design Customizer — Route: `/customize.html?garment=`
- **Purpose:** core FR-004 experience (tailoring + styling prefs).
- **Inputs:** fabric_source (Own/Shop radio), fabric_detail, color (swatch + text), neck/sleeve/length/fit (option cards), embroidery, occasion/outfit/style/footwear/accessories/hairstyle/grooming/season/location/background/lighting (chips/selects + capped free-text), custom_notes.
- **Actions:** Save design (API-D01), Generate prompt (API-P12 → Prompt Studio), Upload tailoring reference (API-U01; labeled "fabric/design photo for the tailor — NOT your visualization photo").
- **States:** option images lazy; validation inline; success → "Saved to My Designs" + next-step links.

### Screen: Prompt Studio (Fashion Preference Selection + Prompt Result) — Routes: `/prompt.html`, `/preview.html?design=` — User: public/customer
- **Purpose:** core FR-006 experience. Two panels: (1) Fashion Preference Selection, (2) Prompt Result.
- **Panel 1 inputs:** occasion, outfit/garment, style, color, fit, fabric, footwear, accessories, hairstyle, grooming, background, lighting (+ season/location/photography style/extra prefs). Missing prefs allowed — system fills tasteful defaults.
- **Panel 2 result:** generated prompt (readonly), **Copy Prompt** button, **Regenerate/Edit** option, **Open ChatGPT** link, numbered instructions:
  1. Copy your personalized prompt.
  2. Open ChatGPT.
  3. Upload your photo.
  4. Paste the prompt.
  5. Generate your fashion visualization.
- **Notices (always visible):** BR-002 (informational only), BR-010 (Digital Tailor creates the prompt; ChatGPT performs the visualization), BR-011 + privacy note (photo goes to ChatGPT under its policies, never to Digital Tailor).
- **API:** API-P11/P12 (text out), API-P13 (history). No photo upload field exists on this screen by design.
- **States:** generating spinner ("Generating prompt…"); empty (no prefs yet → suggest occasion); error (validation/rate-limit + retry); success (prompt + "Copied ✓").

### Screen: Measurement — Route: `/measurements.html`
- Components: profile list + editor; garment_hint selector filters fields (PRD §8.2); per-field visual guide (tape-position illustration + text); cm inputs.
- API: API-M01…M05. Empty: "No profiles yet — create your first." Error: out-of-range highlighted.

### Screen: Login / Register — Routes: `/login.html`, `/register.html`
- Inputs per API-A01/A02; rate-limit message; generic login error (no enumeration); show/hide password; link between pages.

### Screen: Customer Dashboard — Route: `/dashboard/index.html` (auth: customer)
- Components: greeting, quick actions (incl. Prompt Studio), recent orders, recent prompts (text), next appointment, active offers count.
- API: API-O02, API-P02, API-F01, API-C01, API-P13.

### Screen: My Measurements — Route: `/dashboard/measurements.html`
- Same editor as `/measurements.html` but authed layout; default-profile badge.

### Screen: My Designs — Route: `/dashboard/designs.html`
- Grid of saved designs; actions: edit, duplicate (reorder seed), delete (confirm modal), "Order this", "Create prompt".

### Screen: My Orders — Route: `/dashboard/orders.html`
- List with status pills (color per status); filter by status; API-O02.

### Screen: Order Details — Route: `/dashboard/order.html?id=`
- Timeline of `order_status_history`, items + frozen options, measurement snapshot, offer line, appointment link, "Book trial visit".

### Screen: Offers — Route: `/offers.html`
- Cards with validity dates + scope + CTA "Use on new order"; API-F01.

### Screen: Appointment Booking — Route: `/appointments.html`
- Inputs: reason, datetime (future, shop-hours hint), order link, notes; API-P01; success shows confirmation + admin will confirm.

### Screen: Contact — Route: `/contact.html`
- Shop address/phone/WhatsApp/hours + form (name, phone, message) — stored or emailed per config (decide in Phase 11).

---

## 4. Admin Screens (RECOMMENDED, `/admin/*`, role=admin)

| Screen | Route (planned) | Key content / API |
|---|---|---|
| Admin Login | `/admin/login.html` | Same auth, admin role check; API-A02 |
| Dashboard | `/admin/index.html` | Counts (REQUESTED, STITCHING, trials due, today's appointments, active offers); API `GET /api/admin/summary` |
| Customers | `/admin/customers.html` | Search, list, detail (orders/profiles); deactivate |
| Garments | `/admin/garments.html` | CRUD categories/garments/options/pricing/catalog images; API-G10… |
| Designs | `/admin/designs.html` | View customer designs + styling prefs (read-only + notes) |
| Measurements | `/admin/measurements.html` | View profiles; confirm final on order (API-O05) |
| Orders | `/admin/orders.html` + `order.html?id=` | Filter by status; advance status (API-O04) with note; history visible |
| Appointments | `/admin/appointments.html` | Day list; confirm/complete/cancel (API-P03) |
| Offers | `/admin/offers.html` | CRUD + activate/deactivate + Today Special toggle (API-F02…F04) |
| Settings | `/admin/settings.html` | Shop hours, contact info, upload limits, ChatGPT URL (config constants; future) |

Admin tables: paginated, sortable by date, status filter chips; every mutation logs `admin_actions`. No generated-image moderation queue exists (nothing to moderate).

---

## 5. Copy & Imagery Guidance

- Plain language; avoid jargon ("Armhole" gets helper "around shoulder joint").
- Catalog/option photos: well-lit, consistent background; alt text ("Maroon straight-fit kurti with round neck"). Never present catalog photos as AI output.
- Prompt screen always carries the BR-002/BR-010/BR-011 + ChatGPT-steps block. Never imply Digital Tailor generates the image ("Create prompt" verbs only; ban "Generate image"/"Try on" labels unless explicitly re-approved).

---

*End of UI_SPEC. All screens RECOMMENDED; none implemented. Text-prompt boundary (2026-09-11) applies.*
