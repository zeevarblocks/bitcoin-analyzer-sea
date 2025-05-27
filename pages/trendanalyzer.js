import axios from 'axios';

// === Helper: Get Previous ATL and ATH (excluding last candle) ===
const getPreviousExtreme = (candles, type = 'low') => {
  if (candles.length < 2) return null;
  const candlesExcludingLast = candles.slice(0, -1);
  const extremeCandle = candlesExcludingLast.reduce((extreme, curr) =>
    type === 'low' ? (curr.low < extreme.low ? curr : extreme) : (curr.high > extreme.high ? curr : extreme)
  );
  return {
    price: type === 'low' ? extremeCandle.low : extremeCandle.high,
    time: new Date(extremeCandle.time).toLocaleDateString(),
  };
};

// === Detect Reversal ===
const detectReversal = (data) => {
  if (!data || data.length < 3) {
    return { valid: false, error: 'Insufficient candle data (need at least 3 candles).' };
  }

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const older = data[data.length - 3];

  const ema14Decreasing = latest.ema14 < prev.ema14 && prev.ema14 < older.ema14;
  const ema14Increasing = latest.ema14 > prev.ema14 && prev.ema14 > older.ema14;

  const atlCandle = data.reduce((min, c) => (c.low < min.low ? c : min), data[0]);
  const athCandle = data.reduce((max, c) => (c.high > max.high ? c : max), data[0]);

  const isATL = latest.low <= atlCandle.low;
  const isATH = latest.high >= athCandle.high;

  const prevATL = getPreviousExtreme(data, 'low');
  const prevATH = getPreviousExtreme(data, 'high');

  // === Bullish Reversal Check ===
  if (latest.ema14 < latest.ema70 && ema14Decreasing && isATL) {
    const gap = ((atlCandle.ema70 - atlCandle.low) / atlCandle.ema70) * 100;
    return {
      valid: true,
      type: 'Bullish',
      signal: 'Bullish Reversal Setup',
      classification: gap > 100 ? 'Bearish Continuation' : 'Possible Reversal',
      gapPercent: gap.toFixed(6),
      level: atlCandle.low.toFixed(6),
      ema14: latest.ema14.toFixed(6),
      ema70: latest.ema70.toFixed(6),
      time: new Date(latest.time).toLocaleString(),
      previous: prevATL
    };
  }

  // === Bearish Reversal Check ===
  if (latest.ema14 > latest.ema70 && ema14Increasing && isATH) {
    const gap = ((athCandle.high - athCandle.ema70) / athCandle.ema70) * 100;
    return {
      valid: true,
      type: 'Bearish',
      signal: 'Bearish Reversal Setup',
      classification: gap > 100 ? 'Bullish Continuation' : 'Possible Reversal',
      gapPercent: gap.toFixed(6),
      level: athCandle.high.toFixed(6),
      ema14: latest.ema14.toFixed(6),
      ema70: latest.ema70.toFixed(6),
      time: new Date(latest.time).toLocaleString(),
      previous: prevATH
    };
  }

  return { valid: false, error: 'No valid reversal detected.', previousATL: prevATL, previousATH: prevATH };
};

// === Calculate EMA ===
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

// === Fetch Candle Data ===
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

// === React Component ===
export default function Home({ results }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Reversal Detector (15m - OKX)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {results.map(({ symbol, result, error }) => (
          <div key={symbol} className="bg-gray-100 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">{symbol}</h2>
            {error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : result.valid ? (
              <>
                <p className={result.type === 'Bullish' ? 'text-green-600' : 'text-red-600'}>
                  Signal: {result.signal}
                </p>
                <p>Type: {result.type}</p>
                <p>Classification: {result.classification}</p>
                <p>Gap %: {result.gapPercent}%</p>
                <p>{result.type === 'Bullish' ? 'ATL' : 'ATH'}: {result.level}</p>
                <p>EMA14: {result.ema14}</p>
                <p>EMA70: {result.ema70}</p>
                <p>Time: {result.time}</p>
                {result.previous && (
                  <p>Previous {result.type === 'Bullish' ? 'ATL' : 'ATH'}: {result.previous.price} on {result.previous.time}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-700">No valid setup: {result.error}</p>
                {result.previousATL && (
                  <p>Previous ATL: {result.previousATL.price} on {result.previousATL.time}</p>
                )}
                {result.previousATH && (
                  <p>Previous ATH: {result.previousATH.price} on {result.previousATH.time}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

// === SSR ===
export async function getServerSideProps() {
  const symbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'PI-USDT'];

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const candles = await fetchCandleData(symbol);
      if (!candles) {
        return { symbol, result: {}, error: 'Failed to fetch candle data' };
      }
      const result = detectReversal(candles);
      return { symbol, result };
    })
  );

  return { props: { results } };
      }
