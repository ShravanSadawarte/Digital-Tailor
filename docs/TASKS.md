# Digital Tailor — Implementation Roadmap (TASKS)

> `CURRENT STATUS: Documentation updated to prompt-generation direction (2026-09-11); application NOT IMPLEMENTED.`
> Implement ONE task at a time (see RULES.md). Do not combine unrelated tasks.
> Every task is sized for one focused AI-agent change. Update CHANGELOG.md for meaningful changes.
>
> **Boundary:** No tasks for image-generation model integration, virtual try-on, GPU setup, image APIs,
> image storage/galleries, image inference, or image-optimization exist or shall be added without explicit re-approval (BR-010).

- Stack: HTML/CSS/Vanilla JS + Node/Express + MySQL (see TECH_SPEC.md). No extra deps without justification.
- Conventions: `TASK-XYZ` IDs; each task lists Objective, Dependencies, Files, Requirements, Acceptance, Testing, Security.

**Task template:**

```text
TASK ID: TASK-xxx
Title: ...
Objective: ...
Dependencies: ...
Files likely affected: ...
Implementation requirements: ...
Acceptance criteria: ...
Testing requirements: ...
Security considerations: ...
```

---

## Phase 0 — Documentation / Foundation ✅ DONE (updated 2026-09-11)

- [x] TASK-001…TASK-011 — Create docs/PRD…CHANGELOG + README (documentation set). No code.
- [x] TASK-012 — Retarget docs to prompt-generation direction (remove built-in image-gen/virtual try-on; ChatGPT copy-paste flow; text-only APIs/DB/tests). No code.

## Phase 1 — Project Setup (RECOMMENDED next)

```text
TASK ID: TASK-101
Title: Initialize Node.js project
Objective: Create package.json with pinned scripts for a no-framework frontend + Express backend.
Dependencies: Phase 0
Files likely affected: package.json, .gitignore, .nvmrc
Implementation requirements: npm init; scripts: dev (node --watch src/server.js), start, migrate, seed (dev), test, lint. No React/ORM/image libs.
Acceptance criteria: npm run dev fails only on missing src/server.js (created in TASK-102), not on config.
Testing requirements: npm run lint placeholder passes.
Security considerations: No secrets committed; .gitignore covers node_modules/.env/uploads.
```

```text
TASK ID: TASK-102
Title: Configure Express server skeleton
Objective: Minimal app factory + listen with health check.
Dependencies: TASK-101
Files likely affected: src/app.js, src/server.js, src/config/env.js, src/middleware/error.js, src/utils/errors.js
Implementation requirements: GET /healthz → {ok:true}; central error middleware (AppError → JSON); request-id; JSON body limit 100kb.
Acceptance criteria: node src/server.js serves /healthz 200.
Testing requirements: Manual curl; later TC-501 shape.
Security considerations: Hide X-Powered-By; generic 500s; no stack leak.
```

```text
TASK ID: TASK-103
Title: Environment configuration + .env.example
Objective: Fail-fast env loader per TECH_SPEC §12 + SECURITY §10 (CHATGPT_URL + optional text-LLM vars).
Dependencies: TASK-102
Files likely affected: src/config/env.js, .env.example, .gitignore, README.md (setup note)
Implementation requirements: Required vars PORT/DB_*/SESSION_SECRET; optional PROMPT_LLM_* (server-only); throw on missing required in non-test.
Acceptance criteria: Missing SESSION_SECRET aborts boot with clear message; .env.example has no secrets.
Testing requirements: Boot with/without vars.
Security considerations: Never log secret values; never expose PROMPT_LLM_API_KEY to frontend.
```

```text
TASK ID: TASK-104
Title: Logging + rate limiting + security headers
Objective: Baseline ops/safety middleware (incl. prompt-endpoint limits).
Dependencies: TASK-102
Files likely affected: src/app.js, src/middleware/rateLimit.js, src/utils/logger.js, package.json
Implementation requirements: pino/morgan request logs (no bodies/PII/photo data — none handled); express-rate-limit global + stricter prompt bucket; helmet-equivalent headers (CSP, nosniff, referrer).
Acceptance criteria: Responses include security headers; 429 after limit exceeded (incl. prompt route).
Testing requirements: TC-005/TC-P12 subset (headers + 429).
Security considerations: Log IDs/lengths only, never passwords/tokens/keys.
```

