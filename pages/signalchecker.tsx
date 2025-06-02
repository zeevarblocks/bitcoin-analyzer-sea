
import React, { useEffect, useState } from 'react';

interface SignalData {
  trend: 'bullish' | 'bearish' | 'neutral';
  breakout: boolean;
  bullishBreakout: boolean;
  bearishBreakout: boolean;
  divergence: boolean;
  divergenceFromLevel: boolean;
  nearOrAtEMA70Divergence: boolean;
  ema14Bounce: boolean;
  ema70Bounce: boolean;
  touchedEMA70Today: boolean;
  currentPrice: number;
  level: number | null;
  levelType: string | null;
  inferredLevel: number;
  inferredLevelType: 'support' | 'resistance';
  inferredLevelWithinRange: boolean;
  bearishContinuation: boolean;
  bullishContinuation: boolean;
  bearishReversal: boolean;
  bullishReversal: boolean;
  intradayHigherHighBreak: boolean;
  intradayLowerLowBreak: boolean;
  todaysLowestLow: number;
  todaysHighestHigh: number;
  confidence: { bullish: number; bearish: number };
  url: string;
}

interface DetectionOption {
  debug?: boolean;
  useEMA200?: boolean;
  useVolume?: boolean;
  volumeSpikeFactor?: number;
  slopeThreshold?: number;
  rsiMin?: number;
  rsiMax?: number;
  swingLookback?: number;
  lookaheadLimit?: number;
  priceTouchThreshold?: number;
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
  const url = `https://www.okx.com/api/v5/market/history-candles?instId=${symbol}&bar=${interval}&limit=500`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data.data) throw new Error('Failed to fetch candles');
  return data.data.map((c: any[]) => ({
    timestamp: Number(c[0]),
    open: Number(c[1]),
    high: Number(c[2]),
    low: Number(c[3]),
    close: Number(c[4]),
    volume: Number(c[5]),
  }));
}

function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  let prevEMA = data[0];
  ema[0] = prevEMA;
  for (let i = 1; i < data.length; i++) {
    prevEMA = data[i] * k + prevEMA * (1 - k);
    ema[i] = prevEMA;
  }
  return ema;
}

