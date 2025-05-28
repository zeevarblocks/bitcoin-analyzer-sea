import type { NextApiRequest, NextApiResponse } from 'next';

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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

function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];

  let emaPrev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema[period - 1] = emaPrev;

  for (let i = period; i < data.length; i++) {
    const price = data[i];
    emaPrev = price * k + emaPrev * (1 - k);
    ema[i] = emaPrev;
  }

  return ema;
}

function calculateRSI(closes: number[], period: number): number[] {
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  let avgGain = gains.reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.reduce((a, b) => a + b, 0) / period;

  const rsi: number[] = [];

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / (avgLoss || 1);
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = req.query.symbol as string;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol parameter' });
  }

  try {
    const response = await fetch(
      `https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=1h&limit=100`
    );
    const data = await response.json();

    if (!data?.data || !Array.isArray(data.data)) {
      return res.status(500).json({ error: 'Invalid response from OKX' });
    }

    const candles: Candle[] = data.data
      .map((d: string[]) => ({
        timestamp: parseInt(d[0], 10),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      }))
      .reverse();

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    const currentPrice = closes[closes.length - 1];
    const ema14 = calculateEMA(closes, 14);
    const ema70 = calculateEMA(closes, 70);
    const rsi = calculateRSI(closes, 14);

    const lastRSI = rsi[rsi.length - 1];
    const divergence = lastRSI < 30;
    const breakout = currentPrice > Math.max(...highs.slice(-20));
    const ema14Bounce = Math.abs(currentPrice - ema14[ema14.length - 1]) / currentPrice < 0.01;
    const ema70Bounce = Math.abs(currentPrice - ema70[ema70.length - 1]) / currentPrice < 0.01;
    const trend = ema14[ema14.length - 1] > ema70[ema70.length - 1] ? 'Uptrend' : 'Downtrend';

    const inferredLevelType: 'support' | 'resistance' =
      trend === 'Uptrend' ? 'support' : 'resistance';

    const inferredLevel =
      inferredLevelType === 'support'
        ? Math.min(...lows.slice(-20))
        : Math.max(...highs.slice(-20));

    const inferredLevelWithinRange = inferredLevelType === 'support'
      ? currentPrice <= inferredLevel * 1.01
      : currentPrice >= inferredLevel * 0.99;

    const nearOrAtEMA70Divergence = divergence &&
      Math.abs(currentPrice - ema70[ema70.length - 1]) / currentPrice < 0.01;

    const signal: SignalData = {
      trend,
      breakout,
      divergence,
      ema14Bounce,
      ema70Bounce,
      currentPrice,
      level: null,
      levelType: null,
      inferredLevel,
      inferredLevelType,
      nearOrAtEMA70Divergence,
      inferredLevelWithinRange,
    };

    res.status(200).json({ signal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch or process market data' });
  }
}
