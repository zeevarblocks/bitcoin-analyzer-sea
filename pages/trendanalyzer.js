import axios from 'axios';

// === Helper: Get Previous ATL (excluding last candle) ===
const getPreviousATL = (candles) => {
  if (candles.length < 2) return null;
  const candlesExcludingLast = candles.slice(0, -1);
  const prevAtlCandle = candlesExcludingLast.reduce((min, curr) =>
    curr.low < min.low ? curr : min
  );
  return {
    price: prevAtlCandle.low,
    time: new Date(prevAtlCandle.time).toLocaleDateString(),
  };
};

// === Detect Bullish Reversal Setup ===
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

  const previousATL = getPreviousATL(data);

  const atlCandle = data.reduce((min, candle) => (candle.low < min.low ? candle : min), data[0]);
  const isCurrentATL = latest.low <= atlCandle.low;

  const ema14Decreasing = latest.ema14 < prev.ema14 && prev.ema14 < older.ema14;
  if (!ema14Decreasing) {
    return { valid: false, error: 'EMA14 is not decreasing in the last 3 candles.', previousATL };
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
      candle: latest,
      previousATL
    };
  }

  return { valid: false, error: 'Current candle is not the ATL.', previousATL };
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

// === Helper: Get Previous ATH (excluding last candle) ===
const getPreviousATH = (candles) => {
  if (candles.length < 2) return null;
  const candlesExcludingLast = candles.slice(0, -1);
  const prevAthCandle = candlesExcludingLast.reduce((max, curr) =>
    curr.high > max.high ? curr : max
  );
  return {
    price: prevAthCandle.high,
    time: new Date(prevAthCandle.time).toLocaleDateString(),
  };
};

// === Detect Bearish Reversal Setup (ATH-based) ===
const detectBearishReversal = (data) => {
  if (!data || data.length < 3) {
    return { valid: false, error: 'Insufficient candle data (need at least 3 candles).' };
  }

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const older = data[data.length - 3];

  // Bearish structure means EMA14 > EMA70
  if (latest.ema14 <= latest.ema70) {
    return { valid: false, error: 'Not in bullish structure (EMA14 <= EMA70).' };
  }

  const previousATH = getPreviousATH(data);

  const athCandle = data.reduce((max, candle) => (candle.high > max.high ? candle : max), data[0]);
  const isCurrentATH = latest.high >= athCandle.high;

  // EMA14 increasing over last 3 candles (opposite of ATL detection)
  const ema14Increasing = latest.ema14 > prev.ema14 && prev.ema14 > older.ema14;
  if (!ema14Increasing) {
    return { valid: false, error: 'EMA14 is not increasing in the last 3 candles.', previousATH };
  }

  const athPrice = athCandle.high;
  const athEMA70 = athCandle.ema70 || 1;
  const gapPercent = ((athPrice - athEMA70) / athEMA70) * 100;
  const classification = gapPercent > 100 ? 'Bullish Continuation' : 'Possible Reversal';

  if (isCurrentATH) {
    return {
      valid: true,
      signal: 'Bearish Reversal Setup',
      classification,
      gapPercent: gapPercent.toFixed(6),
      ath: athPrice.toFixed(6),
      ema14: latest.ema14.toFixed(6),
      ema70: latest.ema70.toFixed(6),
      time: new Date(latest.time).toLocaleString(),
      candle: latest,
      previousATH
    };
  }

  return { valid: false, error: 'Current candle is not the ATH.', previousATH };
};



// === React Component ===
{results.map(({ symbol, resultATL, resultATH, error }) => (
  <div key={symbol} className="bg-gray-100 p-4 rounded shadow">
    <h2 className="text-xl font-semibold mb-2">{symbol}</h2>
    {error && <p className="text-red-600">Error: {error}</p>}

    {resultATL.valid ? (
      <>
        <p className="text-green-600 font-bold">ATL Signal: {resultATL.signal}</p>
        <p>Classification: {resultATL.classification}</p>
        <p>Gap %: {resultATL.gapPercent}%</p>
        <p>ATL: {resultATL.atl}</p>
        <p>EMA14: {resultATL.ema14}</p>
        <p>EMA70: {resultATL.ema70}</p>
        <p>Time: {resultATL.time}</p>
        {resultATL.previousATL && (
          <p>Previous ATL: {resultATL.previousATL.price} on {resultATL.previousATL.time}</p>
        )}
      </>
    ) : (
      <p className="text-red-600">No ATL setup: {resultATL.error}</p>
    )}

    {resultATH.valid ? (
      <>
        <p className="text-red-600 font-bold">ATH Signal: {resultATH.signal}</p>
        <p>Classification: {resultATH.classification}</p>
        <p>Gap %: {resultATH.gapPercent}%</p>
        <p>ATH: {resultATH.ath}</p>
        <p>EMA14: {resultATH.ema14}</p>
        <p>EMA70: {resultATH.ema70}</p>
        <p>Time: {resultATH.time}</p>
        {resultATH.previousATH && (
          <p>Previous ATH: {resultATH.previousATH.price} on {resultATH.previousATH.time}</p>
        )}
      </>
    ) : (
      <p className="text-gray-600">No ATH setup: {resultATH.error}</p>
    )}
  </div>
))}

// === SSR ===
export async function getServerSideProps() {
  const symbols = ['BTC-USDT', 'PI-USDT', 'SOL-USDT', 'ETH-USDT'];

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const candles = await fetchCandleData(symbol);
      if (!candles) {
        return { symbol, resultATL: {}, resultATH: {}, error: 'Failed to fetch candle data' };
      }
      const resultATL = detectBullishReversal(candles);
      const resultATH = detectBearishReversal(candles);
      return { symbol, resultATL, resultATH };
    })
  );

  return { props: { results } };
      }
