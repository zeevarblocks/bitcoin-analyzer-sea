import axios from 'axios';
import TradingViewWidget from './tradingviewwidget';

const getPreviousExtreme1DFrom15m = (candles, type = 'low') => {
  const candlesPerDay = 96;

  if (candles.length < candlesPerDay * 2) return null;

  // Extract the full day before the most recent one
  const startIndex = candles.length - candlesPerDay * 2;
  const endIndex = candles.length - candlesPerDay;
  const previousDayCandles = candles.slice(startIndex, endIndex);

  const extremeCandle = previousDayCandles.reduce((extreme, curr) =>
    type === 'low'
      ? curr.low < extreme.low ? curr : extreme
      : curr.high > extreme.high ? curr : extreme
  );

  return {
    price: type === 'low' ? extremeCandle.low : extremeCandle.high,
    time: new Date(extremeCandle.time).toLocaleString(),
    candle: extremeCandle,
  };
};

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

const calculateRSI = (data, period = 14) => {
  let gains = 0, losses = 0;
  const rsiArray = [];

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsiArray[period] = 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    rsiArray[i] = 100 - (100 / (1 + rs));
  }

  const padding = new Array(period).fill(null);
  return [...padding, ...rsiArray.slice(period)];
};

const getPreviousEMACross = (candles) => {
  for (let i = candles.length - 2; i >= 1; i--) {
    const prev = candles[i - 1];
    const curr = candles[i];

    if (!prev.ema14 || !prev.ema70 || !curr.ema14 || !curr.ema70) continue;

    const prevDiff = prev.ema14 - prev.ema70;
    const currDiff = curr.ema14 - curr.ema70;

    if (prevDiff * currDiff < 0) {
      return {
        type: currDiff > 0 ? 'Bullish' : 'Bearish',
        time: new Date(curr.time).toLocaleString(),
        price: curr.close,
        index: i,
      };
    }
  }
  return null;
};

let lastReversal = null;

const detectReversal = (data) => {
  try {
    if (!data || data.length < 20) {
      return { valid: false, error: 'Insufficient candle data (need at least 20 candles).' };
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

    const prevATL = getPreviousExtreme1DFrom15m(data, 'low');
const prevATH = getPreviousExtreme1DFrom15m(data, 'high');

    const previousCrossover = getPreviousEMACross(data);
    const atlAfterCrossover = previousCrossover && latest.time > data[previousCrossover.index].time;
    const athAfterCrossover = previousCrossover && latest.time > data[previousCrossover.index].time;

    const rsiATL = atlCandle.rsi14;
    const rsiATH = athCandle.rsi14;

    const lastLowRSI = data.slice(0, -1).reduce((min, c) =>
      c.low < latest.low ? min : (c.rsi14 < min.rsi14 ? c : min), data[0]
    );
    const lastHighRSI = data.slice(0, -1).reduce((max, c) =>
      c.high > latest.high ? max : (c.rsi14 > max.rsi14 ? c : max), data[0]
    );

    const bullishDivergence = isATL && latest.rsi14 > lastLowRSI.rsi14;
    const bearishDivergence = isATH && latest.rsi14 < lastHighRSI.rsi14;

    if (lastReversal) {
      const stillValid =
        (lastReversal.type === 'Bullish' && latest.low >= lastReversal.level) ||
        (lastReversal.type === 'Bearish' && latest.high <= lastReversal.level);

      if (stillValid) {
        return lastReversal;
      } else {
        lastReversal = null;
      }
    }

    if (
      latest.ema14 < latest.ema70 &&
      ema14Decreasing &&
      isATL &&
      previousCrossover?.type === 'Bullish' &&
      atlAfterCrossover &&
      bullishDivergence
    ) {
      const gap = ((atlCandle.ema70 - atlCandle.low) / atlCandle.ema70) * 100;
      lastReversal = {
        valid: true,
        type: 'Bullish',
        signal: 'Bullish Reversal Setup',
        classification: gap > 100 ? 'Bearish Continuation' : 'Possible Reversal',
        gapPercent: gap.toFixed(6),
        level: atlCandle.low.toFixed(6),
        ema14: latest.ema14.toFixed(6),
        ema70: latest.ema70.toFixed(6),
        rsi14: latest.rsi14.toFixed(2),
        rsiDivergence: true,
        time: new Date(latest.time).toLocaleString(),
        previous: prevATL,
        crossover: previousCrossover,
      };
      return lastReversal;
    }

    if (
      latest.ema14 > latest.ema70 &&
      ema14Increasing &&
      isATH &&
      previousCrossover?.type === 'Bearish' &&
      athAfterCrossover &&
      bearishDivergence
    ) {
      const gap = ((athCandle.high - athCandle.ema70) / athCandle.ema70) * 100;
      lastReversal = {
        valid: true,
        type: 'Bearish',
        signal: 'Bearish Reversal Setup',
        classification: gap > 100 ? 'Bullish Continuation' : 'Possible Reversal',
        gapPercent: gap.toFixed(6),
        level: athCandle.high.toFixed(6),
        ema14: latest.ema14.toFixed(6),
        ema70: latest.ema70.toFixed(6),
        rsi14: latest.rsi14.toFixed(2),
        rsiDivergence: true,
        time: new Date(latest.time).toLocaleString(),
        previous: prevATH,
        crossover: previousCrossover,
      };
      return lastReversal;
    }

    return {
      valid: false,
      error: 'No valid reversal detected.',
      previousATL: prevATL,
      previousATH: prevATH,
      crossover: previousCrossover,
    };
  } catch (e) {
    return {
      valid: false,
      error: `Detection error: ${e.message}`,
    };
  }
};
              



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
      const rsi14Array = calculateRSI(candles, 14); 

    return candles.map((c, i) => ({
      ...c,
      ema14: ema14Array[i] || c.close,
      ema70: ema70Array[i] || c.close,
       rsi14: rsi14Array[i] || 50
    }));
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
}

