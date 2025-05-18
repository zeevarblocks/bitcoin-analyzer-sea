# Bitcoin Analyzer SEA

A simple Bitcoin analyzer built with **Next.js** for Southeast Asian traders. It checks the relationship between **ATH**, **ATL**, and **EMA70** on the **1W timeframe** to generate basic bullish or bearish signals.

---

## Features

- Manual input for ATH, ATL, and EMA70
- Signal logic based on vertical alignment
- Live BTC chart from CoinGecko API
- Responsive design using Tailwind CSS

---

## Signal Rules

- **Bullish** if: ATH > EMA70 by 100%
- **Bearish** if: EMA70 > ATL by 100%

---

## Run Locally

```bash
git clone https://github.com/zeevarblocks/bitcoin-analyzer-sea.git
cd bitcoin-analyzer-sea
npm install
npm run dev
```

---

## Disclaimer

This tool is for **educational purposes only**. It does **not constitute financial advice**. Use it at your own risk.

---

MIT License © zeevarblocks
