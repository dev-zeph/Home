# NG Rentals MVP – Build Spec & AI Partner Prompt

> Purpose: a single blueprint the team (and AI partner) can use to scaffold a working MVP for a Nigeria‑focused rentals marketplace. Payments will be stubbed initially; real Paystack/Direct Debit can be integrated later without major refactors.

---

## 1) Product Summary

**Elevator pitch:** A web platform for homeowners/agents to list properties in Nigeria and for tenants/buyers to discover, tour virtually, message owners, and complete basic reservation/deposit flow. For MVP, payments are mocked with a provider‑agnostic interface and a test checkout. Real payments plug into the same interface later.

**Success criteria (MVP):**

* Owner can create a verified account and post a property with photos, Plus Code and optional Kuula tour URL.
* Tenant can search/filter, view detail pages (with map + tour), create an account, send a message, and submit an application.
* Owner can accept an application and generate a reservation invoice (mock payment). System creates receipts and email notifications.
* Admin can review/approve listings and take down suspicious ones.

**Non‑goals (MVP):** escrow, chargebacks, full KYC, mobile apps, complex analytics, live payouts. Documented for v1+.

---

## 2) Personas & Top User Stories

**Landlord/Agent**

* *Create listing:* As an owner, I can create a new listing with images, Plus Code, and a Kuula tour URL, so tenants can discover it.
* *Manage listing:* I can set price, deposit, availability, and publish/unpublish.
* *Applications:* I can view applicants, accept one, and trigger a reservation invoice.

**Tenant/Buyer**

* *Search:* I can filter by city/area, price range, beds/baths, type, furnished, pets, and see map pins.
* *Listing details:* I can view photos, tour, amenities, map location (Plus Code), and contact owner.
* *Apply:* I can submit an application with a short message and attachments (e.g., ID or proof of funds) and receive updates.

**Admin**

* *Moderation:* I can review flagged/suspicious listings and approve/reject new listings.
* *Support:* I can view audit logs of critical actions (publish, accept application, payment events).

**Acceptance criteria** (Gherkin-style excerpts):

```
Scenario: Create listing
  Given I am an authenticated owner
  When I submit title, price, property type, beds, baths, amenities, photos (>=5), Plus Code, city, and tour URL
  Then the listing is saved as "draft"
  And an admin can publish it after review

Scenario: Search listings
  Given published listings exist
  When I filter by city=Lagos and price<=500k
  Then results only include matches
  And a map shows pins for each result

Scenario: Apply to listing
  Given I am an authenticated tenant on a listing page
  When I submit an application message and optional attachments
  Then the owner sees my application in their dashboard
  And I get an email confirmation
```

---

## 3) Architecture Overview

**Frontend**: Gatsby (IBM Carbon theme) for marketing, SSR pages for listings, client routes for app shell `/app/*` (dashboards, messaging, applications, mock checkout). React Query for data fetching, Zod for form validation.

**Backend API**: Node.js (NestJS) + PostgreSQL. REST JSON API. Job queue (BullMQ + Redis) for emails, scheduled tasks, and (later) payment retries. File uploads to Cloudinary (signed upload).

**Integrations** (enabled via feature flags):

* Maps: Google Maps JS SDK + Plus Codes.
* Virtual Tours: Kuula (paste embed URL).
* Email/SMS: SendGrid (email) and Termii/Twilio (SMS) for notifications.
* Payments: `PaymentProvider` interface with `MockProvider` for MVP; drop-in `PaystackProvider` later.

**Deployment**: Frontend on Vercel/Netlify. Backend on Render/Fly.io with PostgreSQL (Supabase/RDS). Cloudinary for media. Managed Redis (Upstash/Redis Cloud).

### High-level Diagram (textual)

```
[Gatsby Web] --(HTTPS/JSON)--> [NestJS API] --(SQL)--> [PostgreSQL]
                                |       \
                                |        --(Redis)--> [BullMQ jobs]
                                |--(S3/Cloudinary)--> [Media]
                                |--(Webhook)--> [Email/SMS]
                                |--(Provider interface)--> [Payment Mock|Paystack]
```

---

## 4) Data Model (ERD Outline)

**User**(id, role\[tenant|owner|admin], email, phone, password\_hash, status, created\_at)

**OwnerProfile**(user\_id PK/FK, display\_name, kyc\_status, company\_name?, bank\_info\_ref?)

**Property**(id, owner\_id FK, title, description, price\_ngn, deposit\_ngn, currency, type\[apt|house|shared|land], beds, baths, furnished bool, amenities jsonb, city, area, plus\_code, lat, lng, address\_text, published bool, verified bool, created\_at)

**Media**(id, property\_id FK, kind\[photo|video|tour], provider\[kuula|external], url, is\_cover bool, created\_at)

**Listing**(id, property\_id FK, availability\_status\[draft|under\_review|published|unlisted], published\_at)

