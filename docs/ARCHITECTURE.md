# Digital Tailor — Architecture (ARCHITECTURE)

> `PLANNED ARCHITECTURE` — nothing below is implemented.
> `CURRENT STATUS: NOT IMPLEMENTED` for app, API, DB, auth, measurement, orders, prompt generation.
> Stack: HTML/CSS/Vanilla JS → Express REST → MySQL; ChatGPT via user-driven prompt workflow (external).
>
> **Boundary (2026-09-11):** Digital Tailor generates **text prompts only**. No built-in image generation,
> virtual try-on, image APIs, GPU infrastructure, or generated-image storage exists or is planned.

- Related: PRD.md, TECH_SPEC.md, DATABASE.md, API_SPEC.md, UI_SPEC.md, SECURITY.md

---

## 0. Principles

1. Boring technology, small surface area (single deployable backend + static frontend + one MySQL). No image pipeline.
2. Server is authoritative (price, offer, ownership, status, prompt validation). Browser never touches MySQL.
3. Tailor-confirmed measurement is authoritative for stitching (BR-001).
4. Prompts are decision-support text, not a guarantee (BR-002, BR-010). Digital Tailor never renders images.
5. Privacy by minimization: visualization photos never enter Digital Tailor (BR-011).
6. Everything auditable: status history + admin actions.

---

## 1. High-Level Architecture (PLANNED)

```mermaid
flowchart TD
    Customer --> WebApp["WebApp<br/>(HTML/CSS/Vanilla JS)"]
    Admin --> AdminPanel["AdminPanel<br/>(HTML/CSS/Vanilla JS)"]
    WebApp --> ExpressAPI["ExpressAPI<br/>(Node.js + Express REST)"]
    AdminPanel --> ExpressAPI
    ExpressAPI --> MySQL[("MySQL 8<br/>InnoDB")]
    WebApp -.->|"Copy prompt + open (no photo sent)"| ChatGPT["ChatGPT (EXTERNAL)<br/>user photo + pasted prompt<br/>outside system boundary"]
    AdminPanel --> Uploads["Uploads<br/>(tailoring refs only)"]
    WebApp --> Uploads
    ExpressAPI --> Uploads
```

**Reads:** Customer/Admin → static pages → `fetch(/api/…)` → Express services → parameterized SQL → MySQL.
**Writes:** same path, with validation + RBAC + transactions.
**AI path (text only):** browser and/or API builds the text prompt; user copies it and opens ChatGPT manually. **No photo, no image bytes, and no inference cross the Digital Tailor boundary.** ChatGPT is an external service Digital Tailor does not control.

---

## 2. Customer Journey (PLANNED)

```mermaid
flowchart LR
    A["Browse garments"] --> B["View garment details"]
    B --> C["Select fashion preferences<br/>(occasion/outfit/style/fit/fabric/footwear/etc)"]
    C --> D["Upload tailoring reference (optional, NOT viz photo)"]
    D --> E["Select/save measurement profile"]
    E --> F["Generate AI prompt (text)"]
    F --> G["Copy prompt + open ChatGPT"]
    G --> H["Submit order request"]
    H --> I["Book appointment"]
    I --> J["Visit tailor: final measure + fabric"]
    J --> K["Track status to DELIVERED"]
    K --> L["Reorder / review"]
```

States H–K map to the order lifecycle (§4). The ChatGPT visualization itself happens outside this journey, in the user's own ChatGPT session.

---

## 3. Authentication Flow (PLANNED)

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as Express API
    participant DB as MySQL
    B->>API: POST /api/auth/register (name, phone/email, password)
    API->>API: Validate + check duplicates
    API->>API: Hash password (Argon2id/bcrypt)
    API->>DB: INSERT users
    DB-->>API: user id
    API-->>B: 201 + session cookie
    B->>API: POST /api/auth/login (identifier + password)
    API->>DB: SELECT user by phone/email
    API->>API: Verify hash + regenerate session
    API-->>B: 200 + session cookie
    B->>API: GET /api/auth/me (cookie)
    API-->>B: 200 {user} or 401
    B->>API: POST /api/auth/logout
    API->>API: Destroy session
    API-->>B: 204
```

Notes: session in httpOnly `Secure; SameSite=Lax` cookie; CSRF token for mutations (see SECURITY.md). Rate-limit login/register **and prompt endpoints**. Roles (`customer/admin`) checked server-side on every request.

---

## 4. Order Lifecycle (PLANNED / RECOMMENDED statuses)

```mermaid
stateDiagram-v2
    [*] --> REQUESTED: POST /api/orders
    REQUESTED --> CONFIRMED: admin confirms
    REQUESTED --> CANCELLED: admin/customer cancels
    CONFIRMED --> MEASUREMENT_PENDING: needs visit
    MEASUREMENT_PENDING --> MEASUREMENT_CONFIRMED: tailor confirms final measures
    MEASUREMENT_CONFIRMED --> FABRIC_PENDING: awaiting fabric
    FABRIC_PENDING --> CUTTING: fabric confirmed
    CUTTING --> STITCHING: cut done
    STITCHING --> TRIAL_READY: ready for trial
    TRIAL_READY --> ALTERATION: needs fix
    ALTERATION --> READY: fixes done
    TRIAL_READY --> READY: fit ok
    READY --> DELIVERED: handed over
    ALTERATION --> CANCELLED: admin cancels
    CONFIRMED --> CANCELLED: admin cancels
    MEASUREMENT_PENDING --> CANCELLED: admin cancels