export default function Home({ results }) {
  return (
    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: '2rem', borderRadius: '16px', color: 'gray-100', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
      <h1 className="text-4xl font-bold mb-6">Reversal Detector (15m - OKX)</h1>
      {results.map(({ symbol, result, error }) => (
        <div key={symbol} className="bg-transparent border border-gray-200 p-6 rounded-2xl shadow-lg transition hover:shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-600">{symbol}</h2>
          {error ? (
            <p className="text-red-600 font-medium">Error: {error}</p>
          ) : result.valid ? (
            <>
              <p className={`font-semibold ${result.type === 'Bullish' ? 'text-green-600' : 'text-red-600'}`}>Signal: {result.signal}</p>
              <p><span className="font-medium text-gray-600">Type:</span> <span className={result.type === 'Bullish' ? 'text-green-700' : 'text-red-700'}>{result.type}</span></p>
              <p><span className="font-medium text-gray-600">Classification:</span> <span className="text-blue-600">{result.classification}</span></p>
              <p><span className="font-medium text-gray-600">Gap %:</span> <span className="text-orange-500">{result.gapPercent}%</span></p>
              <p><span className="font-medium text-gray-600">{result.type === 'Bullish' ? 'ATL' : 'ATH'}:</span> {result.level}</p>
              <p><span className="font-medium text-gray-600">EMA14:</span> {result.ema14}</p>
              <p><span className="font-medium text-gray-600">EMA70:</span> {result.ema70}</p>
              <p><span className="font-medium text-gray-600">Time:</span> {result.time}</p>
              {result.previous && (
                <p><span className="font-medium text-gray-600">Previous {result.type === 'Bullish' ? 'ATL' : 'ATH'}:</span> {result.previous.price} on {result.previous.time}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-gray-500">No valid setup: {result.error}</p>
              {result.previousATL && <p className="text-blue-500">Previous ATL: {result.previousATL.price} on {result.previousATL.time}</p>}
              {result.previousATH && <p className="text-purple-500">Previous ATH: {result.previousATH.price} on {result.previousATH.time}</p>}
                {result.crossover && (
  <p>Previous EMA {result.crossover.type} crossover at {result.crossover.time} — Price: {result.crossover.price}</p>
)}
               <TradingViewWidget />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export async function getServerSideProps() {
  const symbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'PI-USDT'];
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const candles = await fetchCandleData(symbol);
      if (!candles) {
        return {
          symbol,
          result: {},
          error: 'Failed to fetch candle data',
        };
      }
      const result = detectReversal(candles);
      return { symbol, result };
    })
  );
  return { props: { results } };
      }
  
