// pages/api/signal.ts

import type { NextApiRequest, NextApiResponse } from 'next';

interface SignalData {
  trend: string;
  breakout: boolean;
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

  if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error(`No valid candle data returned for symbol ${symbol}`);
  }

  return data.data.map((d: string[]) => ({
    timestamp: +d[0],
    open: +d[1],
    high: +d[2],
    low: +d[3],
    close: +d[4],
    volume: +d[5],
  })).reverse();
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

async function analyzeSymbol(symbol: string): Promise<SignalData> {
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

  const dailyHigh = prevDay?.high ?? 0;
  const dailyLow = prevDay?.low ?? 0;
  const currDayHigh = currDay?.high ?? 0;
  const currDayLow = currDay?.low ?? 0;

  const prevHighIdx = highs.lastIndexOf(dailyHigh);
  const prevLowIdx = lows.lastIndexOf(dailyLow);

  const divergence =
    (highs.at(-1)! > dailyHigh && prevHighIdx !== -1 && rsi14.at(-1)! < rsi14[prevHighIdx]) ||
    (lows.at(-1)! < dailyLow && prevLowIdx !== -1 && rsi14.at(-1)! > rsi14[prevLowIdx]);

  const nearOrAtEMA70Divergence = divergence && (Math.abs(lastClose - lastEMA70) / lastClose < 0.002);

  const nearEMA14 = closes.slice(-3).some(c => Math.abs(c - lastEMA14) / c < 0.002);
  const nearEMA70 = closes.slice(-3).some(c => Math.abs(c - lastEMA70) / c < 0.002);
  const ema14Bounce = nearEMA14 && lastClose > lastEMA14;
  const ema70Bounce = nearEMA70 && lastClose > lastEMA70;

  const { level, type } = findRelevantLevel(ema14, ema70, closes, highs, lows, trend);
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  const inferredLevel = trend === 'bullish' ? highestHigh : lowestLow;
  const inferredLevelType = trend === 'bullish' ? 'resistance' : 'support';

  const inferredLevelWithinRange = inferredLevel <= currDayHigh && inferredLevel >= currDayLow;

  return {
    trend,
    breakout: highs.at(-1)! > dailyHigh || lows.at(-1)! < dailyLow,
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
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    const signal = await analyzeSymbol(symbol.toUpperCase());
    res.status(200).json({ signal });
  } catch (error: any) {
    console.error('Signal analysis failed:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze symbol' });
  }
        }
