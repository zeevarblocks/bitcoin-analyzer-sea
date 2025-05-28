import React from 'react';

interface SignalData {
  trend: string;
  breakout: boolean;
  divergence: boolean;
  emaSupport: boolean;
  ema14Bounce: boolean;
  level: number | null;
  levelType: 'support' | 'resistance' | null;
}

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
    .reverse(); // newest last
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
  trend: 'bullish' | 'bearish'
): { level: number | null, type: 'support' | 'resistance' | null } {
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

  return { level: null, type: null };
}

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
      const dailyHigh = prevDay?.high ?? 0;
      const dailyLow = prevDay?.low ?? 0;

      const prevHighIdx = highs.lastIndexOf(dailyHigh);
      const prevLowIdx = lows.lastIndexOf(dailyLow);

      const divergence =
        (highs.at(-1)! > dailyHigh && prevHighIdx !== -1 && rsi14.at(-1)! < rsi14[prevHighIdx]) ||
        (lows.at(-1)! < dailyLow && prevLowIdx !== -1 && rsi14.at(-1)! > rsi14[prevLowIdx]);

      const crossIdx = ema14.findIndex((v, i) => v < ema70[i] && ema14[i + 1] > ema70[i + 1]);
      const emaSupport = crossIdx !== -1;

      const breakout = highs.at(-1)! > dailyHigh || lows.at(-1)! < dailyLow;
      const recentTouches = closes.slice(-3).some(c => Math.abs(c - lastEMA14) / c < 0.002);
      const ema14Bounce = recentTouches && lastClose > lastEMA14;

      const { level, type } = findRelevantLevel(ema14, ema70, closes, trend);

      results[symbol] = {
        trend,
        breakout,
        divergence,
        emaSupport,
        ema14Bounce,
        level,
        levelType: type,
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

export default function SignalChecker({ signals }: { signals: Record<string, SignalData> }) {
  return (
    <div className="p-4 space-y-6">
      {Object.entries(signals).map(([symbol, data]) => (
        <div key={symbol} className="bg-black/60 backdrop-blur-md rounded-xl p-4 shadow">
          <h2 className="text-xl font-bold text-white">{symbol} Signal</h2>
          <p>📈 Trend: <span className="font-semibold">{data.trend}</span></p>
          <p>
            🚀 Daily Breakout:{' '}
            <span className={data.breakout ? 'text-green-400' : 'text-red-400'}>
              {data.breakout ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            📉 RSI Divergence:{' '}
            <span className={data.divergence ? 'text-green-400' : 'text-red-400'}>
              {data.divergence ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🛡️ EMA Support/Resistance:{' '}
            <span className={data.emaSupport ? 'text-green-400' : 'text-red-400'}>
              {data.emaSupport ? 'Detected' : 'No'}
            </span>
          </p>
          <p>
            🔁 EMA14 Bounce:{' '}
            <span className={data.ema14Bounce ? 'text-green-400' : 'text-red-400'}>
              {data.ema14Bounce ? 'Yes' : 'No'}
            </span>
          </p>
          {data.levelType && (
            <p>
              {data.levelType === 'support' && <>🟢 Support Level: <span className="text-green-400">{data.level?.toFixed(2)}</span></>}
              {data.levelType === 'resistance' && <>🔴 Resistance Level: <span className="text-red-400">{data.level?.toFixed(2)}</span></>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
