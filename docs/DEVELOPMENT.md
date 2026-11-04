# Horizon Auto Export — development & operations guide

> Internal notes for maintaining and deploying the site. The public overview is in the [README](../README.md).

B2B used-vehicle trading & export (Bucharest → all of Europe). Public site in **Romanian,
English and French**, an integrated **admin dashboard**, and a **Supabase** backend.

|          |                                                                                             |
| -------- | ------------------------------------------------------------------------------------------- |
| Frontend | Vite 8 · React 18 · TypeScript (strict) · Tailwind CSS v4 · React Router 7 · TanStack Query |
| Motion   | GSAP 3.15 (ScrollTrigger, SplitText) · Lenis smooth scroll · Motion                         |
| Forms    | react-hook-form + zod (server re-validates everything)                                      |
| Backend  | Supabase: Postgres + RLS, RPCs, Storage, Auth, 3 Deno edge functions                        |
| Hosting  | Vercel (static SPA + Edge Middleware for link previews), strict CSP                         |
| Tooling  | Bun · Biome · Vitest · PGlite (Postgres-in-WASM DB tests) · Playwright                      |

The site **runs without a database**: until Supabase is linked it uses the compiled contact
details and brands, shows a "we source to order" state instead of stock (no invented vehicles
in production — demo vehicles appear only in `bun run dev`), and the contact form explains that
it is not active yet.

---

## Quick start

```bash
bun install
bun run dev            # http://localhost:5173 → redirects to /ro (or the browser's language)
```

Copy `.env.example` to `.env.local` and fill it in once the database exists (see go-live).

### Scripts

| Script                               | What it does                                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `bun run dev`                        | Dev server                                                                                                            |
| `bun run build`                      | Generates sitemap/robots → type-checks → production build in `dist/`                                                  |
| `bun run preview`                    | Serves `dist/` **with the real `vercel.json` headers** (CSP included)                                                 |
| `bun run typecheck` / `bun run lint` | `tsc -b` / `biome check .`                                                                                            |
| `bun run test`                       | Unit tests (Vitest): logic, i18n completeness, cross-file consistency, components                                     |
| `bun run test:db`                    | Applies **every migration** to an in-process Postgres and attacks RLS/RPCs as anon, staff, stranger (69 checks, ~2 s) |
| `bun run test:e2e`                   | Playwright, desktop + phone: public site (no DB and mocked DB), admin, CSP                                            |
| `bun run check`                      | typecheck + lint + unit + DB tests                                                                                    |
| `bun run optimize:assets`            | Rebuilds every web image/icon from the pristine sources in `_brand/`                                                  |
| `bun run build:map`                  | Rebuilds the faint dotted world map used as a background texture                                                      |
| `bun run build:brands`               | Re-extracts the car-make marks from `simple-icons`                                                                    |

---

## How it's organised

```
src/
  App.tsx                    routes: /ro|/en|/fr/* (static prefixes), /admin/*
  i18n/                      dictionaries (ro = source, typed), LanguageProvider (language lives in the URL)
  components/
    layout/                  Header, Footer (sunrise horizon), PublicLayout, PageHero
    sections/home/           Hero, ServicesStrip, AboutTeaser, WhyUs, FeaturedVehicles, BrandsMarquee
    sections/about/          AboutStory (the client's À-propos layout)
    fx/                      SmoothScroll, RevealText, Reveal, DrawIcon, Magnetic, TiltCard, ScrollProgress
    vehicles/ forms/ ui/
  pages/                     Home, About, Services, Vehicles, VehicleDetail, Contact, Legal, NotFound
  pages/admin/               dashboard (own EN/RO dictionary, lazy-loaded, never linked from the site)
  lib/                       contact.ts (single source of contact details), vehicles.ts, image.ts, …
supabase/
  migrations/                0001 schema … 0012 European makes (sequential; never edit one that may have run)
  functions/                 create-staff, set-staff-password, notify (self-contained Deno)
middleware.ts                Vercel Edge: real link previews for shared vehicle URLs (social crawlers only)
scripts/                     SEO files, DB tests, asset pipeline, map/brand generators
_brand/                      pristine brand sources (logo, mock-up, client hero photo, upscales)
```

### Design system

Only the logo's two inks — **navy `#08193D`** and **gold `#A77C38`** — plus white and their tints
(`src/index.css`). Archivo variable (weight + width axes, self-hosted, latin + latin-ext for
Romanian diacritics); display type runs extended to echo the wide HORIZON wordmark.

### Signature motion (all respect `prefers-reduced-motion`)

