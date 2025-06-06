import React from 'react';

interface SignalData {
  // === Trend & Breakout ===
  trend: 'bullish' | 'bearish' | 'neutral';

  breakout: boolean;
  bullishBreakout: boolean;
  bearishBreakout: boolean;

  // === Divergence Signals ===
  divergence: boolean;
  divergenceType: 'bullish' | 'bearish' | null;
  divergenceFromLevel: boolean;
  divergenceFromLevelType: 'bullish' | 'bearish' | null;
  nearOrAtEMA70Divergence: boolean;

  // === Bounce Events ===
  ema14Bounce: boolean;
  ema70Bounce: boolean;

  // === Continuation Logic ===
  bullishContinuation: boolean;  // true if bullish trend is continuing with higher highs
  bearishContinuation: boolean;  // true if bearish trend is continuing with lower lows
  cleanTrendContinuation: boolean; // if trend continuation is confirmed without contradictions
  continuationEnded: boolean;      // true if the trend continuation has stopped (trend exhaustion)
  continuationReason?: string;     // explanation for why continuation ended, e.g. "price failed higher highs"

  // === Support/Resistance Zones ===
  level: number | null;
  levelType: 'support' | 'resistance' | null;
  inferredLevel: number;
  inferredLevelType: 'support' | 'resistance';
  inferredLevelWithinRange: boolean;
     differenceVsEMA70?: {
    percent: number;
    direction: 'above' | 'below' | 'equal';
  };

  // === Price + Intraday Movement ===
  currentPrice: number;
  touchedEMA70Today: boolean;
  intradayHigherHighBreak: boolean;
  intradayLowerLowBreak: boolean;
  todaysLowestLow: number;
  todaysHighestHigh: number;

  // === Trend History ===
  recentCrossings?: {
    type: 'bullish' | 'bearish';
    price: number;
    index: number;
    timestamp: number; 
  }[];

  // === Metadata ===
  url: string;
}

// fetchCandles, calculateEMA, etc.,.
// Somewhere in your types.ts or in the component file
interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema14?: number;
  ema70?: number;
  time: number; // or string depending on your source
  timestamp: number; // ✅ Add this if timestamp exists
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


function calculateDifferenceVsEMA70(
  inferredLevel: number,
  ema70: number
): { percent: number; direction: 'above' | 'below' | 'equal' } {
  const raw = ((inferredLevel - ema70) / ema70) * 100;
  const rounded = parseFloat(raw.toFixed(2));

  let direction: 'above' | 'below' | 'equal' = 'equal';
  if (rounded > 0) direction = 'above';
  else if (rounded < 0) direction = 'below';

  return {
    percent: Math.abs(rounded),
    direction
  };
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

function isDescending(arr: number[], from: number, length: number): boolean {
  for (let i = from; i < from + length - 1; i++) {
    if (arr[i] <= arr[i + 1]) return false;
  }
  return true;
}

function isAscending(arr: number[], from: number, length: number): boolean {
  for (let i = from; i < from + length - 1; i++) {
    if (arr[i] >= arr[i + 1]) return false;
  }
  return true;
}


function hasBearishContinuationEnded(closes: number[], highs: number[], ema70: number[]): boolean {
  const len = closes.length;
  const lastClose = closes[len - 1];

  // EMA70 has flattened or turned upward
  const emaSlope = ema70[len - 1] - ema70[len - 3];
  const isFlatOrUp = emaSlope >= 0;

  // Price making higher highs
  const recentHighs = highs.slice(-3);
  const makingHigherHighs = recentHighs[2] > recentHighs[1] && recentHighs[1] > recentHighs[0];

  // Price closed above EMA70
  const closeAboveEMA70 = lastClose > ema70[len - 1];

  return isFlatOrUp || makingHigherHighs || closeAboveEMA70;
}

function hasBullishContinuationEnded(closes: number[], lows: number[], ema70: number[]): boolean {
  const len = closes.length;
  const lastClose = closes[len - 1];

  // EMA70 has flattened or turned downward
  const emaSlope = ema70[len - 1] - ema70[len - 3];
  const isFlatOrDown = emaSlope <= 0;

  // Price making lower lows
  const recentLows = lows.slice(-3);
  const makingLowerLows = recentLows[2] < recentLows[1] && recentLows[1] < recentLows[0];

  // Price closed below EMA70
  const closeBelowEMA70 = lastClose < ema70[len - 1];

  return isFlatOrDown || makingLowerLows || closeBelowEMA70;
}

// Detect if there's a valid bearish trend first
function isInBearishTrend(closes, ema70, rsi) {
  let countBelow = 0;
  for (let i = closes.length - 5; i < closes.length; i++) {
    if (closes[i] < ema70[i]) countBelow++;
  }

  const emaSlopeDown = ema70[ema70.length - 1] < ema70[ema70.length - 2];
  const avgRsi = rsi.slice(-5).reduce((a, b) => a + b, 0) / 5;

  return countBelow >= 3 && emaSlopeDown && avgRsi < 55;
}

// Fast RSI rejection-based bearish continuation
function detectRSIBasedBearishContinuation(closes, highs, ema70, rsi, ema14) {
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
          return false;
        }
        if (j - i >= 2 && lowerHigh) return true;
      }
      break;
    }
  }
  return false;
}