**Application**(id, property\_id FK, tenant\_id FK, message, attachments jsonb, status\[pending|accepted|rejected|withdrawn], created\_at)

**Lease**(id, property\_id FK, tenant\_id FK, start\_date, end\_date, rent\_amount\_ngn, billing\_cycle\[monthly], status\[draft|active|ended|late])

**Invoice**(id, lease\_id FK, due\_date, amount\_ngn, status\[pending|paid|failed|void], metadata jsonb)

**Payment**(id, invoice\_id FK, provider\[mock|paystack], reference, method, status, paid\_at, raw\_webhook jsonb)

**MessageThread**(id, property\_id FK, owner\_id FK, tenant\_id FK, created\_at)

**Message**(id, thread\_id FK, sender\_id FK, body, attachments jsonb, created\_at)

**AuditLog**(id, actor\_id FK, action, entity, entity\_id, changes jsonb, created\_at)

Indexes: text search on Property(title, description, amenities), GIN on amenities, btree on (city, area, price\_ngn), geo index on (lat, lng) if using PostGIS later.

---

## 5) API Contracts (Initial)

Base: `/api/v1` (JSON). Auth: JWT (access+refresh). Errors: RFC7807 style `{type, title, status, detail, fields?}`.

**Auth**

* `POST /auth/register` {email, phone, password, role}
* `POST /auth/login` {email, password}
* `POST /auth/refresh`

**Users**

* `GET /me` → profile, role, capabilities

**Properties & Listings**

* `POST /owners/properties` (auth: owner) → create draft property
* `POST /owners/properties/:id/media` (signed uploads) → add photos
* `PUT /owners/properties/:id` → update
* `POST /owners/properties/:id/submit` → move to `under_review`
* `GET /public/listings` q: city, area, min\_price, max\_price, beds, baths, furnished, type, page, sort
* `GET /public/listings/:id` → property + media + tour embed
* `POST /admin/listings/:id/publish` (auth: admin)

**Applications**

* `POST /listings/:id/applications` (auth: tenant) {message, attachments\[]}
* `GET /owners/applications?status=`
* `POST /owners/applications/:id/accept` → create `Lease` (draft) + `Invoice` (reservation)

**Messaging**

* `POST /threads` {property\_id, other\_party\_id}
* `GET /threads/:id/messages`
* `POST /threads/:id/messages` {body, attachments\[]}

**Invoices & Payments**

* `GET /owners/invoices/:id`
* `POST /invoices/:id/pay` (auth: tenant) → delegates to `PaymentProvider`

**Webhooks**

* `POST /integrations/payments/webhook` → verify signature; update Payment/Invoice; append AuditLog

**Admin**

* `GET /admin/review/listings`
* `POST /admin/listings/:id/verify` {verified: true/false, reason?}
* `POST /admin/listings/:id/takedown` {reason}

---

## 6) Payment Abstraction (MVP → Real)

**Interface**

```
interface PaymentProvider {
  createCheckout(invoice: Invoice, customer: User): Promise<{checkoutUrl: string, reference: string}>;
  verifyWebhook(headers, body): {valid: boolean, event: string};
  mapEventToPayment(event): PaymentUpdate; // {invoiceId, status, reference, paidAt, raw}
}
```

**MockProvider (MVP)**

* `createCheckout` returns a hosted mock page under `/app/mock-checkout/:ref` with a “Pay” button.
* Clicking “Pay” fires an internal webhook that marks the invoice `paid` and creates a `Payment` with provider=`mock`.

**PaystackProvider (Later)**

* `createCheckout` uses Paystack initialization; keep same return type.
* Webhook verification and event mapping plug into the same interface.

This guarantees no controller changes when switching providers.

---

## 7) Frontend Implementation Notes

* **Theme**: IBM Carbon (gatsby-theme-carbon). Create a `Listings` template with SSR to enhance SEO.
* **Routing**: Public pages (home, listing search, listing details). Authenticated app shell under `/app` for dashboards, messages, applications, mock checkout.
* **Forms**: React Hook Form + Zod. Client-side checks: Plus Code required; minimum 5 photos; valid Kuula URL if provided.
* **Search UX**: filter panel + infinite scroll; map with pins; card list; badges for Verified.
* **Listing details**: gallery (Cloudinary thumbs), Kuula iframe, amenity chips, map (Plus Code), owner contact CTA.
* **Accessibility & Perf**: lazy-load images, prefetch critical routes, aria labels, keyboard nav, CLS budget.

---

## 8) Operational Concerns

* **Emails**: Templates for account verify, application received, application accepted, invoice created, invoice paid.
* **Moderation**: Flag listings with too few photos, no exterior photo, or missing Plus Code; queue for admin.
* **Audit**: Log all state changes; include actor, entity, before/after.
* **Backups**: Nightly DB snapshot; Cloudinary handles media redundancy.
* **Secrets**: Use runtime env (12‑factor). Separate staging vs production keys.