```

Rules: only `admin` advances stitching states (BR-006); every transition appends `order_status_history`; `DELIVERED`/`CANCELLED` terminal (BR-009). Customer sees own orders only (BR-005).

---

## 5. Measurement Workflow (PLANNED)

```mermaid
flowchart TD
    A["Customer opens Measurements"] --> B["Pick garment type"]
    B --> C["Show only relevant fields + visual guide"]
    C --> D["Enter values (cm)"]
    D --> E{"Server validation<br/>ranges + required?"}
    E -- "No" --> C
    E -- "Yes" --> F["Save named profile"]
    F --> G["Attach profile to design/order"]
    G --> H["Tailor reviews in shop"]
    H --> I["Tailor confirms/overrides → snapshot on order"]
    I --> J["Snapshot used for CUTTING/STITCHING"]
```

`measurement_profiles` (reusable) → `measurement_values` (key/value) → `order_measurements` (frozen snapshot at confirmation). Customer values are drafts; tailor snapshot is authoritative (BR-001).

---

## 6. AI Prompt Workflow — official (PLANNED, text only)

```text
User
  ↓
Digital Tailor Web App
  ↓
Fashion Preference Selection
  ↓
Prompt Generation API
  ↓
AI Prompt Generator
  ↓
Personalized Text Prompt
  ↓
Copy Prompt
  ↓
User opens ChatGPT
  ↓
User attaches their own photo
  ↓
User pastes Digital Tailor prompt
  ↓
ChatGPT generates visualization
```

```mermaid
flowchart TD
    A["Fashion preference selection"] --> B["Prompt Generation API<br/>validate prefs → buildPrompt()"]
    B --> C["Personalized text prompt + notices (BR-002/BR-010/BR-011)"]
    C --> D["User: Copy prompt"]
    C --> E["User: Open ChatGPT (instructions)"]
    D --> F["EXTERNAL: user attaches own photo in ChatGPT + pastes prompt"]
    E --> F
    F --> G["EXTERNAL: ChatGPT generates visualization"]
    G --> H["User returns: refine prefs or submit order"]
```

Clearly: the ChatGPT visualization step is an **external service outside Digital Tailor's system boundary**. Digital Tailor does not control or process the generated image, receives no photo, stores no image, and runs no inference. No API keys in frontend; prompt-injection defenses + rate limits on the prompt API (see SECURITY.md, TECH_SPEC.md §14).

---

## 7. Deployment Architecture (PLANNED, single-node, lightweight)

```mermaid
flowchart TD
    User(["Browser (mobile/desktop)"]) -->|HTTPS| Proxy["Reverse proxy<br/>(nginx/Caddy, TLS)"]
    Proxy --> Static["Static frontend<br/>(public/*.html/css/js)"]
    Proxy --> Node["Node + Express<br/>(src/server.js)"]
    Node --> DB[("MySQL 8")]
    Node --> Disk["Uploads dir<br/>(tailoring refs only)"]
    DB --> Backup["Daily mysqldump<br/>+ restore test"]
```

- One VPS is enough for MVP; static + API behind same origin (no CORS pain).
- `NODE_ENV=production`, secure cookies, restricted `CORS_ORIGIN`, rate limits, JSON logs, uptime check.
- **Removed from requirements (2026-09-11):** GPU infrastructure, image-generation servers/workers, model hosting for image generation, large image models, image-generation queues, image-generation storage, CDN specifically for generated images.
- No Redis/Kafka/K8s/microservices in v1.

---

## 8. Module Map (RECOMMENDED backend)

```text
routes/ → controllers/ → services/ → db/queries → MySQL
```

| Concern | Module (PLANNED) |
|---|---|
| Auth | `routes/auth.routes.js`, `services/auth.service.js`, `utils/passwords.js`, `middleware/auth.js` |
| Catalog | `routes/garments.routes.js`, `services/catalog.service.js` |
| Designs + preferences | `routes/designs.routes.js`, `services/designs.service.js` |
| Prompt generation | `routes/prompts.routes.js`, `services/prompts.service.js`, `utils/promptBuilder.js` (shared logic; mirrored in `public/js/prompt.js`) + tests — **text only** |
| Measurements | `routes/measurements.routes.js`, `services/measurements.service.js` |
| Orders | `routes/orders.routes.js`, `services/orders.service.js` (transactions + state machine) |
| Offers | `routes/offers.routes.js`, `services/offers.service.js` (eligibility) |
| Appointments | `routes/appointments.routes.js`, `services/appointments.service.js` |
| Uploads (tailoring refs) | `middleware/upload.js`, `services/uploads.service.js` |

Frontend modules: `public/js/api.js`, `auth.js`, `prompt.js`, page scripts per UI_SPEC.md route (incl. Prompt Studio).

**Forbidden modules (do not create):** image-generation service, virtual try-on service, inference worker/queue, generated-image gallery/storage.

---

*End of ARCHITECTURE. All diagrams are PLANNED; verify Mermaid renders before implementation (see TASKS.md Phase 1). Text-prompt boundary (2026-09-11) applies.*
