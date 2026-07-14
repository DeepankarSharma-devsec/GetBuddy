# GetBuddy

Social marketplace connecting users with hosts for per-hour sessions and events. FastAPI backend, React (Vite) web, Expo mobile.

## Run locally

```bash
# Backend (http://localhost:8000)
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Web (http://localhost:5173)
cd web
npm install
npm run dev
```

## Deploy to production

**Backend** — set env vars (see `backend/.env.example`):

| Var | Required | Purpose |
|-----|----------|---------|
| `SECRET_KEY` | yes | JWT signing key (`python -c "import secrets; print(secrets.token_hex(32))"`) |
| `CORS_ORIGINS` | yes | Comma-separated allowed web origins |
| `ADMIN_EMAIL` | yes | The one email that gets admin on registration |
| `DATABASE_URL` | recommended | Postgres URL; defaults to local SQLite |
| `STRIPE_SECRET_KEY` | for payments | `sk_test_...` in dev; blank = mock-payment mode |
| `STRIPE_WEBHOOK_SECRET` | for payments | From `stripe listen` (dev) or the dashboard webhook endpoint (prod) |
| `FRONTEND_URL` | for payments | Where Stripe redirects after checkout |
| `STRIPE_ALLOW_LIVE` | prod only | Must be `true` before a `sk_live_` key will charge |

Run with: `uvicorn app.main:app --host 0.0.0.0 --port 8000` (behind any HTTPS proxy/platform — Railway, Render, Fly, etc.)

**Web** — set `VITE_API_URL` to the backend URL, then `npm run build` and serve `dist/` from any static host (Vercel, Netlify, Cloudflare Pages).

**Mobile** — set `EXPO_PUBLIC_API_URL` to the backend URL before building with EAS.

## Pricing model

Listing `price` is **per hour**. Booking charge = hourly rate × session duration. Platform keeps 15% commission; host receives 85%. No membership fee.

## Payments (Stripe)

- **Events**: book → redirect to Stripe Checkout → webhook (`/webhooks/stripe`, `checkout.session.completed`) confirms the seat and records the transaction.
- **Buddy services**: request (free) → host accepts → guest pays via "Pay now" → details unlock.
- Charged in the listing's currency (INR/USD/GBP/JPY/KRW; JPY/KRW handled as zero-decimal).
- No keys set = mock mode (instant PAID) for local dev.
- Local webhook testing: `stripe listen --forward-to localhost:8000/webhooks/stripe` and put the printed `whsec_...` in `.env`.

## Not yet implemented

- Host payouts via Stripe Connect — earnings are tracked in-DB; money lands in the platform account.
- Real SMS/phone verification for hosts (admin approval is the gate).
