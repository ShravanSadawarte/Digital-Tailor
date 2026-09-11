# Digital Tailor

A women-focused fashion styling and AI prompt-generation platform for customized clothing — digitizing the real workflow of a tailoring business (browse → preferences → prompt → measure → order → fit → deliver).

> `CURRENT STATUS: NOT IMPLEMENTED` (application)
> Documentation: **UPDATED to prompt-generation direction (2026-09-11)**. No application functionality, APIs, tables, auth, or tests exist yet. Everything under "planned" is `PLANNED / RECOMMENDED` for future implementation.
>
> **Official direction:** **Digital Tailor → Personalized AI Fashion Prompt → User copies prompt → ChatGPT + user's photo → Fashion visualization.** Digital Tailor does NOT generate images and never handles the visualization photo.

---

## 1. Project Description

Digital Tailor supports the physical tailoring workflow digitally:

1. Customer browses garments (Salwar Suit, Kurti, Pant Kurti, Palazzo, One Piece, custom dresses).
2. She selects fashion preferences (occasion, outfit, style, color, fit, fabric, footwear, accessories, hairstyle, grooming, background, lighting + tailoring options).
3. The app generates a personalized **AI fashion visualization prompt** (text only).
4. She clicks **Copy Prompt**, opens **ChatGPT**, attaches **her own photo there**, pastes the prompt, and evaluates the visualization.
5. She saves reusable measurement profiles.
6. She submits an **order request** and books an **appointment**.
7. She visits the tailor for **final measurement confirmation + fabric handover**.
8. The tailor cuts, stitches, trials, adjusts, and delivers — updating **order status** throughout.

Relationship: `Customer → Digital Tailor → Tailor → Physical Garment` + external `Digital Tailor prompt → ChatGPT + photo → visualization`.

## 2. Business Problem

Visits required before any discussion; verbal-only design talk; paper measurements lost; no pre-stitch visualization; users unsure how to describe outfits to AI; no reusable profiles/history/reorder; word-of-mouth-only offers; status only by phone/visit. See `docs/PRD.md` §2.

## 3. Planned Features

- Garment catalog + structured customizer + fashion preference selection (FR-003/FR-004)
- Personalized AI fashion prompt generator — text only, copy + regenerate/edit + ChatGPT instructions (FR-006, informational only per BR-002/BR-010)
- Text-only prompt history (FR-027)
- Measurement profiles, saved/reused, tailor-confirmed (FR-005, BR-001)
- Order requests + tracking + reorder + history (FR-007/008/015/022)
- Admin-controlled offers incl. Today Special (FR-009/020; no automated mood-AI)
- Appointments (FR-010/019), tailoring reference uploads (FR-014; NOT visualization photos), contact (FR-021)
- Admin dashboard, customers, catalog/pricing, status management (FR-011/016–018/024)

NOT in scope: built-in image generation, virtual try-on, image APIs/inference, GPU infra, generated-image storage/galleries.

## 4. Target Users

- **Primary:** female customers (regular, occasion, first-time — see PRD personas).
- **Secondary:** tailor/admin managing designs, measurements, orders, offers, appointments.

## 5. Technology Stack (planned)

- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript (no framework; no React/Next.js in v1)
- **Backend:** Node.js + Express.js (REST, `/api`)
- **Database:** MySQL 8 (InnoDB)
- **AI:** ChatGPT-based prompt workflow (v1 = template prompt builder + user-driven copy/open; optional server-side text-LLM polish only, never image)
- **Not in v1:** MongoDB/Supabase/Firebase, GraphQL, Redis, Kafka, Kubernetes, microservices, GPU/image-generation models, virtual try-on, native mobile app

## 6. Planned Architecture

```text
Browser (HTML/CSS/JS) → Express REST API → MySQL
Frontend → Backend/API → Prompt Generation → AI Provider (text only) → Text Prompt
User → Digital Tailor prompt → Copy → ChatGPT + own photo (external) → visualization
```

Lightweight single-node deploy (reverse proxy + Node + MySQL + tailoring-uploads dir + daily backups; no GPU/image workers/CDN). Diagrams: `docs/ARCHITECTURE.md`.

## 7. Project Structure (planned; CURRENT: only docs + scaffolding)

```text
public/          # static frontend (PLANNED — not implemented)
src/             # Express backend (PLANNED — not implemented)
db/              # migrations + seeds (PLANNED — not implemented)
docs/            # documentation set (UPDATED 2026-09-11 — prompt direction)
.env.example     # required env vars template (no secrets; CHATGPT_URL + optional text-LLM vars)
README.md        # this file
```

> NOTE: This workspace may contain generic tooling scaffolding. It is NOT application functionality. Treat the app as empty per docs.

## 8. Documentation

