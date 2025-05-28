import React from 'react';

interface SignalData {
  trend: string;
  breakout: boolean;
  divergence: boolean;
  ema70Bounce: boolean;
  supportLevel?: number;
  resistanceLevel?: number;
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

      const recentTouches = closes.slice(-3).some(c => Math.abs(c - lastEMA70) / c < 0.003);
      const ema70Bounce = recentTouches && (
        (trend === 'bullish' && lastClose > lastEMA70) ||
        (trend === 'bearish' && lastClose < lastEMA70)
      );

      const supportLevel = trend === 'bearish' ? Math.min(...lows.slice(-50)) : undefined;
      const resistanceLevel = trend === 'bullish' ? Math.max(...highs.slice(-50)) : undefined;

      results[symbol] = {
        trend,
        breakout: highs.at(-1)! > dailyHigh || lows.at(-1)! < dailyLow,
        divergence,
        ema70Bounce,
        supportLevel,
        resistanceLevel,
      };
    } catch (err) {
      console.error(`Error fetching ${symbol}:`, err);
    }
  }

  return { props: { signals: results } };
}

export default function SignalChecker({ signals }: { signals: Record<string, SignalData> }) {
  return (
    <div className="p-4 space-y-6">
      {Object.entries(signals).map(([symbol, data]) => (
        <div key={symbol} className="bg-black/60 backdrop-blur-md rounded-xl p-4 shadow">
          <h2 className="text-xl font-bold text-white">{symbol} Signal</h2>
          <p>📈 Trend: <span className="font-semibold">{data.trend}</span></p>
          <p>🚀 Daily Breakout: <span className={data.breakout ? 'text-green-400' : 'text-red-400'}>{data.breakout ? 'Yes' : 'No'}</span></p>
          <p>📉 RSI Divergence: <span className={data.divergence ? 'text-green-400' : 'text-red-400'}>{data.divergence ? 'Yes' : 'No'}</span></p>
          <p>🔁 EMA70 Bounce Detected: <span className={data.ema70Bounce ? 'text-green-400' : 'text-red-400'}>{data.ema70Bounce ? 'Yes' : 'No'}</span></p>
          {data.trend === 'bullish' && data.resistanceLevel && (
            <p>🧱 Resistance Level (Recent High): <span className="text-yellow-400">{data.resistanceLevel.toFixed(2)}</span></p>
          )}
          {data.trend === 'bearish' && data.supportLevel && (
            <p>🧱 Support Level (Recent Low): <span className="text-cyan-400">{data.supportLevel.toFixed(2)}</span></p>
          )}
        </div>
      ))}
    </div>
  );
          }
