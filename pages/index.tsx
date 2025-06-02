import React from 'react';

interface SignalData {
  trend: string;
  breakout: boolean;
  bullishBreakout: boolean;
  bearishBreakout: boolean;
  divergence: boolean;
  divergenceType?: 'bullish' | 'bearish' | null;
  divergenceFromLevel: boolean;
  divergenceFromLevelType?: 'bullish' | 'bearish' | null; // ✅ Newly added
  nearOrAtEMA70Divergence: boolean;
  ema14Bounce: boolean;
  ema70Bounce: boolean;
  currentPrice: number;
  level: number | null;
  levelType: 'support' | 'resistance' | null;
  inferredLevel: number;
  inferredLevelType: 'support' | 'resistance';
  inferredLevelWithinRange: boolean;
  touchedEMA70Today: boolean;
  bearishContinuation: boolean;
  bullishContinuation: boolean;
  bullishReversal: boolean;
  bearishReversal: boolean;
  intradayHigherHighBreak: boolean;
  intradayLowerLowBreak: boolean;
  todaysLowestLow: number;
  todaysHighestHigh: number;
  url: string;
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

// === Trendline Helpers ===
function getLowestLowIndex(lows: number[]): number {
  let min = lows[0];
  let index = 0;
  for (let i = 1; i < lows.length; i++) {
    if (lows[i] < min) {
      min = lows[i];
      index = i;
    }
  }
  return index;
}

function getHighestHighIndex(highs: number[]): number {
  let max = highs[0];
  let index = 0;
  for (let i = 1; i < highs.length; i++) {
    if (highs[i] > max) {
      max = highs[i];
      index = i;
    }
  }
  return index;
}

function hasAscendingTrendFromLowestLow(lows: number[], fromIndex: number, minPoints = 2): boolean {
  const trendPoints: number[] = [];
  for (let i = fromIndex + 1; i < lows.length - 1; i++) {
    if (lows[i] < lows[i - 1] && lows[i] < lows[i + 1]) {
      trendPoints.push(i);
      if (trendPoints.length >= minPoints) break;
    }
  }
  if (trendPoints.length < minPoints) return false;
  for (let i = 1; i < trendPoints.length; i++) {
    if (lows[trendPoints[i]] <= lows[trendPoints[i - 1]]) return false;
  }
  return true;
}

function hasDescendingTrendFromHighestHigh(highs: number[], fromIndex: number, minPoints = 2): boolean {
  const trendPoints: number[] = [];
  for (let i = fromIndex + 1; i < highs.length - 1; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i + 1]) {
      trendPoints.push(i);
      if (trendPoints.length >= minPoints) break;
    }
  }
  if (trendPoints.length < minPoints) return false;
  for (let i = 1; i < trendPoints.length; i++) {
    if (highs[trendPoints[i]] >= highs[trendPoints[i - 1]]) return false;
  }
  return true;
}

// === Bearish Continuation ===
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
      let lastHigh = highs[i];
      for (let j = i + 1; j < closes.length; j++) {
        const price = closes[j];
        const nearEMA70 = Math.abs(price - ema70[j]) / price < 0.002;
        const rsiHigher = rsi[j] > rsiAtCross;
        const lowerHigh = highs[j] < lastHigh;
        if (nearEMA70 && rsiHigher && lowerHigh) {
          lastHigh = highs[j];
        } else if (highs[j] > lastHigh) {
          return false; // ascending high breaks pattern
        }
        if (j - i >= 2 && lowerHigh) return true;
      }
      break;
    }
  }
  return false;
}

// === Bullish Continuation ===
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
      let lastLow = lows[i];
      for (let j = i + 1; j < closes.length; j++) {
        const price = closes[j];
        const nearEMA70 = Math.abs(price - ema70[j]) / price < 0.002;
        const rsiLower = rsi[j] < rsiAtCross;
        const higherLow = lows[j] > lastLow;
        if (nearEMA70 && rsiLower && higherLow) {
          lastLow = lows[j];
        } else if (lows[j] < lastLow) {
          return false; // descending low breaks pattern
        }
        if (j - i >= 2 && higherLow) return true;
      }
      break;
    }
  }
  return false;
}

// === Bullish Reversal ===
function detectBullishReversal(
  closes: number[],
  highs: number[],
  lows: number[],
  ema70: number[],
  ema14: number[],
  rsi: number[]
): boolean {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const curr14 = ema14[i];
    const prev70 = ema70[i - 1];
    const curr70 = ema70[i];

    if (prev14 > prev70 && curr14 < curr70) {
      for (let j = i + 1; j < closes.length; j++) {
        const rsiDiverging = rsi[j] < rsi[i];
        const brokeDescendingHighs = highs[j] > highs[j - 1] && highs[j - 1] < highs[j - 2];
        if (rsiDiverging && brokeDescendingHighs) {
          const lowestLowIndex = getLowestLowIndex(lows.slice(0, j));
          const hasAscendingTrend = hasAscendingTrendFromLowestLow(lows, lowestLowIndex);
          if (hasAscendingTrend) {
            return true;
          }
        }
      }
      break;
    }
  }
  return false;
}

