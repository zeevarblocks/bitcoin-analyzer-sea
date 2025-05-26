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
      gapPercent: gapPercent.toFixed(2),
      atl: atlPrice,
      ema14: latest.ema14,
      ema70: latest.ema70,
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

// Fetch 15m candles from OKX
async function fetchCandleData() {
  try {
    const url = `https://www.okx.com/api/v5/market/candles?instId=BTC-USDT&bar=15m&limit=200`;
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
    console.error(error);
    throw new Error('Failed to fetch candle data from OKX.');
  }
}

// Main React component
export default function Home({ candles, result, error }) {
  if (error) {
    return (
      <main className="p-4 text-red-600">
        <p>Error fetching data: {error}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Bullish Reversal Detector (15m - OKX BTC-USDT)</h1>

      <div className="bg-gray-100 p-4 rounded shadow w-full max-w-md">
        {result.valid ? (
          <div>
            <p className="text-green-600 font-bold">Signal: {result.signal}</p>
            <p>Classification: {result.classification}</p>
            <p>Gap %: {result.gapPercent}%</p>
            <p>ATL: {result.atl}</p>
            <p>EMA14: {result.ema14}</p>
            <p>EMA70: {result.ema70}</p>
            <p>Time: {result.time}</p>
          </div>
        ) : (
          <p className="text-red-600">No valid setup: {result.error}</p>
        )}
      </div>
    </main>
  );
}

// Use Next.js getServerSideProps for SSR
export async function getServerSideProps() {
  try {
    const candles = await fetchCandleData();
    const result = detectBullishReversal(candles);

    return {
      props: {
        candles,
        result
      }
    };
  } catch (error) {
    return {
      props: {
        candles: [],
        result: { valid: false, error: 'Could not determine reversal setup.' },
        error: error.message
      }
    };
  }
      }