// ABC structure-based bearish continuation + ending check
function detectBearishContinuationWithEnd(closes, lows, highs, ema70, rsi, ema14) {
  if (!isInBearishTrend(closes, ema70, rsi)) {
    return { continuation: false, ended: false, reason: 'No bearish trend detected' };
  }

  if (detectRSIBasedBearishContinuation(closes, highs, ema70, rsi, ema14)) {
    return { continuation: true, ended: false };
  }

  let pointAIndex = -1;
  let pointBIndex = -1;
  let pointCIndex = -1;
  let highestHigh = -Infinity;
  let foundStructure = false;

  for (let i = ema14.length - 5; i >= 3; i--) {
    const emaSlopeDown = ema70[i] < ema70[i - 1];
    if (!emaSlopeDown) continue;

    const nearEma70 = Math.abs(highs[i] - ema70[i]) / ema70[i] < 0.01;
    if (nearEma70) {
      pointAIndex = i;
      highestHigh = highs[i];

      for (let j = i - 1; j >= 2; j--) {
        const nearEmaB = Math.abs(highs[j] - ema70[j]) / ema70[j] < 0.015;
        if (highs[j] < highs[pointAIndex] && nearEmaB) {
          pointBIndex = j;

          for (let k = j - 1; k >= 1; k--) {
            const nearEmaC = Math.abs(highs[k] - ema70[k]) / ema70[k] < 0.015;
            if (highs[k] < highs[pointBIndex] && nearEmaC) {
              pointCIndex = k;
              foundStructure = true;
              break;
            }
          }
          break;
        }
      }
      break;
    }
  }

  if (foundStructure) {
    const lastHigh = highs[highs.length - 1];
    if (lastHigh > highestHigh) {
      return {
        continuation: false,
        ended: true,
        reason: 'Broke highest high from structure',
      };
    }

    let lowestLow = Infinity;
    let lowestLowIndex = -1;

    for (let i = pointCIndex; i < lows.length; i++) {
      if (lows[i] < lowestLow) {
        lowestLow = lows[i];
        lowestLowIndex = i;
      }
    }

    if (lowestLowIndex !== -1 && closes[lowestLowIndex] >= ema14[lowestLowIndex]) {
      return {
        continuation: false,
        ended: true,
        reason: 'No candle closed below EMA14 at the lowest low of the trend',
      };
    }

    return {
      continuation: true,
      ended: false,
    };
  }

  return {
    continuation: false,
    ended: false,
    reason: 'No valid bearish continuation structure or RSI rejection found',
  };
                        }
                

