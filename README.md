# AlphaStream Dashboard v3.1

Live trading scanner with pattern detection (FLAG, FLAT_TOP, ABC_PULL) and backtesting.

## Features
- Real-time signals from Google Apps Script
- In-memory state + file backup
- Equity curve (Recharts)
- Responsive tables

## Setup

1. `git clone https://github.com/kevin-phan-25/alphastream-dashboard`
2. `npm install`
3. Copy `.env.example` → `.env.local` and set `WEBHOOK_SECRET`
4. `npm run dev`

## Vercel Deployment
- Push to GitHub → Vercel auto-deploys
- Add `WEBHOOK_SECRET` in **Project Settings → Environment Variables**

## GAS Webhook
```js
dash('SCAN', { signals: [...] })