function calculateRSI(data: number[], period: number): number[] {
  const deltas = data.map((v, i) => (i === 0 ? 0 : v - data[i - 1]));
  let gains = 0;
  let losses = 0;
  const rsi: number[] = [];
  for (let i = 1; i <= period; i++) {
    if (deltas[i] > 0) gains += deltas[i];
    else losses -= deltas[i];
  }
  gains /= period;
  losses /= period;
  rsi[period] = 100 - 100 / (1 + gains / (losses || 1));
  for (let i = period + 1; i < data.length; i++) {
    const delta = deltas[i];
    if (delta > 0) {
      gains = (gains * (period - 1) + delta) / period;
      losses = (losses * (period - 1)) / period;
    } else {
      gains = (gains * (period - 1)) / period;
      losses = (losses * (period - 1) - delta) / period;
    }
    rsi[i] = 100 - 100 / (1 + gains / (losses || 1));
  }
  for(let i=0; i < period; i++) rsi[i] = 50; // neutral fill for initial
  return rsi;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateSlope(arr: number[], index: number, window: number = 5): number {
  if (index < window) return 0;
  const start = arr[index - window];
  const end = arr[index];
  return (end - start) / window;
}

function isSwingLowBroken(lows: number[], index: number, lookback: number): boolean {
  const currentLow = lows[index];
  for (let i = index - lookback; i < index; i++) {
    if (i >= 0 && lows[i] < currentLow) return true;
  }
  return false;
}

function isSwingHighBroken(highs: number[], index: number, lookback: number): boolean {
  const currentHigh = highs[index];
  for (let i = index - lookback; i < index; i++) {
    if (i >= 0 && highs[i] > currentHigh) return true;
  }
  return false;
}

function detectBullishContinuation(
  closes: number[],
  lows: number[],
  highs: number[],
  ema70: number[],
  ema14: number[],
  rsi: number[],
  ema200: number[],
  volumes: number[],
  options: DetectionOption = {}
): boolean {
  const {
    debug = false,
    useEMA200 = true,
    useVolume = true,
    volumeSpikeFactor = 1.5,
    slopeThreshold = 0.01,
    rsiMin = 50,
    rsiMax = 70,
    swingLookback = 8,
    lookaheadLimit = 25,
    priceTouchThreshold = 0.0045,
  } = options;

  for (let i = 1; i < closes.length; i++) {
    const prev14 = ema14[i - 1];
    const curr14 = ema14[i];
    const prev70 = ema70[i - 1];
    const curr70 = ema70[i];

    if (prev14 < prev70 && curr14 > curr70) {
      const rsiAtCross = rsi[i];
      if (rsiAtCross < rsiMin || rsiAtCross > rsiMax) continue;

      const emaSlope = calculateSlope(ema70, i);
      if (emaSlope < slopeThreshold) continue; // slope should be positive and beyond threshold

      if (useEMA200 && closes[i] < ema200[i]) continue;

      if (isSwingLowBroken(lows, i, swingLookback)) continue;

      if (useVolume) {
        const avgVol = average(volumes.slice(Math.max(0, i - 5), i));
        if (volumes[i] < avgVol * volumeSpikeFactor) continue;
      }

      for (let j = i + 1; j <= i + lookaheadLimit && j < closes.length; j++) {
        const priceNearEMA = Math.abs(closes[j] - ema70[j]) / closes[j] < priceTouchThreshold;
        const rsiHigher = rsi[j] > rsiAtCross;

        if (priceNearEMA && rsiHigher) {
          if (debug) console.log(`Bullish continuation confirmed at index ${j}`);
          return true;
        }
      }
    }
  }
  return false;
}

function detectBearishContinuation(
  closes: number[],
  highs: number[],
  lows: number[],
  ema70: number[],
  ema14: number[],
  rsi: number[],
  ema200: number[],
  volumes: number[],
  options: DetectionOption = {}
): boolean {
  const {
    debug = false,
    useEMA200 = true,
    useVolume = true,
    volumeSpikeFactor = 1.5,
    slopeThreshold = 0.01,
    rsiMin = 30,
    rsiMax = 50,
    swingLookback = 8,
    lookaheadLimit = 25,
    priceTouchThreshold = 0.0045,
  } = options;

  for (let i = 1; i < closes.length; i++) {
    const prev14 = ema14[i - 1];
    const curr14 = ema14[i];
    const prev70 = ema70[i - 1];
    const curr70 = ema70[i];

    if (prev14 > prev70 && curr14 < curr70) {
      const rsiAtCross = rsi[i];
      if (rsiAtCross < rsiMin || rsiAtCross > rsiMax) continue;

      const emaSlope = calculateSlope(ema70, i);
      if (emaSlope > -slopeThreshold) continue; // slope should be negative and beyond threshold

      if (useEMA200 && closes[i] > ema200[i]) continue;

      if (isSwingHighBroken(highs, i, swingLookback)) continue;

      if (useVolume) {
        const avgVol = average(volumes.slice(Math.max(0, i - 5), i));
        if (volumes[i] < avgVol * volumeSpikeFactor) continue;
      }

      for (let j = i + 1; j <= i + lookaheadLimit && j < closes.length; j++) {
        const priceNearEMA = Math.abs(closes[j] - ema70[j]) / closes[j] < priceTouchThreshold;
        const rsiHigher = rsi[j] > rsiAtCross;

        if (priceNearEMA && rsiHigher) {
          if (debug) console.log(`Bearish continuation confirmed at index ${j}`);
          return true;
        }
      }
    }
  }
  return false;
}

async function fetchTopPairs(minVolume = 5000000): Promise<string[]> {
  const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=FUTURES');
  const data = await response.json();
  if (!data.data) throw new Error('Invalid pairs data');
  return data.data
    .filter((item: any) => Number(item.volCcy24h) > minVolume)
    .map((item: any) => item.instId)
    .filter((id: string) => id.endsWith('-USDT'));
}

const SIGNALS_URL_BASE = 'https://www.okx.com/markets/futures-spot/';

export default function SignalsChecker() {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError(null);

        const pairs = await fetchTopPairs(5000000);

        const signalsResults: SignalData[] = [];

        for (const symbol of pairs) {
          // Fetch 1d candles for EMA200 and 70 calculation
          const dailyCandles = await fetchCandles(symbol, '1d');
          const dailyCloses = dailyCandles.map(c => c.close);
          const dailyHighs = dailyCandles.map(c => c.high);
          const dailyLows = dailyCandles.map(c => c.low);
          const dailyVolumes = dailyCandles.map(c => c.volume);

          const ema200 = calculateEMA(dailyCloses, 200);
          const ema70 = calculateEMA(dailyCloses, 70);

          // Fetch 15m candles for shorter EMA, RSI, and continuation detection
          const candles15m = await fetchCandles(symbol, '15m');
          const closes15m = candles15m.map(c => c.close);
          const highs15m = candles15m.map(c => c.high);
          const lows15m = candles15m.map(c => c.low);
          const volumes15m = candles15m.map(c => c.volume);

          const ema14 = calculateEMA(closes15m, 14);
          const rsi = calculateRSI(closes15m, 14);

          // Detect bullish continuation
          const bullishContinuation = detectBullishContinuation(
            closes15m,
            lows15m,
            highs15m,
            ema70,
            ema14,
            rsi,
            ema200,
            volumes15m,
            { debug: false }
          );

          // Detect bearish continuation
          const bearishContinuation = detectBearishContinuation(
            closes15m,
            highs15m,
            lows15m,
            ema70,
            ema14,
            rsi,
            ema200,
            volumes15m,
            { debug: false }
          );

          const lastClose = closes15m[closes15m.length - 1];

          const signal: SignalData = {
            trend: bullishContinuation ? 'bullish' : bearishContinuation ? 'bearish' : 'neutral',
            breakout: bullishContinuation || bearishContinuation,
            bullishBreakout: bullishContinuation,
            bearishBreakout: bearishContinuation,
            divergence: false,
            divergenceFromLevel: false,
            nearOrAtEMA70Divergence: false,
            ema14Bounce: false,
            ema70Bounce: false,
            touchedEMA70Today: false,
            currentPrice: lastClose,
            level: null,
            levelType: null,
            inferredLevel: 0,
            inferredLevelType: 'support',
            inferredLevelWithinRange: false,
            bearishContinuation,
            bullishContinuation,
            bearishReversal: false,
            bullishReversal: false,
            intradayHigherHighBreak: false,
            intradayLowerLowBreak: false,
            todaysLowestLow: Math.min(...lows15m),
            todaysHighestHigh: Math.max(...highs15m),
            confidence: { bullish: bullishContinuation ? 0.7 : 0, bearish: bearishContinuation ? 0.7 : 0 },
            url: `${SIGNALS_URL_BASE}${symbol}`,
          };

          signalsResults.push(signal);
        }

        setSignals(signalsResults);
      } catch (e: any) {
        setError(e.message || 'Error fetching signals');
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>OKX Futures Signals</h1>
      {loading && <p>Loading signals...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <ul>
        {signals.map((sig, i) => (
          <li key={i}>
            <a href={sig.url} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>
              {sig.url.split('/').pop()}
            </a>
            : Trend: {sig.trend}, Bullish: {sig.bullishBreakout ? 'Yes' : 'No'}, Bearish: {sig.bearishBreakout ? 'Yes' : 'No'}, Price: {sig.currentPrice.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
