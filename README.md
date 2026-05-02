# Balabony Site

Marketing and subscription landing page for **Balabony** — an AI voice companion for Ukrainian seniors. Built with Next.js 16, Tailwind CSS, and Radix UI.

## Features

- Pricing section with LiqPay payment integration (monthly 99 ₴ / yearly 891 ₴)
- Installment options via PrivatBank and Oschadbank
- Telegram webhook for notifications
- Flutter mini-games embedded at `/games`
- Karaoke module: 01.mp3 - 18.mp3 (18 пісень)
- Admin panel and AI news feed API routes

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, Radix UI
- **Payments**: LiqPay (hosted checkout via `data` + `signature` POST form)
- **Subscriptions backend**: `balabony.vercel.app` (Supabase + serverless functions)

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env.local

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & Deploy

```bash
npm run build   # production build
npm run start   # run production build locally
```

Deployed automatically via Vercel on push to `main`.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values. **Never commit `.env.local`.**

| Variable | Description |
|---|---|
| `LIQPAY_PUBLIC_KEY` | LiqPay public key (from LiqPay Dashboard → My Business → Keys) |
| `LIQPAY_PRIVATE_KEY` | LiqPay private key — used server-side only to sign payment requests |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, e.g. `https://balabony.com` — used as LiqPay `result_url` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for webhook notifications |
| `TELEGRAM_CHAT_ID` | Chat/channel ID to receive Telegram notifications |

> **Both `LIQPAY_PUBLIC_KEY` and `LIQPAY_PRIVATE_KEY` must belong to the same LiqPay account** — a mismatch causes `invalid_signature` errors.

---

## Git Hooks

A pre-commit hook blocks commits containing API keys or secrets.

Install it once after cloning:

```bash
bash scripts/install-hooks.sh
```

Emergency bypass (use only for false positives):

```bash
SKIP_SECRET_CHECK=1 git commit -m "..."
```

---

## Project Structure

```
app/
  api/
    payment/
      create/       # POST — generates LiqPay data+signature
      installment/  # PrivatBank & Oschadbank installment flows
      callback/     # Payment callbacks
    telegram/       # Telegram webhook
  components/       # React UI components (PricingSection, Hero, etc.)
  page.tsx          # Main landing page
  layout.tsx
public/
  games/            # Embedded Flutter mini-games build
scripts/
  pre-commit        # Secret-scanning pre-commit hook
  install-hooks.sh  # Hook installer
```
