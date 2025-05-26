import axios from 'axios';

// Detect bullish reversal
const detectBullishReversal = (data) => {
  if (!data || data.length < 3) {
    return { valid: false, error: 'Insufficient candle data (need at least 3 candles).' };
  }

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const older = data[data.length - 3];

  if (latest.ema14 >= latest.ema70) {
    return { valid: false, error: 'Not in bearish structure (EMA14 >= EMA70).' };
  }

  const atlCandle = data.reduce((min, candle) => (candle.low < min.low ? candle : min), data[0]);
  const isCurrentATL = latest.low <= atlCandle.low;

  const ema14Decreasing = latest.ema14 < prev.ema14 && prev.ema14 < older.ema14;
  if (!ema14Decreasing) {
    return { valid: false, error: 'EMA14 is not decreasing in the last 3 candles.' };
  }

  const atlPrice = atlCandle.low;
  const atlEMA70 = atlCandle.ema70 || 1;
  const gapPercent = ((atlEMA70 - atlPrice) / atlEMA70) * 100;
  const classification = gapPercent > 100 ? 'Bearish Continuation' : 'Possible Reversal';

  if (isCurrentATL) {
    return {
  valid: true,
  signal: 'Bullish Reversal Setup',
  classification,
  gapPercent: gapPercent.toFixed(6),
  atl: atlPrice.toFixed(6),
  ema14: latest.ema14.toFixed(6),
  ema70: latest.ema70.toFixed(6),
  time: new Date(latest.time).toLocaleString(),
  candle: latest
};
  }

  return { valid: false, error: 'Current candle is not the ATL.' };
};

// Calculate EMA
const calculateEMA = (data, period) => {
  const k = 2 / (period + 1);
  let emaArray = [];
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;

  for (let i = period; i < data.length; i++) {
    const close = data[i].close;
    ema = close * k + ema * (1 - k);
    emaArray.push(ema);
  }

  const padding = new Array(data.length - emaArray.length).fill(null);
  return [...padding, ...emaArray];
};

// Fetch 15m candles for a given symbol
async function fetchCandleData(symbol) {
  try {
    const url = `https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=15m&limit=200`;
    const { data } = await axios.get(url);

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
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
}

// Main React component
export default function Home({ results }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Bullish Reversal Detector (15m - OKX)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {results.map(({ symbol, result, error }) => (
          <div key={symbol} className="bg-gray-100 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">{symbol}</h2>
            {error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : result.valid ? (
              <>
                <p className="text-green-600 font-bold">Signal: {result.signal}</p>
                <p>Classification: {result.classification}</p>
                <p>Gap %: {result.gapPercent}%</p>
                <p>ATL: {result.atl}</p>
                <p>EMA14: {result.ema14}</p>
                <p>EMA70: {result.ema70}</p>
                <p>Time: {result.time}</p>
              </>
            ) : (
              <p className="text-red-600">No valid setup: {result.error}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

// SSR
export async function getServerSideProps() {
  const symbols = ['BTC-USDT', 'PI-USDT', 'SOL-USDT', 'ETH-USDT'];

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const candles = await fetchCandleData(symbol);
      if (!candles) {
        return { symbol, result: {}, error: 'Failed to fetch candle data' };
      }
      const result = detectBullishReversal(candles);
      return { symbol, result };
    })
  );

  return { props: { results } };
                                         }