// Detect if there's a valid bullish trend first
function isInBullishTrend(closes: number[], ema70: number[], rsi: number[]): boolean {
  let countAbove = 0;
  for (let i = closes.length - 5; i < closes.length; i++) {
    if (closes[i] > ema70[i]) countAbove++;
  }

  const emaSlopeUp = ema70[ema70.length - 1] > ema70[ema70.length - 2];
  const avgRsi = rsi.slice(-5).reduce((a, b) => a + b, 0) / 5;

  return countAbove >= 3 && emaSlopeUp && avgRsi > 45;
}

// Fast RSI rejection-based bullish continuation
function detectRSIBasedBullishContinuation(
  closes: number[],
  lows: number[],
  ema70: number[],
  rsi: number[],
  ema14: number[]
): boolean {
  for (let i = ema14.length - 2; i >= 1; i--) {
    const prev14 = ema14[i - 1];
    const prev70 = ema70[i - 1];
    const curr14 = ema14[i];
    const curr70 = ema70[i];

    // EMA14 crosses above EMA70
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
          return false; // pattern broken by lower low
        }

        if (j - i >= 2 && higherLow) return true; // valid bullish continuation
      }
      break;
    }
  }
  return false;
}

// ABC structure-based bullish continuation + ending check
function detectBullishContinuationWithEnd(
  closes: number[],
  lows: number[],
  highs: number[],
  ema70: number[],
  rsi: number[],
  ema14: number[]
): { continuation: boolean; ended: boolean; reason?: string } {
  if (!isInBullishTrend(closes, ema70, rsi)) {
    return { continuation: false, ended: false, reason: 'No bullish trend detected' };
  }

  if (detectRSIBasedBullishContinuation(closes, lows, ema70, rsi, ema14)) {
    return { continuation: true, ended: false };
  }

  let pointAIndex = -1;
  let pointBIndex = -1;
  let pointCIndex = -1;
  let lowestLow = Infinity;
  let foundStructure = false;

  for (let i = ema14.length - 5; i >= 3; i--) {
    const emaSlopeUp = ema70[i] > ema70[i - 1];
    if (!emaSlopeUp) continue;

    const nearEma70 = Math.abs(lows[i] - ema70[i]) / ema70[i] < 0.01;
    if (nearEma70) {
      pointAIndex = i;
      lowestLow = lows[i];

      for (let j = i - 1; j >= 2; j--) {
        const nearEmaB = Math.abs(lows[j] - ema70[j]) / ema70[j] < 0.015;
        if (lows[j] > lows[pointAIndex] && nearEmaB) {
          pointBIndex = j;

          for (let k = j - 1; k >= 1; k--) {
            const nearEmaC = Math.abs(lows[k] - ema70[k]) / ema70[k] < 0.015;
            if (lows[k] > lows[pointBIndex] && nearEmaC) {
              pointCIndex = k;
              foundStructure = true;
              break;
            }
          }
          break;
        }
      }
      break;
    }
  }

  if (foundStructure) {
    const lastLow = lows[lows.length - 1];
    if (lastLow < lowestLow) {
      return {
        continuation: false,
        ended: true,
        reason: 'Broke lowest low from structure',
      };
    }

    let highestHigh = -Infinity;
    let highestHighIndex = -1;

    for (let i = pointCIndex; i < highs.length; i++) {
      if (highs[i] > highestHigh) {
        highestHigh = highs[i];
        highestHighIndex = i;
      }
    }

    if (highestHighIndex !== -1 && closes[highestHighIndex] <= ema14[highestHighIndex]) {
      return {
        continuation: false,
        ended: true,
        reason: 'No candle closed above EMA14 at highest high of trend',
      };
    }

    return { continuation: true, ended: false };
  }

  return { continuation: false, ended: false, reason: 'No valid bullish continuation structure or RSI rejection found' };
                                       }

