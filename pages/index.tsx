import React from 'react';

interface SignalData {
  trend: string;
  breakout: boolean;
  bullishBreakout: boolean;
  bearishBreakout: boolean;
  divergence: boolean;
  divergenceType?: 'bullish' | 'bearish' | null;
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
  intradayHigherHighBreak: boolean;
  intradayLowerLowBreak: boolean;
  todaysLowestLow: number;
  todaysHighestHigh: number;
  url: string;

  // ✅ Added structured signal outputs
  bearishContinuation?: TradeSignal | null;
  bullishContinuation?: TradeSignal | null;
  bullishReversal?: TradeSignal | null;
  bearishReversal?: TradeSignal | null;
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

function getLowestLowIndex(lows: number[]): number {
  let minIndex = 0;
  for (let i = 1; i < lows.length; i++) {
    if (lows[i] < lows[minIndex]) {
      minIndex = i;
    }
  }
  return minIndex;
}

function hasAscendingTrendFromLowestLow(lows: number[], fromIndex: number): boolean {
  for (let i = fromIndex + 1; i < lows.length - 1; i++) {
    if (lows[i] < lows[i - 1]) {
      return false;
    }
  }
  return true;
}

function getHighestHighIndex(highs: number[]): number {
  let maxIndex = 0;
  for (let i = 1; i < highs.length; i++) {
    if (highs[i] > highs[maxIndex]) {
      maxIndex = i;
    }
  }
  return maxIndex;
}

function hasDescendingTrendFromHighestHigh(highs: number[], fromIndex: number): boolean {
  for (let i = fromIndex + 1; i < highs.length - 1; i++) {
    if (highs[i] > highs[i - 1]) {
      return false;
    }
  }
  return true;
                                           }

// === Bearish Continuation ===
function detectBearishContinuation(
  closes: number[],
  highs: number[],
  ema70: number[],
  rsi: number[],
  ema14: number[]
): { entry: number; stopLoss: number; takeProfitRange: [number, number]; type: string } | null {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const prev70 = ema70[i - 1];
    const curr14 = ema14[i];
    const curr70 = ema70[i];

    if (prev14 > prev70 && curr14 < curr70) {
      const rsiAtCross = rsi[i];
      let lastHigh = highs[i];
      let entry = closes[i]; // default entry

      for (let j = i + 1; j < closes.length; j++) {
        const price = closes[j];
        const nearEMA70 = Math.abs(price - ema70[j]) / price < 0.002;
        const rsiHigher = rsi[j] > rsiAtCross;
        const lowerHigh = highs[j] < lastHigh;

        if (nearEMA70 && rsiHigher && lowerHigh) {
          lastHigh = highs[j];
          entry = price;
        } else if (highs[j] > lastHigh) {
          return null;
        }

        if (j - i >= 2 && lowerHigh) {
          const stopLoss = entry * 1.01; // 1% above entry
          const takeProfitRange: [number, number] = [entry * 0.55, entry * 0.4];
          return {
            entry,
            stopLoss,
            takeProfitRange,
            type: "short"
          };
        }
      }
      break;
    }
  }
  return null;
}

// === Bullish Continuation ===
function detectBullishContinuation(
  closes: number[],
  lows: number[],
  ema70: number[],
  rsi: number[],
  ema14: number[]
): { entry: number; stopLoss: number; takeProfitRange: [number, number]; type: string } | null {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const prev70 = ema70[i - 1];
    const curr14 = ema14[i];
    const curr70 = ema70[i];

    if (prev14 < prev70 && curr14 > curr70) {
      const rsiAtCross = rsi[i];
      let lastLow = lows[i];
      let entry = closes[i]; // default entry

      for (let j = i + 1; j < closes.length; j++) {
        const price = closes[j];
        const nearEMA70 = Math.abs(price - ema70[j]) / price < 0.002;
        const rsiLower = rsi[j] < rsiAtCross;
        const higherLow = lows[j] > lastLow;

        if (nearEMA70 && rsiLower && higherLow) {
          lastLow = lows[j];
          entry = price;
        } else if (lows[j] < lastLow) {
          return null; // break of structure
        }

        if (j - i >= 2 && higherLow) {
          const stopLoss = entry * 0.99; // 1% below entry
          const takeProfitRange: [number, number] = [entry * 1.45, entry * 1.6];
          return {
            entry,
            stopLoss,
            takeProfitRange,
            type: "long"
          };
        }
      }
      break;
    }
  }
  return null;
}