```text
TASK ID: TASK-105
Title: Static frontend shell + CSS variables
Objective: public/ shell (header/nav/footer) + style.css variables per UI_SPEC §1.
Dependencies: TASK-101
Files likely affected: public/index.html, public/css/style.css, public/js/api.js
Implementation requirements: Mobile-first shell; nav includes Prompt Studio; api.js fetch wrapper (JSON, credentials:include, error mapping); no innerHTML with user data.
Acceptance criteria: Static home renders at 360px without h-scroll.
Testing requirements: TC-503 subset (home).
Security considerations: api.js sends CSRF header hook point (Phase 3).
```

## Phase 2 — Database

```text
TASK ID: TASK-201
Title: MySQL connection pool
Objective: mysql2/promise pool with least-privilege app user.
Dependencies: TASK-103
Files likely affected: src/db/pool.js, src/config/db.js
Implementation requirements: Pool from env; connection test script; graceful failure message.
Acceptance criteria: npm run migrate:check connects or prints actionable error.
Testing requirements: TC-502 precondition.
Security considerations: App user without FILE/GRANT/SUPER; no creds in code.
```

```text
TASK ID: TASK-202
Title: Migration runner + initial schema (users, customer_profiles)
Objective: Versioned SQL migrations per DATABASE.md §3.1–3.2.
Dependencies: TASK-201
Files likely affected: db/migrations/001_users.sql, scripts/migrate.js, package.json
Implementation requirements: users (phone/email unique, role CHECK), customer_profiles 1:1; utf8mb4/InnoDB.
Acceptance criteria: Fresh DB migrates cleanly; re-run is idempotent.
Testing requirements: Migration up/down on test DB.
Security considerations: password_hash column only; no seeds with plaintext.
```

```text
TASK ID: TASK-203
Title: Catalog tables (categories, garments, garment_options incl. styling types)
Objective: Catalog schema per DATABASE.md §3.5–3.7.
Dependencies: TASK-202
Files likely affected: db/migrations/002_catalog.sql
Implementation requirements: FKs RESTRICT; option CHECK incl. occasion/style/footwear/accessory/hairstyle/background/lighting; price CHECKs; indexes.
Acceptance criteria: Cannot delete category with garments (RESTRICT).
Testing requirements: TC-301 precondition.
Security considerations: is_active gating (no hidden-item leak).
```

```text
TASK ID: TASK-204
Title: Measurement tables
Objective: measurement_profiles + measurement_values per DATABASE.md §3.3–3.4.
Dependencies: TASK-202
Files likely affected: db/migrations/003_measurements.sql
Implementation requirements: Composite PK, field_key CHECK, value CHECK, cascade on profile delete.
Acceptance criteria: Duplicate (profile,field) rejected; bad key rejected.
Testing requirements: TC-201…203 preconditions.
Security considerations: None beyond ownership (enforced in Phase 4).
```

```text
TASK ID: TASK-205
Title: Designs (+style prefs) + prompt_history + orders + history + offers + appointments + tailoring uploads tables
Objective: Remaining schema per DATABASE.md §3.8–3.18. No image-generation tables.
Dependencies: TASK-203, TASK-204
Files likely affected: db/migrations/004_designs_prompts_orders.sql, 005_offers_appointments.sql
Implementation requirements: customer_designs style columns + ai_prompt TEXT; prompt_history text-only; order status CHECK (12 values); history append-only; offer/appointment CHECKs; uploaded_references tailoring-only.
Acceptance criteria: Full schema builds from scratch; schema contains zero generated-image/image-job columns.
Testing requirements: TC-401/405 + TC-P14 preconditions.
Security considerations: No plaintext secrets; money DECIMAL; no photo blobs.
```

```text
TASK ID: TASK-206
Title: Dev seed data
Objective: Categories/garments/options (incl. styling) + sample offers (dev only).
Dependencies: TASK-205
Files likely affected: db/seeds/*.sql, scripts/seed.js
Implementation requirements: 5–7 categories, 8–12 garments, options incl. occasion/style; NO real PII; admin via CLI hasher (not seed); no AI images.
Acceptance criteria: npm run seed populates dev DB; prod guard refuses when NODE_ENV=production.
Testing requirements: TC-301/302 + TC-P01 use seeds.
Security considerations: Never seed passwords/tokens/keys.
```

## Phase 3 — Authentication

