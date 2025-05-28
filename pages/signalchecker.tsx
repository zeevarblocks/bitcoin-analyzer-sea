// pages/signal-checker.tsx

import React from 'react';

interface SignalData {
  trend: string;
  breakout: boolean;
  divergence: boolean;
  emaSupport: boolean;
  ema14Bounce: boolean;
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

export async function getServerSideProps() {
  const symbol = 'BTC-USDT';

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

  // 1. Trend
  const trend = lastEMA14 > lastEMA70 ? 'bullish' : 'bearish';

  // 2. Previous daily high/low
  const dailyCandles = await fetchCandles(symbol, '1d');
  const prevDay = dailyCandles.at(-2);
  const dailyHigh = prevDay?.high ?? 0;
  const dailyLow = prevDay?.low ?? 0;

  // 3. RSI divergence (simplified)
  const prevHighIdx = highs.lastIndexOf(dailyHigh);
  const prevLowIdx = lows.lastIndexOf(dailyLow);
  const divergence =
    (highs.at(-1)! > dailyHigh && rsi14.at(-1)! < rsi14[prevHighIdx]) ||
    (lows.at(-1)! < dailyLow && rsi14.at(-1)! > rsi14[prevLowIdx]);

  // 4. EMA cross
  const crossIdx = ema14.findIndex((v, i) => v < ema70[i] && ema14[i + 1] > ema70[i + 1]);
  const emaSupport = crossIdx !== -1;

  // 5. Daily breakout
  const breakout = highs.at(-1)! > dailyHigh || lows.at(-1)! < dailyLow;

  // 6. EMA14 bounce
  const recentTouches = closes.slice(-3).some(c => Math.abs(c - lastEMA14) / c < 0.002);
  const ema14Bounce = recentTouches && lastClose > lastEMA14;

  const signals: SignalData = {
    trend,
    breakout,
    divergence,
    emaSupport,
    ema14Bounce,
  };

  return {
    props: {
      signals,
    },
  };
}

export default function SignalChecker({ signals }: { signals: SignalData }) {
  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-bold">15-Minute Signal Analysis (Server-Side)</h2>
      <p>📈 Trend: {signals.trend}</p>
      <p>🚀 Daily Breakout: {signals.breakout ? 'Yes' : 'No'}</p>
      <p>📉 RSI Divergence: {signals.divergence ? 'Yes' : 'No'}</p>
      <p>🛡️ EMA Support/Resistance: {signals.emaSupport ? 'Detected' : 'No'}</p>
      <p>🔁 EMA14 Bounce: {signals.ema14Bounce ? 'Yes' : 'No'}</p>
    </div>
  );
}
