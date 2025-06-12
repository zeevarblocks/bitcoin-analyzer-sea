import React from 'react';

interface SignalData {
  // === Trend & Breakout ===
  trend: 'bullish' | 'bearish' | 'neutral';
  
  // === Bullish Conditions ===
  ascendingSupportNearEMA70InBullish: boolean;
  ema70AscendingFromSwingLow: boolean;
  rsi14AscendingFromSwingLow: boolean;
  rsi14BreakoutAboveSwingLow: boolean;

  // === Bearish Conditions ===
  descendingResistanceNearEMA70InBearish: boolean;
  ema70DescendingFromSwingHigh: boolean;
  rsi14DescendingFromSwingHigh: boolean;
  rsi14BreakdownBelowSwingHigh: boolean;
  
  breakout: boolean;
  bullishBreakout: boolean;
  bearishBreakout: boolean;

  // === Divergence Signals ===
  divergence: boolean; // any divergence present
  divergenceType: 'bullish' | 'bearish' | null; // primary divergence
  divergenceFromLevel: boolean; // divergence specifically from a key level
  crossSignal: 'buy' | 'sell' | null;
  stallReversal: 'buy' | 'sell' | null;
  abcPattern: { aIdx: number; bIdx: number; cIdx: number; dIdx?: number } | null; // NEW: index map
  abcSignal: 'buy' | 'sell' | null;
  divergenceFromLevelType: 'bullish' | 'bearish' | null; // type from level
  nearOrAtEMA70Divergence: boolean; // divergence detected near or on EMA70

  // === Bounce Events ===
  ema14Bounce: boolean;
  ema70Bounce: boolean;

  // === Continuation Logic ===
  bullishContinuation: boolean;       // true if bullish trend is continuing
  bearishContinuation: boolean;       // true if bearish trend is continuing
  cleanTrendContinuation: boolean;    // trend is continuing without conflict
  continuationEnded: boolean;         // trend continuation has stopped
  continuationReason?: string;        // reason for exhaustion or end

  // === Support/Resistance Zones ===
  level: number | null;                     // confirmed key level
  levelType: 'support' | 'resistance' | null;

  inferredLevel: number;                    // nearest detected level based on logic
  inferredLevelType: 'support' | 'resistance';
  inferredLevelWithinRange: boolean;        // inferred level close to current price

  differenceVsEMA70?: {
    percent: number;
    direction: 'above' | 'below' | 'equal';
  };

  // === Price + Intraday Movement ===
  currentPrice: number;
  touchedEMA70Today: boolean;         // price interacted with EMA70 today
  higherHighBreak: boolean;   // broke today's high
  lowerLowBreak: boolean;     // broke today's low
  todaysLowestLow: number;
  todaysHighestHigh: number;

  // === Trend History ===
  recentCrossings?: {
    type: 'bullish' | 'bearish';
    price: number;
    index: number;
  }[];

   momentumSlowing: 'bullish' | 'bearish' | null;
     shouldTrade: boolean;

 
	
  // === Metadata ===
  url: string; // chart or signal reference URL
}

// fetchCandles, calculateEMA, etc.,.
// Somewhere in your types.ts or in the component file
interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;

  // === Calculated Indicators (optional) ===
  ema14?: number;
  ema70?: number;
  rsi?: number;
  macd?: number;
  signal?: number;

  // === Time Information ===
  time: number;       // readable timestamp (e.g. Unix in ms or UTC)
  timestamp: number;  // same as `time` or used as a sortable numeric ID
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

// reuse this everywhere so results stay consistent
function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((price, i) => {
    if (i === 0) {
      out.push(price);                // seed with first value
    } else {
      out.push(price * k + out[i - 1] * (1 - k));
    }
  });
  return out;
}

function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const macdLine   = fast.map((v, i) => v - slow[i]);
  const signalLine = ema(macdLine, 9);
  const hist       = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, hist };
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

/**
 * Find the last relevant level and, if that level came from an EMA-14/EMA-70
 * cross, decide whether the current RSI is giving a buy/sell cue.
 *
 * NEW FIELDS
 * ──────────
 * crossIdx          – index of the bar where the cross occurred (or null)
 * rsiAtCross        – RSI value on that bar (or null)
 * crossSignal       – 'buy' | 'sell' | null
 */