```text
TASK ID: TASK-301
Title: Password hashing utility
Objective: Argon2id (or bcrypt≥12) hash/verify helpers.
Dependencies: TASK-202
Files likely affected: src/utils/passwords.js, package.json
Implementation requirements: hash(password), verify(hash,password); min-length check lives in validator.
Acceptance criteria: Unit test hashes then verifies; wrong password fails.
Testing requirements: TC-003/004 unit subset.
Security considerations: Constant-time verify; never log passwords.
```

```text
TASK ID: TASK-302
Title: Register endpoint (API-A01)
Objective: POST /api/auth/register per API_SPEC.
Dependencies: TASK-301
Files likely affected: src/routes/auth.routes.js, src/controllers/auth.controller.js, src/services/auth.service.js
Implementation requirements: Validate, duplicate → 409, hash, INSERT users+customer_profiles, start session.
Acceptance criteria: TC-001/002 pass.
Testing requirements: TC-001/002.
Security considerations: Rate-limit; generic duplicates? (409 allowed for UX, no password oracle).
```

```text
TASK ID: TASK-303
Title: Login/logout/me (API-A02…A04) + session middleware
Objective: Cookie sessions + requireAuth.
Dependencies: TASK-302
Files likely affected: src/middleware/auth.js, auth routes/services
Implementation requirements: Session regenerate on login; destroy on logout; GET me.
Acceptance criteria: TC-003/004/006/007 pass.
Testing requirements: TC-003…007.
Security considerations: HttpOnly/Secure/SameSite; CSRF token hook (TASK-304).
```

```text
TASK ID: TASK-304
Title: CSRF + CORS lockdown
Objective: CSRF tokens for cookie-auth mutations; same-origin CORS.
Dependencies: TASK-303
Files likely affected: src/middleware/csrf.js, public/js/api.js, src/app.js
Implementation requirements: Issue/verify token; api.js attaches header; 403 on mismatch.
Acceptance criteria: Mutation without token → 403.
Testing requirements: Abuse test (missing token).
Security considerations: SECURITY §6–7.
```

```text
TASK ID: TASK-305
Title: RBAC middleware + admin bootstrap CLI
Objective: requireRole('admin') + create-admin script (hashed).
Dependencies: TASK-303
Files likely affected: src/middleware/requireRole.js, scripts/create-admin.js
Implementation requirements: Role from DB session; CLI prompts password, hashes, inserts admin.
Acceptance criteria: Customer → admin route = 403 (TC-008).
Testing requirements: TC-008.
Security considerations: CLI never echoes/saves plaintext.
```

## Phase 4 — Customer (profile + measurements + designs list)

```text
TASK ID: TASK-401
Title: Profile APIs (API-C01/C02) + dashboard profile UI
Objective: GET/PUT own profile.
Dependencies: TASK-303
Files likely affected: src/routes/customers.routes.js, public/dashboard/*, UI_SPEC dashboard
Implementation requirements: Ownership automatic; allow-list updatable fields.
Acceptance criteria: Update round-trips; other user's data unreachable.
Testing requirements: Manual + TC-009 pattern.
Security considerations: No role/phone takeover via this route.
```

```text
TASK ID: TASK-402
Title: Measurement CRUD APIs (API-M01…M05)
Objective: Profiles + values with garment-aware validation.
Dependencies: TASK-204, TASK-303
Files likely affected: src/routes/measurements.routes.js, services/measurements.service.js
Implementation requirements: Known keys only; per-field ranges; default-switch transaction; owner scoping.
Acceptance criteria: TC-201…205 pass.
Testing requirements: TC-201…205.
Security considerations: BR-005 owner checks; no mass-assignment.
```

```text
TASK ID: TASK-403
Title: Measurement UI (profiles + visual guides)
Objective: /measurements.html + dashboard page per UI_SPEC.
Dependencies: TASK-402
Files likely affected: public/measurements.html, public/js/measurements.js, public/css/*
Implementation requirements: Garment-hint filter; cm inputs; inline errors; empty/loading states.
Acceptance criteria: TC-503 measurement page; usability with example values.
Testing requirements: Manual responsive + TC-202 UI mapping.
Security considerations: Escape all rendered values.
```

## Phase 5 — Garments

```text
TASK ID: TASK-501
Title: Public catalog APIs (API-G01…G03)
Objective: Categories + active garments + details with options (incl. styling).
Dependencies: TASK-203, TASK-206
Files likely affected: src/routes/garments.routes.js, services/catalog.service.js
Implementation requirements: Pagination; inactive hidden; options grouped by type.
Acceptance criteria: TC-301 passes.
Testing requirements: TC-301.
Security considerations: No cost/internal fields leaked.
```

