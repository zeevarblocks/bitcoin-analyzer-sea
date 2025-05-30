import React from 'react';

interface SignalData {
  trend: string;
  breakout: boolean;
  bullishBreakout: boolean; 
  bearishBreakout: boolean; 
  divergence: boolean;
  ema14Bounce: boolean;
  ema70Bounce: boolean;
  currentPrice: number;
  level: number | null;
  levelType: 'support' | 'resistance' | null;
  inferredLevel: number;
  inferredLevelType: 'support' | 'resistance';
  nearOrAtEMA70Divergence: boolean;
  inferredLevelWithinRange: boolean;
  divergenceFromLevel: boolean;
  touchedEMA70Today: boolean;
  bearishContinuation: boolean;
bullishContinuation: boolean;
}

// fetchCandles, calculateEMA, etc.,.
interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchCandles(symbol: string, interval: string): Promise<Candle[]> {
  const limit = interval === '1d' ? 2 : 500;
  const response = await fetch(
    `https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=${interval}&limit=${limit}`
  );
  const data = await response.json();

  if (!data.data || !Array.isArray(data.data)) throw new Error('Invalid candle data');

  return data.data
    .map((d: string[]) => ({
      timestamp: +d[0],
      open: +d[1],
      high: +d[2],
      low: +d[3],
      close: +d[4],
      volume: +d[5],
    }))
    .reverse();
}

function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  let previousEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(NaN);
      continue;
    }

    if (i === period - 1) {
      const sma = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
      previousEma = sma;
    }

    if (previousEma !== null) {
      const currentEma = data[i] * k + previousEma * (1 - k);
      ema.push(currentEma);
      previousEma = currentEma;
    }
  }

  return ema;
}

function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (i <= period) {
      if (diff > 0) gains += diff;
      else losses -= diff;

      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(NaN);
      }
    } else {
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      const rs = losses === 0 ? 100 : gains / losses;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  rsi.unshift(...Array(closes.length - rsi.length).fill(NaN));
  return rsi;
}

function findRelevantLevel(
  ema14: number[],
  ema70: number[],
  closes: number[],
  highs: number[],
  lows: number[],
  trend: 'bullish' | 'bearish'
): { level: number | null; type: 'support' | 'resistance' | null } {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const prev70 = ema70[i - 1];
    const curr14 = ema14[i];
    const curr70 = ema70[i];

    if (trend === 'bullish' && prev14 < prev70 && curr14 > curr70) {
      return { level: closes[i], type: 'support' };
    }

    if (trend === 'bearish' && prev14 > prev70 && curr14 < curr70) {
      return { level: closes[i], type: 'resistance' };
    }
  }

  const level = trend === 'bullish' ? Math.max(...highs) : Math.min(...lows);
  const type = trend === 'bullish' ? 'resistance' : 'support';
  return { level, type };
}

function detectBearishContinuation(
  closes: number[],
  highs: number[],
  ema70: number[],
  rsi: number[],
  ema14: number[],
): boolean {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const prev70 = ema70[i - 1];
    const curr14 = ema14[i];
    const curr70 = ema70[i];

    if (prev14 > prev70 && curr14 < curr70) {
      const rsiAtCross = rsi[i];
      for (let j = i + 1; j < closes.length; j++) {
        const price = closes[j];
        const nearEMA70 = Math.abs(price - ema70[j]) / price < 0.002;
        const rsiHigher = rsi[j] > rsiAtCross;
        if (nearEMA70 && rsiHigher) {
          return true;
        }
      }
      break;
    }
  }
  return false;
}

function detectBullishContinuation(
  closes: number[],
  lows: number[],
  ema70: number[],
  rsi: number[],
  ema14: number[],
): boolean {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const prev70 = ema70[i - 1];
    const curr14 = ema14[i];
    const curr70 = ema70[i];

    if (prev14 < prev70 && curr14 > curr70) {
      const rsiAtCross = rsi[i];
      for (let j = i + 1; j < closes.length; j++) {
        const price = closes[j];
        const nearEMA70 = Math.abs(price - ema70[j]) / price < 0.002;
        const rsiHigher = rsi[j] < rsiAtCross; // for bullish, RSI at latest is lower than cross
        if (nearEMA70 && rsiHigher) {
          return true;
        }
      }
      break;
    }
  }
  return false;
}


