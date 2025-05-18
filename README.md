# Bitcoin Analyzer SEA

A responsive **Next.js** app for Southeast Asian traders. It analyzes Bitcoin’s **ATH**, **ATL**, and **70 EMA** on the **1W timeframe** to generate bullish/bearish signals.

[Live App →](https://bitcoin-analyzer-sea.vercel.app)

---

## Features

- Manual input: ATH, ATL, EMA70, and current price (optional)
- Auto BTC chart from CoinGecko API
- Signal generation based on vertical alignment logic
- Yearly ATH/ATL awareness
- Clean Tailwind CSS UI
- Responsive across devices

---

## Signal Logic

- If **ATH > EMA70 by more than 100%** → **Bullish**
- If **EMA70 > ATL by more than 100%** → **Bearish**

These gaps show potential trend reversals or macro setups.

---

## Getting Started

Clone the repo and run locally:

```bash
git clone https://github.com/zeevarblocks/bitcoin-analyzer-sea.git
cd bitcoin-analyzer-sea
npm install
npm run dev

Then open: http://localhost:3000


---

Tech Stack

Next.js

React

Tailwind CSS

Chart.js

CoinGecko API



---

Disclaimer

This project is for educational and informational purposes only.
It does not constitute financial advice.
Cryptocurrency trading carries risk. Always do your own research.
The developer is not responsible for any financial decisions made using this tool.


---

License

MIT © 2025 zeevarblocks