```text
TASK ID: TASK-502
Title: Catalog pages (list + details)
Objective: /garments.html + /garment.html?id= per UI_SPEC.
Dependencies: TASK-501
Files likely affected: public/garments.html, public/garment.html, public/js/garments.js
Implementation requirements: Filter chips, cards, skeletons, 404 handling; "Create prompt" CTA.
Acceptance criteria: Featured + search works on mobile.
Testing requirements: TC-503 catalog subset.
Security considerations: Alt text; escaped descriptions.
```

```text
TASK ID: TASK-503
Title: Admin catalog CRUD (API-G10… + UI)
Objective: Categories/garments/options/pricing/catalog-image management + admin_actions log.
Dependencies: TASK-305, TASK-501
Files likely affected: src/routes/admin.* , public/admin/garments.html
Implementation requirements: requireRole admin; price≥0; is_active toggling.
Acceptance criteria: Admin can add garment + option; appears publicly when active.
Testing requirements: Admin happy path + 403 for customer.
Security considerations: Validate image paths; log actions.
```

## Phase 6 — Customization (+ tailoring uploads)

```text
TASK ID: TASK-601
Title: Design CRUD APIs (API-D01…D05, incl. style prefs)
Objective: Save/validate customer designs + fashion preferences against garment_options.
Dependencies: TASK-501, TASK-303
Files likely affected: src/routes/designs.routes.js, services/designs.service.js
Implementation requirements: Option allow-list check; free-text caps + injection screening; notes ≤2000; owner scoping; delete cascades tailoring refs.
Acceptance criteria: TC-302/303 pass.
Testing requirements: TC-302/303.
Security considerations: BR-005; XSS-plain-text (escape on render); TC-P09 pattern.
```

```text
TASK ID: TASK-602
Title: Customizer + preference form UI
Objective: /customize.html per UI_SPEC (fabric/color/neck/sleeve/length/fit + occasion/style/footwear/etc.).
Dependencies: TASK-601
Files likely affected: public/customize.html, public/js/customize.js
Implementation requirements: Option cards/chips from API; example placeholder; save → My Designs; link to Prompt Studio.
Acceptance criteria: Full customization saves without staff help (S-01 subset).
Testing requirements: Manual E2E draft.
Security considerations: Server re-validates everything.
```

```text
TASK ID: TASK-603
Title: Tailoring reference uploads (API-U01) + UI hook
Objective: Validated fabric/design upload linked to design/order. NOT visualization photos.
Dependencies: TASK-601
Files likely affected: src/middleware/upload.js, services/uploads.service.js, customize UI
Implementation requirements: multer disk, MIME sniff, ext/size caps, random names, ownership check; label "for the tailor — NOT your ChatGPT photo".
Acceptance criteria: TC-304/305/306 pass.
Testing requirements: TC-304…306.
Security considerations: SECURITY §9 full checklist.
```

## Phase 7 — AI Fashion Prompt Generation (text only)

```text
TASK ID: TASK-701
Title: Prompt builder core + Generate Fashion Prompt API (API-P11)
Objective: Deterministic buildPrompt(preferences) → text prompt + validation + rate limit.
Dependencies: TASK-601
Files likely affected: src/utils/promptBuilder.js, public/js/prompt.js, src/routes/prompts.routes.js, services/prompts.service.js
Implementation requirements: Template covers occasion/outfit/colors/style/fit/fabric/footwear/accessories/hairstyle/grooming/season/location/bg/lighting/photo-style; identity-preservation + realistic-fit/fabric/skin + anti-artifact clauses; caps + injection screening; returns {prompt} text only; no photo fields.
Acceptance criteria: TC-P01…P08 pass.
Testing requirements: TC-P01…P08.
Security considerations: No PII invented; no external image call; TC-P09/P10 patterns.
```

```text
TASK ID: TASK-702
Title: Design-to-prompt regen (API-P12) + text prompt history (API-P13)
Objective: Regenerate from saved design; store text-only history rows.
Dependencies: TASK-701
Files likely affected: designs/prompts routes, prompt_history queries
Implementation requirements: Cache ai_prompt; insert prompt_history (inputs_snapshot + prompt_text); owner-scoped list.
Acceptance criteria: TC-P13/P14 pass.
Testing requirements: TC-P13/P14.
Security considerations: History text-only; truncated in admin logs.
```