// logic in getServerSideProps:

export async function getServerSideProps() {
  const symbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'PI-USDT', 'CORE-USDT'];
  const results: Record<string, SignalData> = {};

  for (const symbol of symbols) {
    try {
      const candles = await fetchCandles(symbol, '15m');
      const closes = candles.map(c => c.close);
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);

      const ema14 = calculateEMA(closes, 14);
      const ema70 = calculateEMA(closes, 70);
      const rsi14 = calculateRSI(closes, 14);

      const lastClose = closes.at(-1)!;
      const lastEMA14 = ema14.at(-1)!;
      const lastEMA70 = ema70.at(-1)!;

    const trend = lastEMA14 > lastEMA70 ? 'bullish' : 'bearish';

      const dailyCandles = await fetchCandles(symbol, '1d');
      const prevDay = dailyCandles.at(-2);
      const currDay = dailyCandles.at(-1);

      const prevDayHigh = prevDay?.high ?? 0;
      const prevDayLow = prevDay?.low ?? 0;
      const currDayHigh = currDay?.high ?? 0;
      const currDayLow = currDay?.low ?? 0;

const prevHighIdx = highs.lastIndexOf(prevDayHigh);
const prevLowIdx = lows.lastIndexOf(prevDayLow);	    
      
let bearishContinuation = false;
let bullishContinuation = false;

if (trend === 'bearish') {
  bearishContinuation = detectBearishContinuation(closes, highs, ema70, rsi14, ema14);
} else if (trend === 'bullish') {
  bullishContinuation = detectBullishContinuation(closes, lows, ema70, rsi14, ema14);
}
      
const divergence =
  (highs.at(-1)! > prevDayHigh && prevHighIdx !== -1 && rsi14.at(-1)! < rsi14[prevHighIdx]) ||
  (lows.at(-1)! < prevDayLow && prevLowIdx !== -1 && rsi14.at(-1)! > rsi14[prevLowIdx]);
      
      const nearOrAtEMA70Divergence =
        divergence && (Math.abs(lastClose - lastEMA70) / lastClose < 0.002);

      const nearEMA14 = closes.slice(-3).some(c => Math.abs(c - lastEMA14) / c < 0.002);
      const nearEMA70 = closes.slice(-3).some(c => Math.abs(c - lastEMA70) / c < 0.002);
      const ema14Bounce = nearEMA14 && lastClose > lastEMA14;
      const ema70Bounce = nearEMA70 && lastClose > lastEMA70;

      const { level, type } = findRelevantLevel(ema14, ema70, closes, highs, lows, trend);
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const inferredLevel = trend === 'bullish' ? highestHigh : lowestLow;
      const inferredLevelType = trend === 'bullish' ? 'resistance' : 'support';

      const inferredLevelWithinRange =
        inferredLevel <= currDayHigh && inferredLevel >= currDayLow;

      let divergenceFromLevel = false;
      if (type && level !== null) {
        const levelIdx = closes.findIndex(c => Math.abs(c - level) / c < 0.002);
        if (
          (type === 'resistance' && lastClose > level && levelIdx !== -1 && rsi14.at(-1)! < rsi14[levelIdx]) ||
          (type === 'support' && lastClose < level && levelIdx !== -1 && rsi14.at(-1)! > rsi14[levelIdx])
        ) {
          divergenceFromLevel = true;
        }
      }

      const touchedEMA70Today =
        prevDayHigh >= lastEMA70 && prevDayLow <= lastEMA70 &&
        candles.some(c => Math.abs(c.close - lastEMA70) / c.close < 0.002);

const bullishBreakout = currDayLow > 0 && inferredLevel > prevDayHigh;
const bearishBreakout = inferredLevel < prevDayLow;
const breakout = bullishBreakout || bearishBreakout;


      results[symbol] = {
  trend,
  breakout,
  bullishBreakout,
  bearishBreakout,
  divergence,
  ema14Bounce,
  ema70Bounce,
  currentPrice: lastClose,
  level,
  levelType: type,
  inferredLevel,
  inferredLevelType,
  nearOrAtEMA70Divergence,
  inferredLevelWithinRange,
  divergenceFromLevel,
  touchedEMA70Today,
  bearishContinuation,
  bullishContinuation,
};
    } catch (err) {
      console.error(`Error fetching ${symbol}:`, err);
    }
  }

  return {
    props: {
      signals: results,
    },
  };
}

