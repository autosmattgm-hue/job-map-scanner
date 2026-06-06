# MAT LEADS AI PRO X

Premium Google Maps lead-generation SaaS for agencies, freelancers, SEO teams, and AI automation businesses.

## Stack

- Frontend: HTML5, CSS3, vanilla JavaScript ES2025
- Backend: Node.js API server with secure first-party routes
- Database: Firebase Firestore
- Hosting: Vercel
- AI: NVIDIA API / NVIDIA NIM models only
- Payments: Stripe and PayPal integration stubs with server-side key handling

## Quick Start

```bash
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

The local runtime does not require `node_modules`; it uses built-in Node APIs so the product launches cleanly on a fresh machine. Real mode is always active: the API does not return simulated Google Maps leads, billing sessions, or AI responses. Missing provider credentials return explicit setup errors.

## Owner Access

Use this local owner account for full, free enterprise access:

- Email: `owner@matleads.local`
- Password: `admin2026`

Admin users receive unlimited enterprise access across lead search, CRM, reports, analytics, admin, billing, settings, and AI workflows. Billing is not required for admin accounts. Set `OWNER_EMAIL` and `OWNER_PASSWORD` in `.env` before deploying a public instance.

## Production Setup

1. Create a Firebase project with Authentication and Firestore enabled.
2. Add Firebase Admin credentials and the Firebase Web API key to Vercel environment variables.
3. Optional: enable Google Places API (New) and restrict the server key to your backend if you want Google Places results instead of the no-key OpenStreetMap fallback.
4. Add the NVIDIA API key, base URL, and selected NVIDIA NIM model ID.
5. Add Stripe and PayPal credentials.
6. Deploy to Vercel and configure your custom domain, TLS, and monitoring.

Complete paid SaaS operation requires Firebase credentials, `NVIDIA_API_KEY`, Stripe credentials, and PayPal credentials. `GOOGLE_PLACES_API_KEY` is optional because Google Maps links can seed real OpenStreetMap Overpass searches without a Google API key. The app will not fake provider responses.

## Google Maps Link Search

The dashboard accepts a Google Maps URL such as:

`https://www.google.com/maps/@13.4053888,-16.6887424,11z`

The backend parses coordinates from both `@lat,lng,zoom` URLs and `/place/...!3dLAT!4dLNG` URLs. If `GOOGLE_PLACES_API_KEY` is configured, it uses Google Places Text Search with `locationBias.circle`. If no Google key is configured, it uses the Google Maps link only as a location seed and fetches real public business records from OpenStreetMap Overpass.

For broad links like `/place/Europe/...` or `/place/United+States/...`, selected countries control the scan. The app searches curated profitable market hubs inside the selected countries, with category-specific Overpass tags for restaurants, hotels, boutiques, car dealers, auto repair, salons, dentists, clinics, gyms, real estate, law, accounting, contractors, pharmacies, retail, and more.

## Security Notes

- API keys stay on the server.
- Browser requests use first-party endpoints only.
- Helmet, CSP, CORS, rate limiting, validation, JWT checks, and Firebase token verification are wired in.
- Website audits include SSRF protections before outbound requests.
- Payment endpoints support idempotency keys.

## API Highlights

- `POST /api/leads/search`
- `POST /api/leads/:id/save`
- `GET /api/leads/:id/report`
- `POST /api/ai/analyze`
- `POST /api/ai/outreach`
- `GET /api/crm/leads`
- `PATCH /api/crm/leads/:id/stage`
- `GET /api/dashboard/metrics`
- `POST /api/billing/stripe/payment-intent`
- `POST /api/billing/paypal/order`