// === Bullish Reversal ===
function detectBullishReversal(
  closes: number[],
  highs: number[],
  lows: number[],
  ema70: number[],
  ema14: number[],
  rsi: number[]
): { entry: number; stopLoss: number; takeProfitRange: [number, number]; type: string } | null {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const curr14 = ema14[i];
    const prev70 = ema70[i - 1];
    const curr70 = ema70[i];

    if (prev14 > prev70 && curr14 < curr70) {
      for (let j = i + 2; j < closes.length; j++) {
        let postCrossoverHigh = Math.max(...highs.slice(i + 1, j));
        const rsiDiverging = rsi[j] < rsi[i];
        const brokePostCrossoverHigh = highs[j] > postCrossoverHigh;

        if (rsiDiverging && brokePostCrossoverHigh) {
          const lowestLowIndex = getLowestLowIndex(lows.slice(0, j));
          const hasAscendingTrend = hasAscendingTrendFromLowestLow(lows, lowestLowIndex);

          if (hasAscendingTrend) {
            const entry = ema14[j];
            const stopLoss = entry * 0.99; // 1% below entry
            const takeProfitRange: [number, number] = [entry * 1.45, entry * 1.6];
            return {
              entry,
              stopLoss,
              takeProfitRange,
              type: "long"
            };
          }
        }
      }
      break;
    }
  }
  return null;
          }

// === Bearish Reversal ===
function detectBearishReversal(
  closes: number[],
  highs: number[],
  lows: number[],
  ema70: number[],
  ema14: number[],
  rsi: number[]
): { entry: number; stopLoss: number; takeProfitRange: [number, number]; type: string } | null {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const curr14 = ema14[i];
    const prev70 = ema70[i - 1];
    const curr70 = ema70[i];

    if (prev14 < prev70 && curr14 > curr70) {
      for (let j = i + 2; j < closes.length; j++) {
        let postCrossoverLow = Math.min(...lows.slice(i + 1, j));
        const rsiDiverging = rsi[j] > rsi[i];
        const brokePostCrossoverLow = lows[j] < postCrossoverLow;

        if (rsiDiverging && brokePostCrossoverLow) {
          const highestHighIndex = getHighestHighIndex(highs.slice(0, j));
          const hasDescendingTrend = hasDescendingTrendFromHighestHigh(highs, highestHighIndex);

          if (hasDescendingTrend) {
            const entry = ema14[j];
            const stopLoss = entry * 1.01; // 1% above entry
            const takeProfitRange: [number, number] = [entry * 0.55, entry * 0.4];
            return {
              entry,
              stopLoss,
              takeProfitRange,
              type: "short"
            };
          }
        }
      }
      break;
    }
  }
  return null;
}