// Updated findRelevantLevel with ABC‑pattern (A‑B‑C reversal) detection
// --------------------------------------------------------------------



/**
 * Detects meaningful price/RSI interactions around EMA14/EMA70 and now also the
 * three‑leg A‑B‑C structure where C breaks A while B is the swing extreme.
 */
function findRelevantLevel(
  ema14: number[],
  ema70: number[],
  closes: number[],
  highs: number[],
  lows: number[],
  rsi14: number[],
  trend: 'bullish' | 'bearish'
): {
  level: number | null;
  type: 'support' | 'resistance' | null;
  crossIdx: number | null;
  rsiAtCross: number | null;
  crossSignal: 'buy' | 'sell' | null;         // unchanged
  stallReversal: 'buy' | 'sell' | null;       // NEW
  abcPattern: { aIdx: number; bIdx: number; cIdx: number } | null; // NEW: index map
  abcSignal: 'buy' | 'sell' | null;
} {
  const currentRSI = rsi14.at(-1)!;

  /*───────────────────────────────────────────────
   * 1) EMA‑cross scan (no early return → we want
   *    crossIdx later for stall & ABC detection)
   *────────────────────────────────────────────── */
let crossIdx: number | null = null;
let rsiAtCross: number | null = null;
let crossSignal: 'buy' | 'sell' | null = null;

for (let i = ema14.length - 2; i >= 1; i--) {
  const prev14 = ema14[i - 1];
  const prev70 = ema70[i - 1];
  const curr14 = ema14[i];
  const curr70 = ema70[i];

  if (trend === 'bullish' && prev14 < prev70 && curr14 > curr70) {
    crossIdx = i;
    rsiAtCross = rsi14[i];
    crossSignal = currentRSI < rsiAtCross ? 'buy' : null;
    break;
  }

  if (trend === 'bearish' && prev14 > prev70 && curr14 < curr70) {
    crossIdx = i;
    rsiAtCross = rsi14[i];
    crossSignal = currentRSI > rsiAtCross ? 'sell' : null;
    break;
  }
}

  /*───────────────────────────────────────────────
   * 2) Base level based on cross (or later fallback)
   *────────────────────────────────────────────── */
  let level: number | null = null;
  let type: 'support' | 'resistance' | null = null;

  if (crossIdx !== null) {
    level = closes[crossIdx];
    type = trend === 'bullish' ? 'support' : 'resistance';
  }

  /*───────────────────────────────────────────────
   * 3) Highest‑high / Lowest‑low RSI‑stall logic
   *────────────────────────────────────────────── */
  let stallReversal: 'buy' | 'sell' | null = null;

  if (crossIdx !== null) {
    const highsSinceCross = highs.slice(crossIdx, -1); // exclude current bar
    const lowsSinceCross = lows.slice(crossIdx, -1);

    const hiNow = highs.at(-1)!;
    const loNow = lows.at(-1)!;
    const rsiNow = rsi14.at(-1)!;

    if (trend === 'bullish' && highsSinceCross.length) {
      const hh = Math.max(...highsSinceCross);
      const hhIdx = crossIdx + highsSinceCross.lastIndexOf(hh);
      const rsiAtHH = rsi14[hhIdx];

      if (hiNow < hh && rsiNow <= rsiAtHH) {
        stallReversal = 'sell'; // momentum stall below HH
      }
    }

    if (trend === 'bearish' && lowsSinceCross.length) {
      const ll = Math.min(...lowsSinceCross);
      const llIdx = crossIdx + lowsSinceCross.lastIndexOf(ll);
      const rsiAtLL = rsi14[llIdx];

      if (loNow > ll && rsiNow >= rsiAtLL) {
        stallReversal = 'buy'; // momentum stall above LL
      }
    }
  }

  /*───────────────────────────────────────────────
   * 4) NEW – A‑B‑C reversal structure detection
   *────────────────────────────────────────────── */
  
// assume arrays: highs, lows, rsi  (index-aligned to your candles)
let abcPattern:
  | { aIdx: number; bIdx: number; cIdx: number; dIdx?: number }
  | null = null;
let abcSignal: 'buy' | 'sell' | null = null;

if (crossIdx !== null) {
  const aIdx = crossIdx; // ---- Point-A (EMA-cross candle)

  /* ------------------------------------------
   *  NEW — treat a bearish trend like the old
   *  bullish branch (looking for a SELL setup)
   * ------------------------------------------ */
  if (trend === 'bearish') {
    let bIdx = aIdx;                 // Point-B: highest-high
    let cIdx: number | null = null;  // Point-C: break of A-low
    let dIdx: number | null = null;  // Point-D: failed rally + RSI drop

    // Find B (HH) and C (first break of A-low)
    for (let i = aIdx + 1; i < highs.length; i++) {
      if (highs[i] > highs[bIdx]) bIdx = i;          // new HH
      if (lows[i] < lows[aIdx]) { cIdx = i; break; } // break of A-low
    }

    // Look for D (no new HH, RSI weaker)
    if (cIdx !== null) {
      for (let i = cIdx + 1; i < highs.length; i++) {
        const priceFailed = highs[i] <= highs[bIdx];
        const rsiFalling = rsi14[i] < rsi14[bIdx];
        if (priceFailed && rsiFalling) { dIdx = i; break; }
        if (highs[i] > highs[bIdx]) break; // new HH → abort
      }
    }

    if (cIdx !== null && dIdx !== null) {
      abcPattern = { aIdx, bIdx, cIdx, dIdx };
      abcSignal  = 'sell';           // same as before
    }
  }

  /* ------------------------------------------
   *  NEW — treat a bullish trend like the old
   *  bearish branch (looking for a BUY setup)
   * ------------------------------------------ */
  else if (trend === 'bullish') {
    let bIdx = aIdx;                 // Point-B: lowest-low
    let cIdx: number | null = null;  // Point-C: break of A-high
    let dIdx: number | null = null;  // Point-D: failed dump + RSI rise

    // Find B (LL) and C (first break of A-high)
    for (let i = aIdx + 1; i < lows.length; i++) {
      if (lows[i] < lows[bIdx]) bIdx = i;            // new LL
      if (highs[i] > highs[aIdx]) { cIdx = i; break; } // break of A-high
    }

    // Look for D (no new LL, RSI stronger)
    if (cIdx !== null) {
      for (let i = cIdx + 1; i < lows.length; i++) {
        const priceFailed = lows[i] >= lows[bIdx];
        const rsiRising   = rsi14[i] > rsi14[bIdx];
        if (priceFailed && rsiRising) { dIdx = i; break; }
        if (lows[i] < lows[bIdx]) break; // new LL → abort
      }
    }

    if (cIdx !== null && dIdx !== null) {
      abcPattern = { aIdx, bIdx, cIdx, dIdx };
      abcSignal  = 'buy';            // same as before
    }
  }
}
  /*───────────────────────────────────────────────
   * 5) Fallback when no recent EMA cross
   *────────────────────────────────────────────── */
  if (crossIdx === null) {
    level = trend === 'bullish' ? Math.max(...highs) : Math.min(...lows);
    type = trend === 'bullish' ? 'resistance' : 'support';
  }

  /*───────────────────────────────────────────────
   * 6) Consolidated result
   *────────────────────────────────────────────── */
  return {
    level,
    type,
    crossIdx,
    rsiAtCross,
    crossSignal,
    stallReversal,
    abcSignal,
    abcPattern,
  };
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

function findRecentCrossings(
  ema14: number[],
  ema70: number[],
  closes: number[]
): { type: 'bullish' | 'bearish'; price: number; index: number }[] {
  const crossings: { type: 'bullish' | 'bearish'; price: number; index: number }[] = [];

  for (let i = ema14.length - 2; i >= 1 && crossings.length < 3; i--) {
    const prev14 = ema14[i - 1];
    const prev70 = ema70[i - 1];
    const curr14 = ema14[i];
    const curr70 = ema70[i];

    // Bullish crossover
    if (prev14 < prev70 && curr14 >= curr70) {
      crossings.push({
        type: 'bullish',
        price: closes[i],
        index: i,
      });
    }

    // Bearish crossover
    if (prev14 > prev70 && curr14 <= curr70) {
      crossings.push({
        type: 'bearish',
        price: closes[i],
        index: i,
      });
    }
  }

  return crossings.reverse(); // So it's ordered from oldest to newest
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