- `docs/PRD.md` — product requirements, features (FR-xxx), rules (BR-xxx incl. BR-010/BR-011), NFRs
- `docs/TECH_SPEC.md` — stack, runtime, frontend/backend/DB/API/auth, tailoring uploads, text-only AI boundary, workflows
- `docs/ARCHITECTURE.md` — PLANNED diagrams (high-level, journey, auth, orders, measurements, prompt flow, lightweight deploy)
- `docs/DATABASE.md` — RECOMMENDED MySQL schema + ER diagram (text prompt history; no image tables)
- `docs/API_SPEC.md` — RECOMMENDED REST endpoints incl. text-only prompt APIs (no image endpoints; none exist)
- `docs/UI_SPEC.md` — RECOMMENDED screens incl. Prompt Studio + copy/ChatGPT instructions
- `docs/SECURITY.md` — IMPLEMENTED: none; MISSING: all; RECOMMENDED: full strategy incl. prompt-injection + key handling + photo boundary
- `docs/TEST_PLAN.md` — test strategy + TC-xxx/TC-Pxx cases (none implemented; no image tests)
- `docs/TASKS.md` — phased AI-executable roadmap (start at TASK-101; Phase 7 = prompt work)
- `docs/RULES.md` — mandatory rules incl. permanent §0 prompt-only product rule
- `docs/CHANGELOG.md` — history (0.1.0 foundation + 0.2.0 prompt direction)

## 9. Development Roadmap

- **Phase 0:** docs ✅ DONE (0.1.0 + 0.2.0 retarget)
- **Phase 1:** project setup (TASK-101…) → **Phase 2:** database → **Phase 3:** auth → **Phase 4:** customer/measurements → **Phase 5:** garments → **Phase 6:** customization/uploads → **Phase 7:** prompt generation → **Phase 8:** orders → **Phase 9:** appointments → **Phase 10:** offers → **Phase 11:** admin → **Phase 12:** QA/security → **Phase 13:** production
- Details: `docs/TASKS.md`. Implement ONE task at a time per `docs/RULES.md`.

## 10. Local Setup

> Implementation setup is **not yet available** — no runnable application exists.
> When Phase 1 begins, expected flow (RECOMMENDED): copy `.env.example` → `.env`, install MySQL 8 + Node LTS, `npm install`, `npm run migrate`, `npm run seed` (dev), `npm run dev`.

## 11. Testing

> Tests are **not yet implemented**. Strategy + cases: `docs/TEST_PLAN.md` (TC-xxx + TC-Pxx prompt tests; no image tests). Planned: `npm test` (unit/API/authz/prompt), manual UI/responsive/copy/E2E, performance + regression gates in Phase 12.

## 12. Security

Implemented: none. Recommended: Argon2id/bcrypt, cookie sessions + CSRF, RBAC server-side, parameterized SQL, XSS escaping + CSP, restricted CORS, rate limits (incl. prompt API), prompt-injection defenses, server-only AI keys (never frontend), validated tailoring uploads, visualization-photo prohibition, external-AI privacy disclosure. Full: `docs/SECURITY.md`.

## 13. AI Prompt Concept (official)

Preferences → prompt builder (deterministic template; optional text-LLM polish) → **Copy Prompt → Open ChatGPT → Attach Photo → Paste Prompt** → ChatGPT visualization (external). Text out, never an image. Informational only (BR-002/BR-010); photo never touches Digital Tailor (BR-011); ChatGPT terms apply externally. See PRD §10 + ARCHITECTURE §6.

## 14. Measurement Concept

Manual entry with visual guides (Phase 1) → saved reusable profiles (Phase 2) → future camera estimate labeled ESTIMATE (Phase 3) → tailor confirmation authoritative (Phase 4, BR-001). Fields per garment type (PRD §8). Future camera flow is estimates-only and unrelated to visualization photos.

## 15. Order Workflow (RECOMMENDED statuses)

`REQUESTED → CONFIRMED → MEASUREMENT_PENDING → MEASUREMENT_CONFIRMED → FABRIC_PENDING → CUTTING → STITCHING → TRIAL_READY → (ALTERATION) → READY → DELIVERED` (+ `CANCELLED`). Every transition logged. See PRD §12 + ARCHITECTURE §4.

## 16. Known Limitations

- No code, DB, API, auth, prompts, or tests exist; docs only.
- No built-in image generation or try-on by design; ChatGPT step needs internet + manual user action; offline degrades to saved drafts.
- No payment gateway, logistics, multi-branch, native app, or guaranteed-accurate auto-measurement in v1.
- Small-business scope: single shop, single-node lightweight deploy.

## 17. Future Enhancements

Responsive web first; later (only with explicit requirement + docs update): server-side text-LLM prompt polish, camera-measurement estimates, payments, SMS/WhatsApp notifications, native mobile app, multi-branch. Image generation stays out unless the permanent product rule (RULES §0) is explicitly changed.

---

*Status: documentation updated to prompt-generation direction (2026-09-11); implementation not started. Next: `docs/TASKS.md` TASK-101. Rules: `docs/RULES.md` (read §0 first).*
