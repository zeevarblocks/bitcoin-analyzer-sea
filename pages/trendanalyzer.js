import axios from 'axios';

// Get Previous ATL (only if bearish structure) const getPreviousATL = (candles) => { if (candles.length < 2) return null; const candlesExcludingLast = candles.slice(0, -1); const prevAtlCandle = candlesExcludingLast.reduce((min, curr) => curr.low < min.low ? curr : min ); return { price: prevAtlCandle.low, time: new Date(prevAtlCandle.time).toLocaleDateString(), }; };

// Get Previous ATH (only if bearish structure) const getPreviousATH = (candles) => { if (candles.length < 2) return null; const candlesExcludingLast = candles.slice(0, -1); const prevAthCandle = candlesExcludingLast.reduce((max, curr) => curr.high > max.high ? curr : max ); return { price: prevAthCandle.high, time: new Date(prevAthCandle.time).toLocaleDateString(), }; };

// Detect bullish reversal const detectBullishReversal = (data) => { if (!data || data.length < 3) { return { valid: false, error: 'Insufficient candle data (need at least 3 candles).' }; }

const latest = data[data.length - 1]; const prev = data[data.length - 2]; const older = data[data.length - 3];

if (latest.ema14 >= latest.ema70) { return { valid: false, error: 'Not in bearish structure (EMA14 >= EMA70).' }; }

const atlCandle = data.reduce((min, candle) => (candle.low < min.low ? candle : min), data[0]); const isCurrentATL = latest.low <= atlCandle.low;

const ema14Decreasing = latest.ema14 < prev.ema14 && prev.ema14 < older.ema14; if (!ema14Decreasing) { return { valid: false, error: 'EMA14 is not decreasing in the last 3 candles.' }; }

const atlPrice = atlCandle.low; const atlEMA70 = atlCandle.ema70 || 1; const gapPercent = ((atlEMA70 - atlPrice) / atlEMA70) * 100; const classification = gapPercent > 100 ? 'Bearish Continuation' : 'Possible Reversal';

const previousATL = getPreviousATL(data); const previousATH = getPreviousATH(data);

if (isCurrentATL) { return { valid: true, signal: 'Bullish Reversal Setup', classification, gapPercent: gapPercent.toFixed(6), atl: atlPrice.toFixed(6), ema14: latest.ema14.toFixed(6), ema70: latest.ema70.toFixed(6), time: new Date(latest.time).toLocaleString(), previousATL, previousATH, candle: latest }; }

return { valid: false, error: 'Current candle is not the ATL.' }; };

// Calculate EMA const calculateEMA = (data, period) => { const k = 2 / (period + 1); let emaArray = []; let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;

for (let i = period; i < data.length; i++) { const close = data[i].close; ema = close * k + ema * (1 - k); emaArray.push(ema); }

const padding = new Array(data.length - emaArray.length).fill(null); return [...padding, ...emaArray]; };

// Fetch 15m candles for a given symbol async function fetchCandleData(symbol) { try { const url = https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=15m&limit=200; const { data } = await axios.get(url);

const rawCandles = data.data || [];

const candles = rawCandles
.reverse()
.map(c => ({
time: Number(c[0]),
open: parseFloat(c[1]),
high: parseFloat(c[2]),
low: parseFloat(c[3]),
close: parseFloat(c[4])
}));

const ema14Array = calculateEMA(candles, 14);
const ema70Array = calculateEMA(candles, 70);

return candles.map((c, i) => ({
...c,
ema14: ema14Array[i] || c.close,
ema70: ema70Array[i] || c.close
}));

} catch (error) { console.error(Error fetching ${symbol}:, error.message); return null; } }

// Main React Component export default function Home({ results }) { return ( 

Bullish Reversal Detector (15m - OKX)

{results.map(({ symbol, result, error }) => ( 

{symbol}

{error ? ( 

Error: {error}

) : result.valid ? ( Signal: {result.signal} 

Classification: {result.classification}

Gap %: {result.gapPercent}%

ATL: {result.atl}

EMA14: {result.ema14}

EMA70: {result.ema70}

Time: {result.time}

Previous ATL: {result.previousATL?.price} ({result.previousATL?.time})

Previous ATH: {result.previousATH?.price} ({result.previousATH?.time})

) : ( 

No valid setup: {result.error}

)} 

))} 

); } 

// SSR export async function getServerSideProps() { const symbols = ['BTC-USDT', 'PI-USDT', 'SOL-USDT', 'ETH-USDT'];

const results = await Promise.all( symbols.map(async (symbol) => { const candles = await fetchCandleData(symbol); if (!candles) { return { symbol, result: {}, error: 'Failed to fetch candle data' }; } const result = detectBullishReversal(candles); return { symbol, result }; }) );

return { props: { results } }; }
  
