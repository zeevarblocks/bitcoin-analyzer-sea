# Bitcoin Analyzer SEA

A simple Bitcoin analyzer built with **Next.js** for Southeast Asian traders.  
It analyzes the relationship between **ATH**, **ATL**, and **EMA70** on the **1W timeframe** to generate basic bullish or bearish signals.

> Ideal for Bitcoin HODLers, signal watchers, and macro traders who want simplified crypto insights.

---

## Features

- Manual input for ATH, ATL, and EMA70
- Signal logic based on vertical alignment
- Live BTC chart via CoinGecko API
- Fully responsive UI (Tailwind CSS)

---

## Signal Logic

- **Bullish Signal**: ATH > EMA70 by 100%
- **Bearish Signal**: EMA70 > ATL by 100%

---

## Getting Started

```bash
git clone https://github.com/zeevarblocks/bitcoin-analyzer-sea.git
cd bitcoin-analyzer-sea
npm install
npm run dev

---

Disclaimer

This tool is for educational purposes only and does not constitute financial advice.
Please trade at your own risk.


---

Author

Created by Var (Zeevar Blocks)
GitHub: @zeevarblocks
Website: https://zeevarblocks.github.io

MIT License © 2025 Zeevar Blocks
Feel free to fork, but credit is appreciated.
