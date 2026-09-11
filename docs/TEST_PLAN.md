# Digital Tailor — Test Plan (TEST_PLAN)

> `CURRENT TESTS: NOT IMPLEMENTED`
> No unit, integration, API, DB, auth, UI, E2E, performance, or security tests exist.
> Below is the complete RECOMMENDED testing strategy for future implementation.
>
> **Boundary (2026-09-11):** No image-generation tests exist or are planned (no resolution/latency/GPU
> inference/model-accuracy/image-storage/queue tests). Prompt tests assert **text quality, mapping,
> safety, and copy behavior** — never image output.

- Related: PRD.md (§10), API_SPEC.md (§6), DATABASE.md, UI_SPEC.md, SECURITY.md, TASKS.md
- Planned runner (RECOMMENDED): `vitest`/`jest` + `supertest` for API; manual checklist for UI/responsive/copy-to-clipboard; `npm test`, `npm run test:e2e` scripts (to be created in Phase 1).

---

## 1. Strategy

| Level | Scope | How (RECOMMENDED) |
|---|---|---|
| Unit | `promptBuilder`, offer eligibility, status-transition guard, validators | Pure-function tests, no DB; prompt tests use fixture preferences |
| Integration | Services + MySQL (transactions, FKs, history rows, text prompt history) | Test DB, migrations, rollback per test |
| API | Every API_SPEC endpoint incl. prompt endpoints: happy + validation + authz + rate limit | `supertest` against Express app; prompt APIs assert text-out |
| Auth/Authz | Register/login/logout/me, role gates, ownership (incl. prompts) | Dedicated suite (TC-0xx/1xx) |
| Validation | Bad bodies, ranges, enums, file types, prompt caps/injection | Per-endpoint cases |
| Security | XSS, SQLi, CSRF, rate limit, upload abuse, prompt injection, key non-exposure | Abuse-case tests + headers + bundle scan for keys |
| UI | Screens per UI_SPEC incl. Prompt Studio: loading/empty/error/success/copy | Manual + optional Playwright later |
| Responsive | 360/768/1024/1440px | Manual checklist + screenshots |
| Browser | Chrome/Edge/Firefox/Safari (last 2) | Smoke suite incl. clipboard fallback |
| E2E | Browse→preferences→prompt→copy→order→track→reorder | Scripted manual run (Phase 12); ChatGPT step verified by instructions presence, not by image |
| Performance | p95 list pages + p95 prompt generation (text) | Simple timing + `EXPLAIN` on slow queries |
| Regression | Re-run authz + prompt + order + offer suites before release | CI or `npm test` gate |

---

## 2. Test Case Format

```text
Test ID: TC-xxx
Feature: FR-xx / API-xx
Scenario: <what>
Preconditions: <data/auth>
Steps: <numbered>
Expected Result: <observable>
Priority: <Critical/High/Medium/Low>
```

---

## 3. Test Cases (RECOMMENDED, implement in Phase 12)

### Auth / Session

```text
TC-001 | FR-001/API-A01 | Registration happy path | none | 1.POST valid register 2.assert 201+cookie | 201, user role customer | Critical
TC-002 | FR-001 | Duplicate phone rejected | existing user | POST same phone | 409 CONFLICT | High
TC-003 | FR-002/API-A02 | Login happy path | registered | POST correct creds | 200 + session | Critical
TC-004 | FR-002 | Invalid login generic error | registered | POST wrong password | 401 generic, no enumeration | Critical
TC-005 | FR-002 | Rate limiting | fresh IP | exceed login attempts | 429 + Retry-After | High
TC-006 | Auth | Logout destroys session | logged in | POST logout → GET me | 204 then 401 | High
TC-007 | Auth | Unauthenticated blocked | none | GET /api/orders w/o cookie | 401 | Critical
TC-008 | FR-023 | Admin-only blocked for customer | customer session | PATCH order status | 403 FORBIDDEN | Critical
TC-009 | BR-005 | Customer cannot read another's order | A+ B users, B order | A GET B order id | 404 (or 403 per doc) | Critical
TC-010 | BR-005 | Customer cannot read another's measurements | as above | GET /api/measurements/:otherId | 404/403 | Critical
```

### Measurements