// In the component SignalChecker, just render the two new fields like this:


export default function SignalChecker({ signals }: { signals: Record<string, SignalData> }) {
  return (
   <div className="p-4 space-y-6">
  {Object.entries(signals).map(([symbol, data]) => (
    <div key={symbol} className="bg-black/60 backdrop-blur-md rounded-xl p-4 shadow">
      <h2 className="text-xl font-bold text-white">{symbol} Signal</h2>
      <p>📈 Trend: <span className="font-semibold">{data.trend}</span></p>
      <p>🚀 Daily Breakout: <span className={data.breakout ? 'text-green-400' : 'text-red-400'}>{data.breakout ? 'Yes' : 'No'}</span></p>
<p>🟢 Bullish Breakout: <span className={data.bullishBreakout ? 'text-green-400' : 'text-red-400'}>{data.bullishBreakout ? 'Yes' : 'No'}</span></p>
<p>🔴 Bearish Breakout: <span className={data.bearishBreakout ? 'text-green-400' : 'text-red-400'}>{data.bearishBreakout ? 'Yes' : 'No'}</span></p>
      <p>
        📉 RSI Divergence:{' '}
        <span className={data.divergence ? 'text-green-400' : 'text-red-400'}>
          {data.divergence ? 'Yes' : 'No'}
        </span>
      </p>
      <p>
        🟠 Near/At EMA70 Divergence:{' '}
        <span className={data.nearOrAtEMA70Divergence ? 'text-green-400' : 'text-red-400'}>
          {data.nearOrAtEMA70Divergence ? 'Yes' : 'No'}
        </span>
      </p>
      <p>
        🟣 Inferred Level within Range:{' '}
        <span className={data.inferredLevelWithinRange ? 'text-green-400' : 'text-red-400'}>
          {data.inferredLevelWithinRange ? 'Yes' : 'No'}
        </span>
      </p>
      <p>
        🔁 EMA14 Bounce:{' '}
        <span className={data.ema14Bounce ? 'text-green-400' : 'text-red-400'}>
          {data.ema14Bounce ? 'Yes' : 'No'}
        </span>
      </p>
      <p>
        🟡 EMA70 Bounce:{' '}
        <span className={data.ema70Bounce ? 'text-green-400' : 'text-red-400'}>
          {data.ema70Bounce ? 'Yes' : 'No'}
        </span>
      </p>
      <p>
        💰 Current Price: <span className="text-blue-400">{data.currentPrice.toFixed(2)}</span>
      </p>
      <p>
        📊 {data.levelType?.toUpperCase()} Level:{' '}
        <span className="text-yellow-300">{data.level ? data.level.toFixed(2) : 'N/A'}</span>
      </p>
      <p>
        🧭 Inferred {data.inferredLevelType === 'support' ? 'Support' : 'Resistance'}:{' '}
        <span className="text-purple-300">{data.inferredLevel.toFixed(2)}</span>
      </p>
      <p>
        🔍 Divergence From Level:{' '}
        <span className={data.divergenceFromLevel ? 'text-green-400' : 'text-red-400'}>
          {data.divergenceFromLevel ? 'Yes' : 'No'}
        </span>
      </p>
      <p>
        🧲 Touched EMA70 Today:{' '}
        <span className={data.touchedEMA70Today ? 'text-green-400' : 'text-red-400'}>
          {data.touchedEMA70Today ? 'Yes' : 'No'}
        </span>
      </p>
      <p>
        🔻 Bearish Continuation:{' '}
        <span className={data.bearishContinuation ? 'text-red-400' : 'text-gray-400'}>
          {data.bearishContinuation ? 'Yes' : 'No'}
        </span>
      </p>
      <p>
        🔺 Bullish Continuation:{' '}
        <span className={data.bullishContinuation ? 'text-green-400' : 'text-gray-400'}>
          {data.bullishContinuation ? 'Yes' : 'No'}
        </span>
      </p>
    </div>
  ))}
</div>
  );
          }