```text
TASK ID: TASK-703
Title: Prompt Studio UI (copy + ChatGPT instructions + privacy messaging)
Objective: /prompt.html + /preview.html per UI_SPEC with copy/regenerate/edit + 5-step ChatGPT guide + BR-002/BR-010/BR-011 notices.
Dependencies: TASK-701, TASK-702
Files likely affected: public/prompt.html, public/preview.html, public/js/prompt-page.js
Implementation requirements: Copy button (clipboard + fallback + confirmation); Open ChatGPT (CHATGPT_URL); no photo upload field; no Generate Image/Try On buttons; offline-degraded draft view.
Acceptance criteria: TC-P15/P16 + TC-308 pass.
Testing requirements: TC-P15/P16, TC-308, TC-503 prompt subset.
Security considerations: Escape rendered prompt; privacy notice per SECURITY §12.
```

```text
TASK ID: TASK-704
Title: Prompt quality validation + security validation (incl. optional text-LLM wiring)
Objective: Fixture-based quality gates + injection/rate-limit/key-exposure checks. Optional server-side text-LLM polish only (never image).
Dependencies: TASK-701
Files likely affected: tests/prompt.* , services/prompts.service.js, docs/CHANGELOG.md
Implementation requirements: Personalized/non-generic/photorealistic/identity clauses asserted; PROMPT_LLM_* server-only if used; bundle scan for keys.
Acceptance criteria: TC-P05…P12 + TC-509 pass.
Testing requirements: TC-P05…P12, TC-509.
Security considerations: Keys never in frontend; TC-P09…P12.
```

## Phase 8 — Orders

```text
TASK ID: TASK-801
Title: Order creation (API-O01, transactional)
Objective: Design+profile+offer → REQUESTED with snapshots.
Dependencies: TASK-402, TASK-601, TASK-1001 (offer eligibility helper or stub)
Files likely affected: src/routes/orders.routes.js, services/orders.service.js
Implementation requirements: Recompute price; verify ownership; copy measurements (source customer); history row; single transaction.
Acceptance criteria: TC-401/402 pass.
Testing requirements: TC-401/402.
Security considerations: Never trust client total; BR-005.
```

```text
TASK ID: TASK-802
Title: Order read/tracking (API-O02/O03) + customer UI
Objective: My Orders + Order Details timeline per UI_SPEC.
Dependencies: TASK-801
Files likely affected: public/dashboard/orders.html, order.html
Implementation requirements: Status pills; history timeline; snapshot display.
Acceptance criteria: Customer sees own orders end-to-end (S-01).
Testing requirements: E2E draft.
Security considerations: Owner-only; 404 on others (TC-009).
```

```text
TASK ID: TASK-803
Title: Status transitions (API-O04) + admin UI + tailor measurement confirm (API-O05)
Objective: State machine guard + history + admin_actions + snapshot override (BR-001).
Dependencies: TASK-801, TASK-305
Files likely affected: services/orders.service.js (transitions), admin orders pages
Implementation requirements: Allowed-map from ARCHITECTURE §4; terminal immutable; tailor values source=tailor.
Acceptance criteria: TC-405/406/407 pass.
Testing requirements: TC-405…407.
Security considerations: BR-006 admin-only; BR-009 terminals.
```

## Phase 9 — Appointments

```text
TASK ID: TASK-901
Title: Appointment APIs (API-P01…P03)
Objective: Booking + admin moderation.
Dependencies: TASK-303, TASK-801 (optional order link)
Files likely affected: src/routes/appointments.routes.js, services/appointments.service.js
Implementation requirements: Future datetime; shop-hours constant; owner/admin scoping.
Acceptance criteria: TC-409/410 pass.
Testing requirements: TC-409/410.
Security considerations: Rate-limit creation; no slot enumeration abuse.
```

```text
TASK ID: TASK-902
Title: Appointment UIs (customer + admin day list)
Objective: /appointments.html + /admin/appointments.html per UI_SPEC.
Dependencies: TASK-901
Files likely affected: public/appointments.html, public/admin/appointments.html
Implementation requirements: Reason select, datetime-local, notes; admin confirm/complete/cancel.
Acceptance criteria: Book → admin confirms → customer sees CONFIRMED.
Testing requirements: Manual.
Security considerations: Escape notes.
```

## Phase 10 — Offers