// logic in getServerSideProps:
        export async function getServerSideProps() {
  async function fetchTopPairs(limit = 30): Promise<string[]> {
    const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const data = await response.json();

    return data.data
      .sort((a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
      .slice(0, limit)
      .map((ticker: any) => ticker.instId);
  }

  const symbols = await fetchTopPairs(30);
  const signals: Record<string, SignalData> = {};

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

      const now = new Date();
      const getUTCMillis = (y: number, m: number, d: number, hPH: number, min: number) =>
        Date.UTC(y, m, d, hPH - 8, min);

      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const date = now.getUTCDate();

      const today8AM = getUTCMillis(year, month, date, 8, 0);
      const tomorrow745AM = getUTCMillis(year, month, date + 1, 7, 45);
      const yesterday8AM = getUTCMillis(year, month, date - 1, 8, 0);
      const today745AM = getUTCMillis(year, month, date, 7, 45);

      const sessionStart = now.getTime() >= today8AM ? today8AM : yesterday8AM;
      const sessionEnd = now.getTime() >= today8AM ? tomorrow745AM : today745AM;

      const prevSessionStart = yesterday8AM;
      const prevSessionEnd = today745AM;

      const candlesToday = candles.filter(c => c.timestamp >= sessionStart && c.timestamp <= sessionEnd);
      const candlesPrev = candles.filter(c => c.timestamp >= prevSessionStart && c.timestamp <= prevSessionEnd);

      const todaysLowestLow = candlesToday.length ? Math.min(...candlesToday.map(c => c.low)) : null;
      const todaysHighestHigh = candlesToday.length ? Math.max(...candlesToday.map(c => c.high)) : null;
      const prevSessionLow = candlesPrev.length ? Math.min(...candlesPrev.map(c => c.low)) : null;
      const prevSessionHigh = candlesPrev.length ? Math.max(...candlesPrev.map(c => c.high)) : null;

      const intradayLowerLowBreak = todaysLowestLow! < prevSessionLow!;
      const intradayHigherHighBreak = todaysHighestHigh! > prevSessionHigh!;
      const breakout = intradayLowerLowBreak || intradayHigherHighBreak;

      const prevHighIdx = highs.lastIndexOf(prevSessionHigh!);
      const prevLowIdx = lows.lastIndexOf(prevSessionLow!);

      const currentRSI = rsi14.at(-1);
      const prevHighRSI = rsi14[prevHighIdx] ?? null;
      const prevLowRSI = rsi14[prevLowIdx] ?? null;

      let divergenceType: 'bullish' | 'bearish' | null = null;
      if (lows.at(-1)! < prevSessionLow! && prevLowIdx !== -1 && currentRSI! > prevLowRSI!) {
        divergenceType = 'bullish';
      } else if (highs.at(-1)! > prevSessionHigh! && prevHighIdx !== -1 && currentRSI! < prevHighRSI!) {
        divergenceType = 'bearish';
      }

      const divergence = divergenceType !== null;
      const nearOrAtEMA70Divergence = divergence && Math.abs(lastClose - lastEMA70) / lastClose < 0.002;

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
        inferredLevel <= todaysHighestHigh! && inferredLevel >= todaysLowestLow!;

      let divergenceFromLevel = false;
      if (type && level !== null) {
        const levelIdx = closes.findIndex(c => Math.abs(c - level) / c < 0.002);
        if (
          (type === 'resistance' && lastClose > level && levelIdx !== -1 && currentRSI! < rsi14[levelIdx]) ||
          (type === 'support' && lastClose < level && levelIdx !== -1 && currentRSI! > rsi14[levelIdx])
        ) {
          divergenceFromLevel = true;
        }
      }

      const touchedEMA70Today =
        prevSessionHigh! >= lastEMA70 &&
        prevSessionLow! <= lastEMA70 &&
        candles.some(c => Math.abs(c.close - lastEMA70) / c.close < 0.002);

      const bearishContinuationResult = detectBearishContinuation(closes, highs, ema70, rsi14, ema14);
      const bullishContinuationResult = detectBullishContinuation(closes, lows, ema70, rsi14, ema14);
      const bullishReversalResult = detectBullishReversal(closes, highs, lows, ema70, ema14, rsi14);
      const bearishReversalResult = detectBearishReversal(closes, highs, lows, ema70, ema14, rsi14);

      signals[symbol] = {
        trend,
        breakout,
        bullishBreakout: intradayHigherHighBreak,
        bearishBreakout: intradayLowerLowBreak,
        divergence,
        divergenceType,
        ema14Bounce,
        ema70Bounce,
        currentPrice: lastClose,
        level,
        levelType: type,
        inferredLevel,
        inferredLevelType,
        inferredLevelWithinRange,
        divergenceFromLevel,
        nearOrAtEMA70Divergence,
        touchedEMA70Today,
        bearishContinuation: !!bearishContinuationResult,
        bullishContinuation: !!bullishContinuationResult,
        bullishReversal: !!bullishReversalResult,
        bearishReversal: !!bearishReversalResult,
        intradayHigherHighBreak,
        intradayLowerLowBreak,
        todaysLowestLow,
        todaysHighestHigh,
        url: `https://okx.com/join/96631749`,
      };
    } catch (err) {
      console.error(`Error fetching signal for ${symbol}:`, err);
    }
  }

const defaultSymbol = symbols[0];

          type TradeSignal = {
  entry: number;
  stopLoss: number;
  takeProfitRange: [number, number];
  type: string;
};

          
  return {
    props: {
      signals,
      symbols,
      defaultSymbol,
    },
  };
  }


// In the component SignalChecker, just render the two new fields like this:
import { useState, useEffect } from 'react';