```text
TC-201 | FR-005/API-M02 | Create profile happy path | login | POST valid kurti values | 201 + values round-trip | Critical
TC-202 | Validation | Invalid measurement rejected | login | POST bust=5 / unknown key / string | 400 VALIDATION_ERROR | High
TC-203 | Validation | Missing required field for hint | login | hint kurti w/o bust | 400 | High
TC-204 | FR-005 | Default profile switch | 2 profiles | PUT is_default | exactly one default | Medium
TC-205 | FR-005 | Delete profile keeps order snapshot | order using profile | DELETE profile → GET order | 204; order snapshot intact | High
```

### Garments / Customization / Uploads

```text
TC-301 | FR-003/API-G01 | Public catalog lists active only | seeded inactive item | GET /api/garments | excludes inactive | High
TC-302 | FR-004/API-D01 | Create design happy path | login+garment | POST valid options+prefs | 201 + ai_prompt text present | Critical
TC-303 | Validation | Invalid option value rejected | login | POST neck=not-in-options | 400 | High
TC-304 | FR-014/API-U01 | Upload valid tailoring ref | login+design | POST jpg <5MB | 201 | High
TC-305 | Security | Upload PHP/exe rejected | login | POST .php/.exe or spoofed MIME | 400 INVALID_FILE | Critical
TC-306 | Security | Oversize upload rejected | login | POST 10MB png | 400/413 | High
```

### Prompt generation (FR-006/FR-027, API-P11…P13 — text only)

```text
TC-P01 | FR-006/API-P11 | Prompt generation happy path | prefs fixture | POST full prefs | 200 prompt contains outfit+color+fit+fabric | Critical
TC-P02 | Mapping | Preference-to-prompt mapping | prefs | POST with footwear+accessories+lighting | prompt contains each selected value | High
TC-P03 | Missing prefs | Defaults without invention | minimal prefs | POST occasion only | 200 coherent prompt, no PII invented | High
TC-P04 | Consistency | Deterministic template | same prefs twice | POST twice | identical prompt text | High
TC-P05 | Identity | Identity-preservation instructions | any prefs | inspect prompt | contains photo-reference + identity/face/proportion + photorealistic clauses | Critical
TC-P06 | Clothing | Clothing accuracy | kurti prefs | inspect prompt | garment+neck+sleeve+length+embroidery described | High
TC-P07 | Length | Prompt length caps | max-length prefs | POST | prompt ≤4000 chars; over-long input → 400 | Medium
TC-P08 | Quality | No generic/empty prompt | prefs | POST | prompt specific, not "nice outfit"; includes bg+lighting when given | Medium
TC-P09 | Security | Malicious input neutralized | XSS/prompt-break attempt | POST <script>/ignore-instructions | 400 or sanitized text, no execution | Critical
TC-P10 | Security | Prompt injection rejected | system-override attempt | POST "ignore previous instructions…" | 400 PROMPT_INVALID or neutralized | Critical
TC-P11 | Validation | Photo field rejected | login | POST with photo/base64 | 400 (photos go to ChatGPT, not API) | High
TC-P12 | Rate limit | Prompt throttled | fresh IP/user | exceed prompt quota | 429 + Retry-After | High
TC-P13 | API | Design prompt regen (API-P12) | design | POST twice | same text + history row | High
TC-P14 | API | Prompt history text-only (API-P13) | history rows | GET history | rows have prompt_text, no image fields | Medium
TC-P15 | UI | Copy Prompt works | prompt screen | click Copy | clipboard text == prompt; fallback + "Copied" shown | High
TC-P16 | UI | ChatGPT steps + privacy notices visible | prompt screen | render | 5-step instructions + BR-002/BR-010/BR-011 present | High
TC-308 | UI | BR-002 disclaimer visible | prompt screen | render | disclaimer text present | Medium
```

### Orders / Offers / Appointments

