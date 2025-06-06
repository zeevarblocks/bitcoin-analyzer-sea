// signalAnalyzer.ts
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
  time: number; 
  timestamp: number; 
}

async function fetchCandles(symbol: string, interval: string): Promise<Candle[]> {
  const limit = interval === '1d' ? 2 : 500;

  try {
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/ticker/24hr`
    );

    if (!response.ok) {
      throw new Error(`Binance candle fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid candle data format');
    }

    return data.map((d: any[]) => {
      const ts = +d[0];
      return {
        timestamp: ts,
        time: ts,
        open: +d[1],
        high: +d[2],
        low: +d[3],
        close: +d[4],
        volume: +d[5],
      };
    }).reverse();
  } catch (error) {
    console.error(`❌ Error fetching candles for ${symbol} (${interval}):`, error);
    return []; // Return empty so main app doesn’t crash
  }
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


// getServerSideProps.ts
async function fetchTopPerpetualPairs(limit = 100): Promise<string[]> {
  try {
    const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    const sorted = data
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit);

    return sorted.map((t) => t.symbol);
  } catch (err) {
    console.error('❌ Failed to fetch Binance perpetual futures:', err);
    return [];
  }
    }


// getServerSideProps.ts
async function fetchTopPerpetualPairs(limit = 100): Promise<string[]> {
  try {
    const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    const sorted = data
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 100);

    return sorted.map((t) => t.symbol);
  } catch (err) {
    console.error('❌ Failed to fetch Binance perpetual futures:', err);
    return [];
  }
}

export async function getServerSideProps() {
    try {
        const symbols = await fetchTopPairs(100);
        const signals: Record<string, SignalData> = {};

        for (const symbol of symbols) {
            try {
                const candles = await fetchCandles(symbol, '15m');
                if (!candles || candles.length === 0) continue;

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

  const signal: SignalData = {
    trend,
    breakout: false,
    bullishBreakout: false,
    bearishBreakout: false,

    divergence: false,
    divergenceType: null,
    divergenceFromLevel: false,
    divergenceFromLevelType: null,
    nearOrAtEMA70Divergence: false,

    ema14Bounce: false,
    ema70Bounce: false,

    bullishContinuation: false,
    bearishContinuation: false,
    cleanTrendContinuation: false,
    continuationEnded: false,

    level: null,
    levelType: null,
    inferredLevel: 0,
    inferredLevelType: 'resistance',
    inferredLevelWithinRange: false,

    currentPrice: closes[closes.length - 1],
    touchedEMA70Today: false,
    intradayHigherHighBreak: false,
    intradayLowerLowBreak: false,
    todaysLowestLow: Math.min(...lows),
    todaysHighestHigh: Math.max(...highs),

    recentCrossings: [],
    url: `https://www.binance.com/en/futures/${symbol}`,
  

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
                        closes, lows, highs, ema70, rsi14, ema14
                    );

                    bearishContinuation = continuation;
                    if (ended) {
                        continuationEnded = true;
                        continuationReason = reason;
                    }
                }

                if (trend === 'bullish') {
                    const { continuation = false, ended = false, reason = '' } = detectBullishContinuationWithEnd(
                        closes, lows, highs, ema70, rsi14, ema14
                    );

                    bullishContinuation = continuation;
                    if (ended) {
                        continuationEnded = true;
                        continuationReason = reason;
                    }
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
                const inferredLevelWithinRange = inferredLevel <= todaysHighestHigh! && inferredLevel >= todaysLowestLow!;

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

                const recentCrossings = findRecentCrossings(ema14, ema70, closes);

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
                    bearishContinuation,
                    bullishContinuation,
                    cleanTrendContinuation: (trend === 'bearish' && bearishContinuation) || (trend === 'bullish' && bullishContinuation),
                    continuationEnded,
                    continuationReason,
                    recentCrossings,
                    url: `https://okx.com/join/96631749`,
                };
            } catch (err) {
                console.error('❌ Server Error in per-symbol processing:', err);
            }
        }

        const defaultSymbol = symbols.length > 0 ? symbols[0] : null;

        return {
            props: {
                symbols,
                signals,
                defaultSymbol,
            },
        };
    } catch (err) {
        console.error('❌ Server Error in getServerSideProps:', err);
        return {
            props: {
                symbols: [],
                signals: {},
                defaultSymbol: null,
            },
        };
    }
  }

      // SignalChecker.tsx
// In the component SignalChecker, just render the two new fields like this:

// SignalChecker.tsx
import React, { useCallback, useEffect, useState } from 'react';

interface SignalData {
  currentPrice: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  [key: string]: any;
}

interface Props {
  signals: { [symbol: string]: SignalData };
}

const SignalChecker: React.FC<Props> = ({ signals }) => {
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [isLoadingPairs, setIsLoadingPairs] = useState<boolean>(false);

  const fetchPairs = useCallback(async () => {
    setIsLoadingPairs(true);
    try {
      const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
      const data = await response.json();
      const sortedPairs = data
        .filter((item: any) => item.symbol.endsWith('USDT'))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .map((item: any) => item.symbol);

      setPairs(sortedPairs);

      const savedPairs = JSON.parse(localStorage.getItem('selectedPairs') || '[]');
      const fallback = sortedPairs.slice(0, 50);
      const toUse = savedPairs.length > 0 ? savedPairs : fallback;
      setSelectedPairs(toUse);
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
    } finally {
      setIsLoadingPairs(false);
    }
  }, []);

  useEffect(() => {
    fetchPairs(); // Always fetch on mount
  }, []);

  useEffect(() => {
    if (Object.keys(signals).length > 0) {
      setSelectedPairs((prev) =>
        prev.filter((pair) => signals[pair]?.currentPrice !== undefined)
      );
    }
  }, [signals]);

  const filteredDisplaySignals = Object.entries(signals || {}).filter(
    ([symbol]) =>
      selectedPairs.includes(symbol) &&
      signals[symbol]?.currentPrice !== undefined
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Binance Futures Signals</h2>

      {isLoadingPairs && <p>Loading pairs...</p>}

      {!isLoadingPairs && filteredDisplaySignals.length === 0 && (
        <p>No signals to display. Try again shortly.</p>
      )}

      <ul className="grid grid-cols-2 gap-4">
        {filteredDisplaySignals.map(([symbol, signal]) => (
          <li key={symbol} className="p-3 border rounded shadow">
            <strong>{symbol}</strong>
            <div>Price: {signal.currentPrice}</div>
            <div>Trend: {signal.trend}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};
     