export default function SignalChecker({ signals }: { signals: Record<string, SignalData> }) {
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
        const data = await response.json();

        const sortedPairs = data.data
          .sort((a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
          .map((item: any) => item.instId);

        setPairs(sortedPairs);

        // Find the first pair that exists in signals and has valid data
        const defaultPair = sortedPairs.find(
          (pair) => signals?.[pair]?.currentPrice !== undefined
        );
        if (defaultPair) {
          setSelectedPair(defaultPair);
        }
      } catch (error) {
        console.error('Error fetching trading pairs:', error);
      }
    };

    fetchPairs();

    const intervalId = setInterval(fetchPairs, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [signals]);

  // Filter signals based on selectedPair
  const filteredSignals =
    selectedPair && signals?.[selectedPair] ? { [selectedPair]: signals[selectedPair] } : {};

  return (
    <div className="p-6 space-y-8 bg-gradient-to-b from-gray-900 to-black min-h-screen">
      {/* Dropdown for Trading Pairs */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <label htmlFor="tradingPair" className="text-white font-semibold">
          Select Trading Pair:
        </label>
        <select
          id="tradingPair"
          className="p-2 rounded border bg-gray-800 text-white"
          value={selectedPair ?? ''}
          onChange={(e) => setSelectedPair(e.target.value === '' ? null : e.target.value)}
        >
          {pairs.filter((pair) => signals?.[pair]).map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>
      </div>

      {Object.entries(filteredSignals).map(([symbol, data]) => {
        if (!data) return null;

        return (
          <div
            key={symbol}
            className="bg-black/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10 text-white space-y-4"
          >
            <h2 className="text-2xl font-bold text-yellow-400">📡 {symbol} Signal Overview</h2>

            <div className="space-y-1">
              <p>
                💰{' '}
                <span className="font-medium text-white/70">Current Price:</span>{' '}
                <span className="text-blue-400">
                  {data.currentPrice !== undefined
                    ? `$${data.currentPrice.toFixed(2)}`
                    : 'N/A'}
                </span>
              </p>
              <p>
                📊{' '}
                <span className="font-medium text-white/70">
                  {data.levelType?.toUpperCase() ?? 'N/A'} Level:
                </span>{' '}
                <span className="text-yellow-300">
                  {data.level !== undefined ? data.level.toFixed(2) : 'N/A'}
                </span>
              </p>
              <p>
                🧭{' '}
                <span className="font-medium text-white/70">
                  Inferred{' '}
                  {data.inferredLevelType === 'support' ? 'Support' : 'Resistance'}:
                </span>{' '}
                <span className="text-purple-300">
                  {data.inferredLevel !== undefined
                    ? data.inferredLevel.toFixed(2)
                    : 'N/A'}
                </span>
              </p>
              <p>
                📈{' '}
                <span className="font-medium text-white/70">Trend:</span>{' '}
                <span className="font-semibold text-cyan-300">
                  {data.trend ?? 'N/A'}
                </span>
              </p>
            </div>

            {(data.bullishBreakout || data.bearishBreakout) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">📊 Breakout Signals</h3>
                {data.bullishBreakout && (
                  <p className="text-green-400">
                    🟢 Bullish Breakout: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.bearishBreakout && (
                  <p className="text-red-400">
                    🔴 Bearish Breakout: <span className="font-semibold">Yes</span>
                  </p>
                )}
              </div>
            )}

            {(data.bearishContinuation.detected || data.bullishContinuation.detected || data.bullishReversal.detected || data.bearishReversal.detected) && (
  <div className="pt-4 border-t border-white/10 space-y-4">
    <h3 className="text-lg font-semibold text-white">📊 Signal Summary</h3>

    {data.bearishContinuation.detected && (
      <div className="text-red-400 space-y-1">
        <p>🔻 <span className="font-semibold">Bearish Continuation: Confirmed</span></p>
        <ul className="list-disc list-inside text-sm pl-2">
          <li>🎯 Entry: {data.bearishContinuation.entry?.toFixed(2)}</li>
          <li>🛑 Stop Loss: {data.bearishContinuation.stopLoss?.toFixed(2)}</li>
          <li>🎯 Take Profit: {data.bearishContinuation.takeProfitMin?.toFixed(2)} – {data.bearishContinuation.takeProfitMax?.toFixed(2)}</li>
        </ul>
      </div>
    )}

    {data.bullishContinuation.detected && (
      <div className="text-green-400 space-y-1">
        <p>🔺 <span className="font-semibold">Bullish Continuation: Confirmed</span></p>
        <ul className="list-disc list-inside text-sm pl-2">
          <li>🎯 Entry: {data.bullishContinuation.entry?.toFixed(2)}</li>
          <li>🛑 Stop Loss: {data.bullishContinuation.stopLoss?.toFixed(2)}</li>
          <li>🎯 Take Profit: {data.bullishContinuation.takeProfitMin?.toFixed(2)} – {data.bullishContinuation.takeProfitMax?.toFixed(2)}</li>
        </ul>
      </div>
    )}

    {data.bullishReversal.detected && (
      <div className="text-emerald-400 space-y-1">
        <p>🔄 <span className="font-semibold">Bullish Reversal: Detected</span></p>
        <ul className="list-disc list-inside text-sm pl-2">
          <li>🎯 Entry: {data.bullishReversal.entry?.toFixed(2)}</li>
          <li>🛑 Stop Loss: {data.bullishReversal.stopLoss?.toFixed(2)}</li>
          <li>🎯 Take Profit: {data.bullishReversal.takeProfitMin?.toFixed(2)} – {data.bullishReversal.takeProfitMax?.toFixed(2)}</li>
        </ul>
      </div>
    )}

    {data.bearishReversal.detected && (
      <div className="text-orange-400 space-y-1">
        <p>🔃 <span className="font-semibold">Bearish Reversal: Detected</span></p>
        <ul className="list-disc list-inside text-sm pl-2">
          <li>🎯 Entry: {data.bearishReversal.entry?.toFixed(2)}</li>
          <li>🛑 Stop Loss: {data.bearishReversal.stopLoss?.toFixed(2)}</li>
          <li>🎯 Take Profit: {data.bearishReversal.takeProfitMin?.toFixed(2)} – {data.bearishReversal.takeProfitMax?.toFixed(2)}</li>
        </ul>
      </div>
    )}
  </div>
)}

            {(data.ema14Bounce || data.ema70Bounce || data.touchedEMA70Today) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  🧲 EMA Bounce & Zone Testing
                </h3>
                {data.ema14Bounce && (
                  <p className="text-green-400">
                    🔁 EMA14 Bounce: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.ema70Bounce && (
                  <p className="text-yellow-300">
                    🟡 EMA70 Bounce: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.touchedEMA70Today && (
                  <p className="text-blue-300">
                    🧲 EMA70 Tested Today: <span className="font-semibold">Yes</span>
                  </p>
                )}
              </div>
            )}

            {(data.divergenceFromLevel ||
              data.divergence ||
              data.nearOrAtEMA70Divergence) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">📉 RSI Divergence</h3>
                {data.divergenceFromLevel && (
                  <p className="text-pink-400">
                    🔍 Divergence vs Level: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.divergence && (
                  <p className="text-orange-400">
                    📉 RSI High/Low Divergence:{' '}
                    <span className="font-semibold">
                      {data.divergenceType === 'bullish' ? 'Bullish' : 'Bearish'}
                    </span>
                  </p>
                )}
                {data.nearOrAtEMA70Divergence && (
                  <p className="text-violet-400">
                    🟠 EMA70 Zone Divergence: <span className="font-semibold">Yes</span>
                  </p>
                )}
              </div>
            )}

            {data.inferredLevelWithinRange && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  🧭 Inferred Key Level Range
                </h3>
                <p className="text-green-300 italic">
                  🟣 In Range Today — “Price is near a key support or resistance level.”
                </p>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                onClick={() => window.open(data.url ?? '#', '_blank')}
                className="transition-transform transform hover:-translate-y-1 hover:shadow-lg bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
                title={`Access the best ${symbol} trading signals`}
              >
                🚀 Trade Now — Access the Best Signals Here!
              </button>
            </div>
<footer className="text-sm text-center text-gray-500 pt-6 border-t border-neutral-700 mt-10 px-4">
        <p>
          <strong className="text-gray-300">Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
        </p>
      </footer>
          </div>
        );
      })}
    </div>
  );
    }