- **Hero** (the client's sunset photo, exactly one screen tall so nothing peeks below it): a
  gold horizon line draws across, the photo opens out of it (pure CSS — can't stall), the
  headline rises word by word, "B2B" catches a travelling gold sheen; contact details run along
  its top edge; on scroll it contracts into a rounded card; subtle cursor depth parallax.
- **Services**: their own section right under the hero — the two services the company offers
  (passenger cars, commercial vehicles) as wide navy cards with their key points.
- **About page**: the client's own layout — navy header with the full logo beside the headlight
  photo, then three photo/text rows cut by the gold diagonal blade, and the motto band.
- **Footer**: a sun rises out of a gold horizon line as the footer scrolls in.
- Masked text reveals, self-drawing icons, scroll-scrubbed quote, route curtain transitions,
  Lenis smooth scroll, tilt/magnetic hovers (mouse only).

### Admin (`/admin`)

Dashboard (KPIs + 30-day chart) · **Inquiries** (pipeline rail, status picker, notes, reply by
e-mail/phone/WhatsApp, Excel export with formula-injection guard) · **Vehicles** (3-language
listing, specs, photos with compress-before-upload and reorderable cover, private VIN /
purchase price / margin) · **Makes** · **Site settings** (contact details, hero/about photos) ·
**Team** (staff accounts with per-section access, enforced by RLS) · **My account** (password
change with re-authentication, e-mail notifications).

---

## Go-live checklist

1. **Create the Supabase project** (EU region). Put the URL + anon key in `.env.local` **and** in
   the Vercel project env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`).
   The edge middleware and the sitemap read them at build/edge time.
2. **Create the owner login first**: Authentication → Users → _Add user_ with the client's
   e-mail. Then check the e-mail in `supabase/migrations/0002_admin_permissions.sql`
   (placeholder) — the real owner login, `admin@horizon.com`, is seeded by `0010_owner_admin_email.sql`.
3. **Run the migrations in order** (SQL editor, 0001 → 0012, or `bunx supabase db push` after
   `bunx supabase link`). Run `bun run test:db` first — it proves they all apply on a fresh DB.
   _After 0002 only seeded admins can write._ The `media` storage bucket is created by 0006.
4. **Disable public sign-up**: Authentication → Sign In / Providers → turn off "Allow new users
   to sign up". (RLS already ignores stray accounts; this closes the door completely.)
5. **Deploy the edge functions** (needs the Supabase CLI, `bunx supabase login` + `link`):

   ```bash
   bunx supabase functions deploy create-staff
   bunx supabase functions deploy set-staff-password
   bunx supabase functions deploy notify
   bunx supabase secrets set RESEND_API_KEY=re_xxx SITE_ADMIN_URL=https://<domain>/admin
   bunx supabase secrets set RESEND_FROM='Horizon Auto Export <noreply@<domain>>'
   ```

   Enter `RESEND_FROM` **without quotes** if you use the dashboard. Until the domain is verified
   in Resend, the sandbox sender only delivers to the Resend account's own e-mail.
6. **Sign in at `/admin`**, change the password in _My account_, enable e-mail notifications.
7. **Prove the CRUD paths**: add a vehicle with photos, then _edit_ it, reload, and check the
   change persisted (create and edit are different code paths). Same for a make and settings.
8. **One real inquiry end-to-end** from a private window (not logged in): the reference appears,
   the inquiry shows in the admin, the notification e-mail arrives. Mark it "spam"/delete after.
9. **Domain**: set `VITE_SITE_URL` (no trailing slash) → canonical, hreflang, OG, sitemap and
   robots all follow. Without it the official domain (https://horizonautoexport.com) is used.
10. **Verify on the Vercel preview**: open DevTools console on home, vehicles, a vehicle page,
    contact and an admin photo upload — there must be no `Refused to …` CSP messages. Then
    `curl -A "facebookexternalhit/1.1" https://<domain>/ro/vehicles/<slug>` returns the vehicle's
    own title/photo/price.
11. **Content from the client**:
    - **Hero photo**: the client's own image (`_brand/hero-source.png`); its baked-in copy is
      painted out by `scripts/brand/clean_hero.py`, then upscaled ×4 with Real-ESRGAN
      (`_brand/hero-photo-x4.png`) and turned into web sizes by `bun run optimize:assets`.
      A text-free original from the designer would still be the cleanest source.
    - **About photos**: cut from the client's "À propos" mock-up (`_brand/about-mockup.jpeg`,
      946 px wide) and upscaled ×4 into `_brand/about-x4/`. Originals would be sharper: replace
      the PNGs there and run `bun run optimize:assets` (the home one can also be uploaded in
      _Site settings → Images_).
    - Trade register number (_Nr. Reg. Com._) — add it in _Site settings_.
    - Have a lawyer review `src/content/legal.ts` (privacy policy + terms).

## GitHub & Vercel

```bash
git remote add origin git@github.com:<you>/horizon-auto-export.git
git push -u origin main
```
In Vercel: _Import project_ → framework **Vite** is detected; `vercel.json` already sets
`bun install --frozen-lockfile`, `bun run build`, `dist/`, the SPA rewrite, security headers,
cache headers and the CSP. Add the three env vars (step 1) for Production **and** Preview.

## Notes for developers

- **Never** build a write payload from a loaded row (`select("*")` → PostgREST rejects relation
  keys): every admin form maps editable columns explicitly. An E2E test guards this.
- The three section lists must match: `src/pages/admin/adminSections.ts` · `has_section('…')` in
  the migrations · `ALLOWED_SECTIONS` in `create-staff` — a unit test fails if they drift.
- No custom headers on the browser Supabase client (they break edge-function CORS preflights).
- Public routes use static `/ro|/en|/fr` prefixes, not `/:lang` — a param route outranks
  `/admin/*` in React Router and swallows admin URLs.
- The CSP allows **no inline scripts**; keep it that way (JSON-LD blocks are data, not scripts).
