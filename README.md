# Bitcoin Signal Analyzer

A simple Bitcoin analyzer built with **Next.js** to help traders identify potential long-term bullish or bearish signals based on market cycles. It evaluates the relationship between **ATH**, **ATL**, and **EMA70** on the **1W timeframe**.

---

## Features

- Manual input for ATH, ATL, and EMA70
- Signal logic based on vertical alignment
- Live BTC chart powered by CoinGecko API
- Clean, responsive UI using Tailwind CSS

---

## Signal Logic

- **Bullish** if: ATH > EMA70 by 100%
- **Bearish** if: EMA70 > ATL by 100%

---

## Run Locally

```bash
git clone https://github.com/zeevarblocks/bitcoin-analyzer-sea.git
cd bitcoin-analyzer-sea
npm install
npm run dev


---

Disclaimer

This tool is for educational purposes only. It does not constitute financial advice. Use it at your own risk.


---

License

MIT License © 2025 zeevarblocks
See the full LICENSE file for details.

---