```text
TC-401 | FR-007/API-O01 | Order creation happy path | design+profile | POST order | 201 REQUESTED, history row, snapshot rows | Critical
TC-402 | Validation | Invalid order (other's design) | other user's design | POST order | 404/403 | Critical
TC-403 | FR-009 | Expired offer rejected | expired offer | POST order with offer_id | 400 OFFER_EXPIRED | High
TC-404 | FR-009 | First-order-only enforced | repeat customer | apply first-order offer | 400 OFFER_INVALID | High
TC-405 | FR-016/API-O04 | Valid status transition | REQUESTED order, admin | PATCH → CONFIRMED | 200 + history row | Critical
TC-406 | Validation | Invalid transition rejected | REQUESTED order, admin | PATCH → DELIVERED | 400 INVALID_TRANSITION | High
TC-407 | BR-001/API-O05 | Tailor measurement override | order, admin | confirm-measurements | snapshot source=tailor | Critical
TC-408 | FR-015 | Reorder clones design | past order | clone → new order | new REQUESTED order | Medium
TC-409 | FR-010/API-P01 | Past appointment rejected | login | POST past datetime | 400 | High
TC-410 | FR-019/API-P03 | Admin confirms appointment | REQUESTED appt | PATCH CONFIRMED | 200 | High
```

### Failure / Security / UI

```text
TC-501 | NFR | API failure shape | any | force 500 (mock DB down) | {error:{code:INTERNAL_ERROR}} no stack/SQL leak | High
TC-502 | NFR | DB failure page | stop test DB | load orders page | friendly error + retry, no crash | High
TC-503 | UI | Mobile layout 360px | — | render Home/Customizer/Prompt/Orders | no h-scroll, targets ≥44px, copy works | High
TC-504 | Browsers | Smoke on 4 browsers | seeded | browse→prompt→login→track | pass | Medium
TC-505 | Security | XSS escaped (incl. prompt) | login | save notes=<script> → view + prompt | rendered as text, no execution + CSP header | Critical
TC-506 | Security | SQLi blocked | — | identifier "' OR '1'='1" | 400/401, no data leak | Critical
TC-507 | Perf | Lists + prompt p95 <2s | 1k orders | time GET orders + POST prompts | <2s + EXPLAIN uses index | Medium
TC-508 | Regression | Full authz+prompt+order+offer rerun | release cand. | npm test | green | High
TC-509 | Security | AI keys never in frontend | built assets | grep bundle for PROMPT_LLM_API_KEY | no match | Critical
```

> Removed (2026-09-11, not applicable): generated-image resolution, image-generation latency, GPU inference, image-model accuracy, generated-image storage, image-queue tests.

---

## 12. Requirement Traceability Matrix (RECOMMENDED — keep updated)

| Requirement | API | Database | UI | Test | Task |
|---|---|---|---|---|---|
| FR-001 Register | API-A01 | users | Register | TC-001/002 | TASK-301… |
| FR-002 Login | API-A02…A04 | users | Login | TC-003…006 | TASK-30x |
| FR-003 Browse | API-G01…G03 | categories/garments/options | Garments | TC-301 | Phase 5 |
| FR-004 Customize+prefs | API-D01…D05 | customer_designs | Customizer | TC-302/303 | Phase 6 |
| FR-005 Measure | API-M01…M05 | measurement_profiles/values | Measurements | TC-201…205 | Phase 4 |
| FR-006 Prompt gen | API-P11/P12 | customer_designs.ai_prompt + prompt_history (text) | Prompt Studio | TC-P01…P16 | Phase 7 |
| FR-007 Order create | API-O01 | orders/items/order_measurements/history | Order Details | TC-401/402 | Phase 8 |
| FR-008 Tracking | API-O02/O03 | order_status_history | My Orders | E2E | Phase 8 |
| FR-009 Offers | API-F01…F04 | offers/offer_usage | Offers | TC-403/404 | Phase 10 |
| FR-010 Appointments | API-P01…P03 | appointments | Booking | TC-409/410 | Phase 9 |
| FR-011 Admin dash | admin/summary | all | Admin Dashboard | E2E | Phase 11 |
| FR-014 Uploads (tailoring) | API-U01 | uploaded_references | Customizer | TC-304…306 | Phase 6 |
| FR-027 Prompt history | API-P13 | prompt_history (text) | Prompt Studio | TC-P14 | Phase 7 |
| BR-001 Tailor authoritative | API-O05 | order_measurements | Admin Measurements | TC-407 | Phase 8 |
| BR-002/BR-010/BR-011 Prompt notices | — | — | Prompt Studio | TC-P16/TC-308 | Phase 7 |
| NFR/Security | all | all | all | TC-505…509 | Phase 12 |

---

*End of TEST_PLAN. All tests RECOMMENDED; none implemented. Text-prompt boundary (2026-09-11) applies.*