function findRecentCrossings(
  ema14: number[],
  ema70: number[],
  closes: number[],
  timestamps: number[] // Ensure Unix timestamps in milliseconds
): {
  type: 'bullish' | 'bearish';
  price: number;
  index: number;
  timestamp: number;
}[] {
  const crossings: {
    type: 'bullish' | 'bearish';
    price: number;
    index: number;
    timestamp: number;
  }[] = [];

  // Iterate backwards to find the 3 most recent crossings
  for (let i = ema14.length - 2; i >= 1 && crossings.length < 3; i--) {
    const prevEMA14 = ema14[i - 1];
    const prevEMA70 = ema70[i - 1];
    const currEMA14 = ema14[i];
    const currEMA70 = ema70[i];

    const price = closes[i];
    const timestamp = timestamps[i];

    // Detect bullish crossover
    if (prevEMA14 < prevEMA70 && currEMA14 >= currEMA70) {
      crossings.push({
        type: 'bullish',
        price,
        index: i,
        timestamp: Number(timestamp),
      });
    }

    // Detect bearish crossover
    if (prevEMA14 > prevEMA70 && currEMA14 <= currEMA70) {
      crossings.push({
        type: 'bearish',
        price,
        index: i,
        timestamp: Number(timestamp),
      });
    }
  }

  // Return crossings from oldest to most recent
  return crossings.reverse();
}