---

## 9) Security (MVP Baseline)

* Hash passwords with Argon2; JWT rotation; rate limit auth endpoints.
* Validate uploads (file types, sizes). Generate Cloudinary signed upload presets.
* Sanitize all rich text. Enforce CORS/CSRF policies.
* RBAC checks on every endpoint (owner only sees own properties, etc.).

---

## 10) Compliance (Document Now, Implement Iteratively)

* Prepare Privacy Policy and Terms (data categories, retention, lawful basis, contact info, user rights, breach process).
* Data minimization: do not store raw card/bank data; only provider tokens/refs.
* Breach response plan: roles, 72‑hour notification outline, evidence preservation.

---

## 11) Developer Setup

**Prereqs**: Node 20, PNPM, Docker, Postgres 15, Redis.

**Repos**: `web/` (Gatsby), `api/` (NestJS), `infra/` (IaC), `docs/` (policies/specs).

**Environment**

```
# api/.env
DATABASE_URL=postgres://...
REDIS_URL=redis://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PAYMENT_PROVIDER=mock
WEB_BASE_URL=https://localhost:5173
API_BASE_URL=http://localhost:4000
```

**Seed script**: creates demo users (owner/tenant/admin), 10 properties with Lagos/Abuja Plus Codes, and 50 photos via Cloudinary placeholders.

---

## 12) Testing Strategy

* **Unit**: services, validators, mappers (jest).
* **API**: supertest for endpoints; contract tests for PaymentProvider.
* **E2E**: Playwright: create owner, create listing, publish (admin), search, apply, accept application, generate invoice, mock pay, verify receipts.
* **Load smoke**: k6 for search endpoints.

---

## 13) Backlog (Prioritized)

**Now**

1. Project scaffolds (Gatsby + Carbon, NestJS + Postgres + Prisma/TypeORM).
2. Auth + roles.
3. Property CRUD + media uploads (Cloudinary signed uploads).
4. Public search + SSR listing pages + map + Plus Codes.
5. Admin review/publish.
6. Applications + messaging threads.
7. Invoices + MockProvider + mock checkout + email notifications.

**Next**
8\. Verification flags (photo count, exterior required), Verified badge.
9\. Owner dashboard analytics (basic) and exports.
10\. Paystack integration (swap provider, enable test keys, webhook endpoint).
11\. Subscriptions/recurring rent (post‑MVP).
12\. Dispute workflow (post‑MVP).

---

## 14) Risks & Mitigations

* **Fraudulent listings** → admin review, verified badge, exterior photo required, Plus Code mandatory.
* **Address ambiguity** → Plus Code + nearest landmark text; show map pin on detail page.
* **Payment transition risk** → Provider interface with a complete contract test suite.
* **Low supply at launch** → free listing credits for first 100 owners; concierge onboarding.

---

## 15) AI Partner Prompt (Drop‑in)

```
You are an engineering copilot. Scaffold a two-repo project named "ng-rentals":
- web/ (Gatsby + gatsby-theme-carbon) with routes: /, /listings, /listings/:id (SSR), /app/* (client app shell).
- api/ (NestJS) with modules: auth, users, properties, media, listings, applications, threads, invoices, payments, admin, webhooks.

Implement the data model from Section 4 using PostgreSQL with Prisma or TypeORM. Add seed data with Lagos/Abuja Plus Codes. Integrate Cloudinary signed uploads for images.

Expose the REST endpoints from Section 5 with DTO validation (Zod or class-validator) and JWT auth. Implement RBAC guards.

Create a PaymentProvider interface and implement MockProvider as per Section 6, including a mock checkout page in web/. When PAY is clicked, call api internal webhook to mark the invoice paid and emit email notifications.

Frontend:
- Use Carbon components for layout. Build a listing card, filter panel, map, and detail page with gallery + Kuula iframe + map pin from Plus Code. Validate owner forms (min 5 photos, Plus Code required).
- Build /app dashboards for owners (my listings, applications, invoices) and tenants (applications, threads, invoices).

Testing:
- Jest unit tests for services and mappers. Supertest for API endpoints. Playwright E2E covering the main user flow from seed data.

Deliverables:
- Running dev env via docker-compose for Postgres and Redis.
- README with env vars and scripts. Seed script to populate demo data and a demo owner/tenant/admin.
- CI pipeline to lint, test, and build both repos.
```

---

## 16) Go/No-Go Checklist (MVP demo readiness)

* [ ] Owner can create and submit a listing; admin can publish it.
* [ ] Listing detail renders photos, Kuula tour, and map via Plus Code.
* [ ] Tenant can apply; owner can accept and generate invoice.
* [ ] Mock checkout marks invoice paid; emails sent.
* [ ] Basic moderation and audit logs in place.
* [ ] README + seed script allow any dev to run the demo in <15 minutes.

---

**End of Spec.**
