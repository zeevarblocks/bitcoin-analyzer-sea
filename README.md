# Bitcoin Analyzer SEA

A responsive **Next.js** app for Southeast Asian traders that analyzes Bitcoin’s **ATH**, **ATL**, and **70-period EMA** to generate bullish or bearish signals.

### Features

- Input fields for ATH, ATL, EMA70, and optional current price
- Real-time BTC chart via CoinGecko API
- Signal logic based on vertical alignment of ATH/ATL to EMA70 in 1W timeframe
- Yearly calendar ATH/ATL reference (manual or auto)
- Responsive TailwindCSS UI
- Easy deployment on Vercel

### How It Works

The analyzer checks:
- If **ATH > EMA70 by >100%**, it's **Bullish**
- If **ATL < EMA70 by >100%**, it's **Bearish**
This helps determine macro cycles and swing zones.

### Live Preview

[bitcoin-analyzer-sea.vercel.app](https://bitcoin-analyzer-sea.vercel.app)

---

### Setup Locally

```bash
git clone https://github.com/YOUR_USERNAME/bitcoin-analyzer-sea.git
cd bitcoin-analyzer-sea
npm install
npm run dev