```text
TASK ID: TASK-1001
Title: Offer engine (eligibility helper)
Objective: Pure isOfferEligible(order, offer, context) + unit tests.
Dependencies: TASK-205
Files likely affected: src/services/offers.service.js
Implementation requirements: Active, dates, scope, min_order, first-order-only, usage_limit checks.
Acceptance criteria: TC-403/404 unit subset green.
Testing requirements: TC-403/404.
Security considerations: Server-side only; no client override.
```

```text
TASK ID: TASK-1002
Title: Offer APIs + admin UI + customer list (API-F01…F04)
Objective: CRUD/activate/expire + public active list + order application (wired into TASK-801).
Dependencies: TASK-1001, TASK-305
Files likely affected: src/routes/offers.routes.js, public/offers.html, public/admin/offers.html
Implementation requirements: Percent/flat validation; Today Special toggle = is_active + title convention (NOT mood-AI).
Acceptance criteria: Admin creates offer <5 min (S-05); expired rejected.
Testing requirements: TC-403/404 + manual.
Security considerations: BR-004 admin-only mutation.
```

## Phase 11 — Admin

```text
TASK ID: TASK-1101
Title: Admin dashboard + customers + designs views
Objective: /admin/* summary + read-only customer/design/measurement views.
Dependencies: TASK-305, TASK-803, TASK-902
Files likely affected: public/admin/*, src/routes/admin.routes.js
Implementation requirements: Counts by status, today's appointments, active offers; paginated tables.
Acceptance criteria: S-05 dashboard subset; TC-008/009 admin paths.
Testing requirements: Manual + authz tests.
Security considerations: Minimal PII in logs (prompt text truncated); all views requireRole admin.
```

```text
TASK ID: TASK-1102
Title: Contact + settings (shop info/hours/ChatGPT URL)
Objective: /contact.html + admin settings constants.
Dependencies: TASK-105
Files likely affected: public/contact.html, src/config/constants.js
Implementation requirements: Address/phone/WhatsApp/hours; CHATGPT_URL constant; contact form storage decision documented.
Acceptance criteria: UI_SPEC contact screen complete.
Testing requirements: Manual.
Security considerations: Spam rate-limit on form.
```

## Phase 12 — QA / Security

```text
TASK ID: TASK-1201
Title: Automated suite (unit+API+authz+prompt) per TEST_PLAN
Objective: npm test covering TC-001…TC-410 + TC-P01…P16 critical paths.
Dependencies: All Phase 3–10 APIs
Files likely affected: tests/**/*.test.js, package.json
Implementation requirements: Test DB + rollback; supertest; prompt fixture suite; no prod data; no image tests.
Acceptance criteria: npm test green; TC-505/506/509 + TC-P09…P12 abuse tests included.
Testing requirements: Full TEST_PLAN §3.
Security considerations: Test secrets isolated (.env.test); keys never asserted present in client bundle.
```

```text
TASK ID: TASK-1202
Title: Security + responsive + copy + performance pass
Objective: Headers/CSP check, upload abuse, XSS/SQLi, prompt injection, 360px sweep, clipboard behavior, p95 timing (text).
Dependencies: TASK-1201
Files likely affected: docs/CHANGELOG.md, fixes across src/public
Implementation requirements: Fix findings; verify no Generate Image/Try On affordances; record in CHANGELOG Security section.
Acceptance criteria: S-07/S-08 (p95<2s, no critical findings, zero viz photos stored).
Testing requirements: TC-501…509 + TC-P15/P16.
Security considerations: SECURITY.md full review incl. §§9/12 photo boundary.
```

## Phase 13 — Production

```text
TASK ID: TASK-1301
Title: Production config + deploy + backup (lightweight)
Objective: Reverse-proxy TLS, PM2/systemd, MySQL backups, restore drill, monitoring. No GPU/image infra.
Dependencies: TASK-1202
Files likely affected: deploy/*, .env.example, README.md, docs/CHANGELOG.md
Implementation requirements: NODE_ENV=production; secure cookies; restricted CORS; prompt rate limits on; daily mysqldump (text-sized); uptime check.
Acceptance criteria: Health + backup restore tested; rollback documented; costs reflect no image infra.
Testing requirements: Smoke E2E on prod-like env (prompt→copy→order, no image step).
Security considerations: Rotate all secrets; least-privilege DB; no seeds.
```

---

*End of TASKS. Do NOT begin TASK-101 in this documentation phase — stop here per instructions.*