// logic in getServerSideProps:
export async function getServerSideProps() {
  async function fetchTopPairs(limit = 100): Promise<string[]> {
    const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const data = await response.json();

    const sorted = data.data
      .filter((ticker: any) => ticker.instId.endsWith('USDT')) // ✅ Only USDT pairs
      .sort((a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
      .slice(0, limit);

    return sorted.map((ticker: any) => ticker.instId);
  }

const symbols = await fetchTopPairs(100);

  const signals: Record<string, SignalData> = {};

  for (const symbol of symbols) {
    try {
      const candles = await fetchCandles(symbol, '15m');
      const closes = candles.map(c => c.close);
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      const timestamps = candles.map(c => new Date(c.time).getTime());
      
      
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
let continuationEnded = false;
let continuationReason = '';

if (trend === 'bearish') {
  const { continuation = false, ended = false, reason = '' } = detectBearishContinuationWithEnd(
    closes,
    lows,
    highs,
    ema70,
    rsi14,
    ema14,
  );

  bearishContinuation = continuation;

  if (ended) {
    continuationEnded = true;
    continuationReason = reason;
  }
}

if (trend === 'bullish') {
  const { continuation = false, ended = false, reason = '' } = detectBullishContinuationWithEnd(
    closes,
    lows,
    highs,
    ema70,
    rsi14,
    ema14,
  );

  bullishContinuation = continuation;

  if (ended) {
    continuationEnded = true;
    continuationReason = reason;
  }
}

// Optional: summary or logging
// console.log({ bearishContinuation, bullishContinuation, continuationEnded, continuationReason });
      
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

// Optional: log or assign the difference from EMA70 for display
const latestEMA70 = Array.isArray(ema70) ? ema70[ema70.length - 1] : ema70;
const differenceVsEMA70 = calculateDifferenceVsEMA70(inferredLevel, latestEMA70);
      
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

      
const recentCrossings = findRecentCrossings(ema14, ema70, closes, timestamps);


      signals[symbol] = {
  trend,
  breakout,
  bullishBreakout,
  bearishBreakout,
  divergence,
  divergenceType,
  divergenceFromLevel,
  divergenceFromLevelType,
  nearOrAtEMA70Divergence,
  ema14Bounce,
  ema70Bounce,
  touchedEMA70Today,

  // Core price data
  currentPrice: lastClose,
  level,
  levelType: type,
  inferredLevel,
  inferredLevelType,
  inferredLevelWithinRange,
  differenceVsEMA70,
  todaysLowestLow,
  todaysHighestHigh,
  intradayHigherHighBreak,
  intradayLowerLowBreak,

  // Trend continuation logic
  bearishContinuation,
  bullishContinuation,
  cleanTrendContinuation:
    (trend === 'bearish' && bearishContinuation) ||
    (trend === 'bullish' && bullishContinuation),
  continuationEnded,
  continuationReason,
  recentCrossings,

  // Metadata
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
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react'; // or your preferred icon

type FilterType =
  | null
  | 'bullishContinuation'
  | 'bearishContinuation'
  | 'ema14Bounce'
  | 'ema70Bounce'
  | 'ema14&70Bounce' // Combined EMA14 & EMA70 bounce filter
  | 'divergence'
  | 'nearOrAtEMA70Divergence'
  | 'divergenceFromLevel'
  | 'recentCrossings'
  | 'bullishBreakout'
  | 'bearishBreakout';

export default function SignalChecker({
  signals,
  defaultSignals,
}: {
  signals: Record<string, SignalData>;
  defaultSignals: SignalData[];
}) {
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isLoadingPairs, setIsLoadingPairs] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const resetToggles = () => {
  setSelectedPairs([]);
  setFavorites([]);
  setActiveFilter(null);
  localStorage.removeItem('selectedPairs');
  localStorage.removeItem('favoritePairs');
};
  

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  
  // Filter pairs by search term
  const filteredPairs = pairs.filter((pair) =>
    pair.toLowerCase().includes(searchTerm.toLowerCase())                                   
  );


useEffect(() => {
  const handleScroll = () => {
    setShowScrollButton(window.scrollY > 200);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  // Fetch pairs with stable callback reference
  const fetchPairs = useCallback(async () => {
    setIsLoadingPairs(true);
    try {
      const response = await fetch(
        'https://www.okx.com/api/v5/market/tickers?instType=SPOT'
      );
      const data = await response.json();
      const sortedPairs = data.data
        .sort(
          (a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h)
        )
        .map((item: any) => item.instId);

      setPairs(sortedPairs);

      const savedPairs = JSON.parse(localStorage.getItem('selectedPairs') || '[]');
      const validSaved = savedPairs.filter(
        (pair: string) => signals?.[pair]?.currentPrice !== undefined
      );

      if (validSaved.length > 0) {
        setSelectedPairs(validSaved);
      } else {
        const topValidPairs = sortedPairs
          .filter((pair) => signals?.[pair]?.currentPrice !== undefined)
          .slice(0, 100);
        setSelectedPairs(topValidPairs);
      }
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
    } finally {
      setIsLoadingPairs(false);
    }
  }, [signals]);

 
  const handleRefresh = async () => {
  setIsRefreshing(true);
  await Promise.all([fetchPairs()]);
  setIsRefreshing(false);
};

  // Fetch pairs on mount and every 5 minutes
  useEffect(() => {
    fetchPairs();
    const intervalId = setInterval(fetchPairs, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchPairs]);

  // Persist selected pairs in localStorage
  useEffect(() => {
    if (selectedPairs.length > 0) {
      localStorage.setItem('selectedPairs', JSON.stringify(selectedPairs));
    }
  }, [selectedPairs]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const fav = JSON.parse(localStorage.getItem('favoritePairs') || '[]');
    setFavorites(fav);
  }, []);

  // Persist favorites in localStorage
  useEffect(() => {
    localStorage.setItem('favoritePairs', JSON.stringify(favorites));
  }, [favorites]);

  // Toggle favorite state for a symbol
  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  // Filter signals for display
  const filteredDisplaySignals = Object.entries(signals || {})
    .filter(([symbol]) => selectedPairs.includes(symbol))
    .filter(([symbol]) => (showOnlyFavorites ? favorites.includes(symbol) : true))
    .filter(([_, data]) => {
      if (activeFilter === 'bullishBreakout') return data.bullishBreakout;
      if (activeFilter === 'bearishBreakout') return data.bearishBreakout;
      if (activeFilter === 'divergence') return data.divergence;
      if (activeFilter === 'nearOrAtEMA70Divergence') return data.nearOrAtEMA70Divergence;
      if (activeFilter === 'divergenceFromLevel') return data.divergenceFromLevel;
      if (activeFilter === 'ema70Bounce') return data.ema70Bounce;
      if (activeFilter === 'ema14Bounce') return data.ema14Bounce;
      if (activeFilter === 'ema14&70Bounce') return  data.ema70Bounce && data.ema14Bounce;
      return true;  
    });
  		

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
return (
  <div className="p-6 space-y-8 bg-gradient-to-b from-gray-900 to-black min-h-screen">
     {isLoadingPairs && (
      <div className="text-white font-medium animate-pulse">
        Loading trading pairs...
      </div>
    )}
    {/* Dropdown for Trading Pairs */}
      {/* Searchable input */}
  <div className="flex gap-2 flex-wrap mt-4">
  {/* Select All */}
  <button
    onClick={() =>
      setSelectedPairs(
        pairs.filter((pair) => signals?.[pair]?.currentPrice !== undefined)
      )
    }
    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-sm rounded transition"
  >
    Select All
  </button>

  {/* Reset Toggles */}
  <button
    onClick={() => resetToggles()}
    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 text-sm rounded transition"
  >
    Reset All Toggles
  </button>
    
</div>
    
  <div
  ref={containerRef}
  className="relative w-full md:w-auto flex flex-col md:flex-row gap-4"
>
  <div className="relative w-full md:w-64">
    <input
      ref={searchInputRef}
      type="text"
      placeholder="Search trading pair..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        setDropdownVisible(true);
      }}
      onFocus={() => setDropdownVisible(true)} // This handles opening on focus
      className="w-full p-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    {/* Clear button */}
    {searchTerm && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSearchTerm('');
        }}
        className="absolute right-2 top-2 text-gray-400 hover:text-white text-sm"
      >
        ✕
      </button>
    )}

    {/* Dropdown */}
    {dropdownVisible && filteredPairs.length > 0 && (
      <ul className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {filteredPairs.map((pair) => (
          <li
            key={pair}
            onClick={(e) => {
              e.stopPropagation();
              if (!selectedPairs.includes(pair)) {
                setSelectedPairs([...selectedPairs, pair]);
              }
              setSearchTerm('');
              setDropdownVisible(false);
              searchInputRef.current?.blur(); // optional: blur after selection
            }}
            className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer transition-colors"
          >
            {pair}
          </li>
        ))}
      </ul>
    )}
  </div>
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
        <div className="flex gap-2 flex-wrap">

<button
  onClick={() => setActiveFilter('bullishBreakout')}
  className="bg-gray-800 hover:bg-emerald-600 text-green-400 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>🚀</span>
  <span>bullishBreakout</span>
</button>

<button
  onClick={() => setActiveFilter('bearishBreakout')}
  className="bg-gray-800 hover:bg-rose-600 text-red-400 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>⚠️</span>
  <span>bearishBreakout</span>
</button>

  <button
    onClick={() => setActiveFilter('divergence')}
    className="bg-gray-800 hover:bg-yellow-600 text-yellow-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
  >
    <span>🧱</span>
    <span>trendPullback</span>
  </button>
          
<button
  onClick={() => setActiveFilter('nearOrAtEMA70Divergence')}
  className="bg-gray-800 hover:bg-indigo-700 text-indigo-400 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📐</span> {/* EMA proximity + divergence */}
  <span>nearOrAtEMA70Divergence</span>
</button>

<button
  onClick={() => setActiveFilter('divergenceFromLevel')}
  className="bg-gray-800 hover:bg-pink-700 text-pink-400 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📉</span> {/* Level-based divergence — potential trap signal */}
  <span>divergenceFromLevel</span>
</button>
          <button
  onClick={() => setActiveFilter('ema70Bounce')}
  className="bg-gray-800 hover:bg-yellow-600 text-violet-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📈</span> {/* EMA14 & EMA70 Bounce — trend continuation signal */}
  <span>ema70Bounce</span>
</button>
          <button
  onClick={() => setActiveFilter('ema14Bounce')}
  className="bg-gray-800 hover:bg-purple-600 text-indigo-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📈</span> {/* EMA14 & EMA70 Bounce — trend continuation signal */}
  <span>ema14Bounce</span>
</button>
          <button
  onClick={() => setActiveFilter('ema14&70Bounce')}
  className="bg-gray-800 hover:bg-orange-600 text-cyan-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📈</span> {/* EMA14 & EMA70 Bounce — trend continuation signal */}
  <span>ema14&70Bounce</span>
</button>
               
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
             <button
          onClick={() => setSelectedPairs((prev) => prev.filter((p) => p !== symbol))}
          className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
        >
          Unselect
        </button>
                       <button
  onClick={() => {
    fetchPairs();
  }}
  disabled={isLoadingPairs}
  className="px-4 py-2 rounded-2xl bg-gray-800 text-gray-100 hover:bg-gray-700 disabled:bg-gray-600 transition-all duration-200 shadow-md disabled:cursor-not-allowed"
>
  {isLoadingPairs ? '🔄 Refreshing...' : '🔄 Refresh'}
</button>
            </div>
           
              <div className="space-y-1">
        <h2 className="text-2xl font-bold text-yellow-400">📡 {symbol} Signal Overview</h2>
  
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
                {data.differenceVsEMA70 !== null && (
  <p>
    📉 <span className="font-medium text-white/70">
      Ema70 & Inferred - Gap %:
    </span>{' '}
    <span className="text-yellow-300">
  {data.differenceVsEMA70.percent.toFixed(2)}% ({data.differenceVsEMA70.direction})
</span>
  </p>
  )}              
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

          <div className="pt-4 border-t border-white/10 space-y-3">
  <h3 className="text-lg font-semibold text-white">📊 Signal Summary</h3>

  {data.continuationEnded ? (
    <div className="text-yellow-400">
      ⚠️ <span className="font-semibold">Continuation Ended</span>: The clean trend structure was broken.
      <p className="text-sm text-white/70 ml-4 mt-1">
        • Price action failed to maintain structure<br />
        • Trend continuation conditions no longer valid
        {data.continuationReason && (
          <>
            <br />• <span className="italic">Reason:</span> {data.continuationReason}
          </>
        )}
      </p>
    </div>
  ) : data.bullishContinuation ? (
    <div className="text-green-400">
      🔺 <span className="font-semibold">Bullish Continuation</span>: Confirmed
      <p className="text-sm text-white/70 ml-4 mt-1">
        • EMA trend is upward<br />
        • Higher lows or RSI structure confirmed<br />
        {data.continuationReason && (
          <>
            <br />• <span className="italic">Why confirmed:</span> {data.continuationReason}
          </>
        )}
      </p>
    </div>
  ) : data.bearishContinuation ? (
    <div className="text-red-400">
      🔻 <span className="font-semibold">Bearish Continuation</span>: Confirmed
      <p className="text-sm text-white/70 ml-4 mt-1">
        • EMA trend is downward<br />
        • Lower highs or RSI confirmation detected<br />
        {data.continuationReason && (
          <>
            <br />• <span className="italic">Why confirmed:</span> {data.continuationReason}
          </>
        )}
      </p>
    </div>
  ) : (
    <div className="text-white/60">
      ℹ️ <span className="font-semibold">No Continuation Signal</span>
      <p className="text-sm ml-4 mt-1">
        • Trend continuation pattern not confirmed<br />
        • Waiting for valid structure or RSI alignment
        {data.continuationReason ? (
          <>
            <br />• <span className="italic">Reason:</span> {data.continuationReason}
          </>
        ) : (
          <>
            <br />• <span className="italic">Reason:</span> No significant trend pattern or indicator alignment detected
          </>
        )}
      </p>
    </div>
  )}
</div>
          
{/* 📉 RSI Divergence Evidence */}
{data.nearOrAtEMA70Divergence && (
  <div className="pt-4 border-t border-white/10 space-y-4">
    <h3 className="text-lg font-semibold text-white">📉 RSI Divergence: Supporting Evidence for Trend Continuation</h3>

    {data.nearOrAtEMA70Divergence && (
      <div className="text-indigo-400 space-y-2">
        🧭 <span className="font-semibold">EMA70 RSI Divergence</span>
        <p className="text-sm text-white/70 ml-4 mt-1">
          • Divergence detected near the 70 EMA<br />
          • Confluence with dynamic support/resistance enhances signal reliability<br />
          • Often marks bounce zones or momentum continuation setups
        </p>
      </div>
    )}
  </div>
)}

{/* 🔍 Momentum Shift (RSI) */}
{(data.divergence || data.divergenceFromLevel) && (
  <div className="pt-4 border-t border-white/10 space-y-4">
    <h3 className="text-lg font-semibold text-white">🔍 Trend Pullback</h3>
    <div className="text-purple-400 space-y-2">
      ⚠️ <span className="font-semibold">Momentum Shift {data.divergenceType === 'bullish' ? 'Bullish' : 'Bearish'} Signal (RSI)</span>
      <p className="text-sm text-white/70 ml-4 mt-1">
        • RSI is moving opposite to price direction<br />
        • Indicates possible {data.divergenceType === 'bullish' ? 'bullish momentum despite lower lows' : 'bearish momentum despite higher highs'}<br />
        • Watch for volume spikes, candlestick confirmation, or trendline breaks
      </p>
    </div>
    
{data.divergenceFromLevel && (
      <div className="text-pink-400 space-y-2">
        🔍 <span className="font-semibold">Divergence vs Key Level</span>
        <p className="text-sm text-white/70 ml-4 mt-1">
          • Type:{" "}
          <span className="capitalize text-white">
            {data.divergenceFromLevelType === "bullish"
              ? "Reversal warning (sell)"
              : data.divergenceFromLevelType === "bearish"
              ? "Reversal warning (buy)"
              : "Confirmed"}
          </span><br />
          • RSI divergence identified at a key {data.levelType || "support/resistance"} zone<br />
          • Suggests a potential trend continuation or a fakeout trap
        </p>
      </div>
    )}
    </div>
)}
          
          

{(data.ema14Bounce || data.ema70Bounce) && (
  <div className="pt-4 border-t border-white/10 space-y-4">  
    <h3 className="text-lg font-semibold text-white">📊 EMA Bounce Signals (Consolidation)</h3>  
    <p className="text-sm text-white/80">  
      Recent candles have bounced above the 14 and/or 70 EMA. This often indicates a consolidation zone where price is stabilizing between short- and medium-term averages.  
    </p>  
    <div className="space-y-1">  
  {data?.ema14Bounce && (  
    <p className="text-green-400 text-lg font-semibold">🔁 EMA14: Yes</p>  
  )}  
  {data?.ema70Bounce && (  
    <p className="text-green-400 text-lg font-semibold">🟡 EMA70: Yes</p>  
  )}  
</div>
    </div>
)}

{/* 🔄 Recent EMA Crossings */}
{/* 🔄 Recent EMA Crossings */}
{data.recentCrossings?.length > 0 && (
  <div className="bg-gray-800 p-4 rounded-xl shadow-inner mt-4">
    <p className="text-base font-semibold text-blue-400 mb-2">
      🔄 Recent EMA Crossings
    </p>
    <ul className="space-y-1">
      {data.recentCrossings.map((cross, idx) => {
        const formattedDate = new Date(cross.timestamp).toLocaleString();
        return (
          <li
            key={idx}
            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg ${
              cross.type === 'bullish'
                ? 'bg-green-900 text-green-300'
                : 'bg-red-900 text-red-300'
            }`}
          >
            <div>
              <span>
                {cross.type === 'bullish' ? '🟢 Bullish Cross' : '🔴 Bearish Cross'}
              </span>
              <div className="text-xs text-gray-300 mt-1">
                {formattedDate}
              </div>
            </div>
            <span className="ml-auto font-mono text-sm">
              @ ${cross.price.toFixed(9)}
            </span>
          </li>
        );
      })}
    </ul>
  </div>
)}
          
          
        {/* Trade Link */}
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

    {showScrollButton && (
  <button
    onClick={scrollToTop}
    className="fixed bottom-5 right-5 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur shadow-lg transition duration-300"
    aria-label="Scroll to top"
  >
    <ArrowUp size={20} />
  </button>
)}

    {/* Footer */}
    <footer className="text-sm text-center text-gray-500 pt-6 border-t border-neutral-700 mt-10 px-4">
      <p>
        <strong className="text-gray-300">Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
      </p>
    </footer>
  </div>
);

        }