// === Bearish Reversal ===
function detectBearishReversal(
  closes: number[],
  highs: number[],
  lows: number[],
  ema70: number[],
  ema14: number[],
  rsi: number[]
): boolean {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const curr14 = ema14[i];
    const prev70 = ema70[i - 1];
    const curr70 = ema70[i];

    if (prev14 < prev70 && curr14 > curr70) {
      for (let j = i + 1; j < closes.length; j++) {
        const rsiDiverging = rsi[j] > rsi[i];
        const brokeAscendingLows = lows[j] < lows[j - 1] && lows[j - 1] > lows[j - 2];
        if (rsiDiverging && brokeAscendingLows) {
          const highestHighIndex = getHighestHighIndex(highs.slice(0, j));
          const hasDescendingTrend = hasDescendingTrendFromHighestHigh(highs, highestHighIndex);
          if (hasDescendingTrend) {
            return true;
          }
        }
      }
      break;
    }
  }
  return false;
  }


// logic in getServerSideProps:
export async function getServerSideProps() {
  async function fetchTopPairs(limit = 30): Promise<string[]> {
    const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const data = await response.json();

    const sorted = data.data
      .sort((a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
      .slice(0, limit);

    return sorted.map((ticker: any) => ticker.instId);
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

      const today8AM_UTC = getUTCMillis(year, month, date, 8, 0);
      const tomorrow745AM_UTC = getUTCMillis(year, month, date + 1, 7, 45);

      let sessionStart: number, sessionEnd: number;
      if (now.getTime() >= today8AM_UTC) {
        sessionStart = today8AM_UTC;
        sessionEnd = tomorrow745AM_UTC;
      } else {
        const yesterday8AM_UTC = getUTCMillis(year, month, date - 1, 8, 0);
        const today745AM_UTC = getUTCMillis(year, month, date, 7, 45);
        sessionStart = yesterday8AM_UTC;
        sessionEnd = today745AM_UTC;
      }

      const prevSessionStart = getUTCMillis(year, month, date - 1, 8, 0);
      const prevSessionEnd = getUTCMillis(year, month, date, 7, 45);

      const candlesToday = candles.filter(c => c.timestamp >= sessionStart && c.timestamp <= sessionEnd);
      const candlesPrev = candles.filter(c => c.timestamp >= prevSessionStart && c.timestamp <= prevSessionEnd);

      const todaysLowestLow = candlesToday.length > 0 ? Math.min(...candlesToday.map(c => c.low)) : null;
      const todaysHighestHigh = candlesToday.length > 0 ? Math.max(...candlesToday.map(c => c.high)) : null;
      const prevSessionLow = candlesPrev.length > 0 ? Math.min(...candlesPrev.map(c => c.low)) : null;
      const prevSessionHigh = candlesPrev.length > 0 ? Math.max(...candlesPrev.map(c => c.high)) : null;

      const intradayLowerLowBreak = todaysLowestLow !== null && prevSessionLow !== null && todaysLowestLow < prevSessionLow;
      const intradayHigherHighBreak = todaysHighestHigh !== null && prevSessionHigh !== null && todaysHighestHigh > prevSessionHigh;

      const bullishBreakout = intradayHigherHighBreak;
      const bearishBreakout = intradayLowerLowBreak;
      const breakout = bullishBreakout || bearishBreakout;

      const prevHighIdx = highs.lastIndexOf(prevSessionHigh!);
      const prevLowIdx = lows.lastIndexOf(prevSessionLow!);

      let bearishContinuation = false;
let bullishContinuation = false;
let bullishReversal = false;
let bearishReversal = false;

if (trend === 'bearish') {
  bearishContinuation = detectBearishContinuation(closes, highs, ema70, rsi14, ema14);
  bullishReversal = detectBullishReversal(closes, highs, lows, ema70, ema14, rsi14);
} else if (trend === 'bullish') {
  bullishContinuation = detectBullishContinuation(closes, lows, ema70, rsi14, ema14);
  bearishReversal = detectBearishReversal(closes, highs, lows, ema70, ema14, rsi14);
  }

      const currentRSI = rsi14.at(-1);
      const prevHighRSI = rsi14[prevHighIdx] ?? null;
      const prevLowRSI = rsi14[prevLowIdx] ?? null;

      let divergenceType: 'bullish' | 'bearish' | null = null;
      if (lows.at(-1)! < prevSessionLow! && prevLowIdx !== -1 && rsi14.at(-1)! > rsi14[prevLowIdx]) {
        divergenceType = 'bullish';
      } else if (highs.at(-1)! > prevSessionHigh! && prevHighIdx !== -1 && rsi14.at(-1)! < rsi14[prevHighIdx]) {
        divergenceType = 'bearish';
      }
      const divergence = divergenceType !== null;

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
      const inferredLevelWithinRange = inferredLevel <= todaysHighestHigh! && inferredLevel >= todaysLowestLow!;

      let divergenceFromLevel = false;
let divergenceFromLevelType: 'bullish' | 'bearish' | null = null;

if (type && level !== null) {
  const levelIdx = closes.findIndex(c => Math.abs(c - level) / c < 0.002);
  if (levelIdx !== -1) {
    const currentRSI = rsi14.at(-1)!;
    const pastRSI = rsi14[levelIdx];

    if (type === 'resistance' && lastClose > level && currentRSI < pastRSI) {
      divergenceFromLevel = true;
      divergenceFromLevelType = 'bearish';
    } else if (type === 'support' && lastClose < level && currentRSI > pastRSI) {
      divergenceFromLevel = true;
      divergenceFromLevelType = 'bullish';
    }
  }
}

      const touchedEMA70Today =
        prevSessionHigh! >= lastEMA70 && prevSessionLow! <= lastEMA70 &&
        candles.some(c => Math.abs(c.close - lastEMA70) / c.close < 0.002);

      signals[symbol] = {
  trend,
  breakout,
  bullishBreakout,
  bearishBreakout,
  divergence,
  divergenceType,
  divergenceFromLevel,
  divergenceFromLevelType,  // ✅ Newly added
  nearOrAtEMA70Divergence,
  ema14Bounce,
  ema70Bounce,
  currentPrice: lastClose,
  level,
  levelType: type,
  inferredLevel,
  inferredLevelType,
  inferredLevelWithinRange,
  touchedEMA70Today,
  bearishContinuation,
  bullishContinuation,
  bullishReversal,          // ✅ Reversal detection
  bearishReversal,          // ✅ Reversal detection
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

  return {
    props: {
      symbols,
      signals,
      defaultSymbol,
    },
  };
        }




// In the component SignalChecker, just render the two new fields like this:
    import { useState, useEffect } from 'react';

export default function SignalChecker({ signals }: { signals: Record<string, SignalData> }) {
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
        const data = await response.json();

        const sortedPairs = data.data
          .sort((a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
          .map((item: any) => item.instId);

        setPairs(sortedPairs);

        const savedPairs = JSON.parse(localStorage.getItem('selectedPairs') || '[]');
        const validSaved = savedPairs.filter((pair: string) => signals?.[pair]?.currentPrice !== undefined);

        if (validSaved.length > 0) {
          setSelectedPairs(validSaved);
        } else {
          const topValidPairs = sortedPairs
            .filter((pair) => signals?.[pair]?.currentPrice !== undefined)
            .slice(0, 5);
          setSelectedPairs(topValidPairs);
        }
      } catch (error) {
        console.error('Error fetching trading pairs:', error);
      }
    };

    fetchPairs();
    const intervalId = setInterval(fetchPairs, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [signals]);

  useEffect(() => {
    if (selectedPairs.length > 0) {
      localStorage.setItem('selectedPairs', JSON.stringify(selectedPairs));
    }
  }, [selectedPairs]);

  useEffect(() => {
    const fav = JSON.parse(localStorage.getItem('favoritePairs') || '[]');
    setFavorites(fav);
  }, []);

  useEffect(() => {
    localStorage.setItem('favoritePairs', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const filteredSignals = selectedPairs.reduce((acc, pair) => {
    if (signals[pair]) {
      acc[pair] = signals[pair];
    }
    return acc;
  }, {} as Record<string, SignalData>);

  const filteredDisplaySignals = Object.entries(filteredSignals).filter(([symbol]) =>
    showOnlyFavorites ? favorites.includes(symbol) : true
  );

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
          onChange={(e) => {
            const value = e.target.value;
            if (!selectedPairs.includes(value)) {
              setSelectedPairs([...selectedPairs, value]);
            }
          }}
        >
          <option value="">-- Select --</option>
          {pairs
            .filter((pair) => signals?.[pair])
            .map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
        </select>
      </div>

      <div className="flex items-center space-x-4">
        <label className="text-white font-medium">
          <input
            type="checkbox"
            checked={showOnlyFavorites}
            onChange={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className="mr-2"
          />
          Show only favorites
        </label>
      </div>

      {filteredDisplaySignals.map(([symbol, data]) => (
        <div
          key={symbol}
          className="bg-black/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10 text-white space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{symbol}</h3>
            <button
              onClick={() => toggleFavorite(symbol)}
              className={`text-xl ${favorites.includes(symbol) ? 'text-yellow-400' : 'text-white'}`}
            >
              {favorites.includes(symbol) ? '★' : '☆'}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-yellow-400">📡 {symbol} Signal Overview</h2>

          <div className="space-y-1">
            <p>
              💰 <span className="font-medium text-white/70">Current Price:</span>{' '}
              <span className="text-blue-400">
                {data.currentPrice !== undefined ? `$${data.currentPrice.toFixed(9)}` : 'N/A'}
              </span>
            </p>
            <p>
              📊 <span className="font-medium text-white/70">{data.levelType?.toUpperCase() ?? 'N/A'} Level:</span>{' '}
              <span className="text-yellow-300">
                {data.level !== undefined ? data.level.toFixed(9) : 'N/A'}
              </span>
            </p>
            <p>
              🧭 <span className="font-medium text-white/70">
                Inferred {data.inferredLevelType === 'support' ? 'Support' : 'Resistance'}:
              </span>{' '}
              <span className="text-purple-300">
                {data.inferredLevel !== undefined ? data.inferredLevel.toFixed(9) : 'N/A'}
              </span>
            </p>
            <p>
              📈 <span className="font-medium text-white/70">Trend:</span>{' '}
              <span className="font-semibold text-cyan-300">{data.trend ?? 'N/A'}</span>
            </p>
          </div>

          {(data.bullishBreakout || data.bearishBreakout) && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-lg font-semibold text-white">📊 Breakout Signals</h3>
              {data.bullishBreakout && (
                <p className="text-green-400">🟢 Bullish Breakout: <span className="font-semibold">Yes</span></p>
              )}
              {data.bearishBreakout && (
                <p className="text-red-400">🔴 Bearish Breakout: <span className="font-semibold">Yes</span></p>
              )}
            </div>
          )}

          {(data.bearishReversal || data.bullishReversal || data.bearishContinuation || data.bullishContinuation) && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-lg font-semibold text-white">📊 Signal Summary</h3>
              {data.bearishReversal && (
                <p className="text-orange-400">🔃 Bearish Reversal: <span className="font-semibold">Detected</span></p>
              )}
              {data.bullishReversal && (
                <p className="text-emerald-400">🔄 Bullish Reversal: <span className="font-semibold">Detected</span></p>
              )}
              {data.bearishContinuation && (
                <p className="text-red-400">🔻 Bearish Continuation: <span className="font-semibold">Confirmed</span></p>
              )}
              {data.bullishContinuation && (
                <p className="text-green-400">🔺 Bullish Continuation: <span className="font-semibold">Confirmed</span></p>
              )}
            </div>
          )}

          {(data.ema14Bounce || data.ema70Bounce || data.touchedEMA70Today) && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-lg font-semibold text-white">🧲 EMA Bounce & Zone Testing</h3>
              {data.ema14Bounce && <p className="text-green-400">🔁 EMA14 Bounce: <span className="font-semibold">Yes</span></p>}
              {data.ema70Bounce && <p className="text-yellow-300">🟡 EMA70 Bounce: <span className="font-semibold">Yes</span></p>}
              {data.touchedEMA70Today && <p className="text-blue-300">🧲 EMA70 Tested Today: <span className="font-semibold">Yes</span></p>}
            </div>
          )}

          {(data.divergenceFromLevel || data.divergence || data.nearOrAtEMA70Divergence) && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-lg font-semibold text-white">📉 RSI Divergence</h3>
              {data.divergenceFromLevel && (
                <p className="text-pink-400">
                  🔍 Divergence vs Level: <span className="font-semibold capitalize">
                    {data.divergenceFromLevelType === "bullish"
                      ? "Overbought"
                      : data.divergenceFromLevelType === "bearish"
                      ? "Oversold"
                      : "Momentum Exhaustion"}
                  </span>
                </p>
              )}
              {data.divergence && (
                <p className="text-orange-400">
                  📉 RSI High/Low Divergence: <span className="font-semibold">Pressure Zone</span>
                </p>
              )}
              {data.nearOrAtEMA70Divergence && (
                <p className="text-violet-400">🟠 EMA70 Zone Divergence: <span className="font-semibold">Technical pullback</span></p>
              )}
            </div>
          )}

          {data.inferredLevelWithinRange && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-lg font-semibold text-white">🧭 Inferred Key Level Range</h3>
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
        </div>
      ))}

      <footer className="text-sm text-center text-gray-500 pt-6 border-t border-neutral-700 mt-10 px-4">
        <p>
          <strong className="text-gray-300">Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
        </p>
      </footer>
    </div>
  );
              }                        
