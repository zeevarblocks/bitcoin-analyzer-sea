
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
      const volumes = candles.map(c => c.volume); // ✅ Valid
      
      
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
      
// Breakout detection
const lowerLowBreak = todaysLowestLow !== null && prevSessionLow !== null && todaysLowestLow < prevSessionLow;
const higherHighBreak = todaysHighestHigh !== null && prevSessionHigh !== null && todaysHighestHigh > prevSessionHigh;

const bullishBreakout = higherHighBreak;
const bearishBreakout = lowerLowBreak;

const breakout = bullishBreakout || bearishBreakout;
      
      const prevHighIdx = highs.lastIndexOf(prevSessionHigh!);
      const prevLowIdx = lows.lastIndexOf(prevSessionLow!);
      const currentHighIdx = lows.lastIndexOf(todaysHighestHigh!);
	const currentLowIdx = lows.lastIndexOf(todaysLowestLow!);
      
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

const { level, type, crossSignal, stallReversal, abcPattern, abcSignal } = findRelevantLevel(ema14, ema70, closes, highs, lows, rsi14, trend);
      const inferredLevel = trend === 'bullish' ? todaysHighestHigh! : todaysLowestLow!;
const inferredLevelType = trend === 'bullish' ? 'resistance' : 'support';
const inferredLevelWithinRange = true;
	    
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

      if (crossSignal === 'buy') {
  // ✅ Queue a long setup
} else if (crossSignal === 'sell') {
  // ✅ Queue a short setup
}

if (stallReversal === 'buy') {
  // ➡️ Potential bullish reversal after bearish trend stalls
}

if (stallReversal === 'sell') {
  // ⬅️ Potential bearish reversal after bullish trend stalls
}

if (abcSignal === 'buy' && abcPattern) {
  // 🅰️🅱️🅲️ Detected Bearish-to-Bullish ABC Reversal Pattern
  // • A = first leg high at index abcPattern.aIdx
  // • B = trend low at index abcPattern.bIdx
  // • C = breakout above A-high after pullback, at index abcPattern.cIdx
  // • D = failure to make new low + RSI rising, at index abcPattern.dIdx
  // ✅ Suggests bearish trend stalled → Possible bullish reversal → Consider long setup
}

if (abcSignal === 'sell' && abcPattern) {
  // 🅰️🅱️🅲️ Detected Bullish-to-Bearish ABC Reversal Pattern
  // • A = first leg low at index abcPattern.aIdx
  // • B = trend high at index abcPattern.bIdx
  // • C = breakout below A-low after pullback, at index abcPattern.cIdx
  // • D = failure to make new high + RSI falling, at index abcPattern.dIdx
  // ⚠️ Suggests bullish trend stalled → Possible bearish reversal → Consider short setup
}  

      const recentCrossings = findRecentCrossings(ema14, ema70, closes);   

/* ---------- 1) PRE-REQS ---------- */
const rsiPrev = rsi14.at(-2)!;
const rsiCurr = rsi14.at(-1)!;

const { macdLine, signalLine } = macd(closes);
const macdPrev = macdLine.at(-2)! - signalLine.at(-2)!;
const macdCurr = macdLine.at(-1)! - signalLine.at(-1)!;

/* ---------- 2) INDIVIDUAL MOMENTUM CUES ---------- */
const macdShift: 'bullish' | 'bearish' | null =
  macdPrev <= 0 && macdCurr > 0
    ? 'bullish'
    : macdPrev >= 0 && macdCurr < 0
    ? 'bearish'
    : null;

const rsiShift: 'bullish' | 'bearish' | null =
  rsiPrev < 50 && rsiCurr > 50
    ? 'bullish'
    : rsiPrev > 50 && rsiCurr < 50
    ? 'bearish'
    : null;

/* ---------- 3) FINAL momentumShift ---------- */
/**
 *  Rule-of-thumb:
 *  - If both indicators agree → use that side.
 *  - If only one fires → use that one.
 *  - If they disagree or neither fires → null.
 */
let momentumSlowing: 'bullish' | 'bearish' | null = null;

if (macdShift && rsiShift && macdShift === rsiShift) {
  momentumSlowing = macdShift;                // confluence ✔
} else if (macdShift && !rsiShift) {
  momentumSlowing = macdShift;                // MACD only
} else if (rsiShift && !macdShift) {
  momentumSlowing = rsiShift;                 // RSI-50 only
}

/* ---------- 4) TRADE FILTER ---------- */
const shouldTrade =
  divergence &&                          // you already have this bool
  momentumSlowing !== null &&
  momentumSlowing === divergenceType;      // confluence with divergence

/* ---------- 5) EXPORT / RETURN ---------- */
	    

	const touchedEMA70Today =
  todaysHighestHigh !== null &&
  todaysLowestLow !== null &&
  todaysHighestHigh >= lastEMA70 &&
  todaysLowestLow <= lastEMA70 &&
  candlesToday.some(c => Math.abs(c.close - lastEMA70) / c.close < 0.002);

	    const supportLows: number[] = [];
const resistanceHighs: number[] = [];

let bullishStartIndex = -1;
let bearishStartIndex = -1;
let lowestSwingLow = Infinity;
let highestSwingHigh = -Infinity;

// Step 1: Identify swing lows/highs near EMA70
for (let i = 2; i < lows.length - 2; i++) {
  const isSwingLow = lows[i] < lows[i - 1] && lows[i] < lows[i + 1];
  const isSwingHigh = highs[i] > highs[i - 1] && highs[i] > highs[i + 1];
  const isNearEMA = Math.abs(closes[i] - ema70[i]) / ema70[i] < 0.005;

  if (isSwingLow && isNearEMA) {
    supportLows.push(lows[i]);
    if (lows[i] < lowestSwingLow) {
      lowestSwingLow = lows[i];
      bullishStartIndex = i;
    }
  }

  if (isSwingHigh && isNearEMA) {
    resistanceHighs.push(highs[i]);
    if (highs[i] > highestSwingHigh) {
      highestSwingHigh = highs[i];
      bearishStartIndex = i;
    }
  }
}

// === Bullish Signals ===
const ema70AscendingFromSwingLow = bullishStartIndex !== -1 && bullishStartIndex < ema70.length - 1 &&
  ema70.slice(bullishStartIndex).every((val, i, arr) => i === 0 || val >= arr[i - 1]);

const rsi14AscendingFromSwingLow = bullishStartIndex !== -1 && bullishStartIndex < rsi14.length - 1 &&
  rsi14.slice(bullishStartIndex).every((val, i, arr) => i === 0 || val >= arr[i - 1]);

const rsi14BreakoutAboveSwingLow = bullishStartIndex !== -1 &&
  rsi14[rsi14.length - 1] > rsi14[bullishStartIndex];

const isSupportLowsAscending = supportLows.length >= 2 &&
  supportLows.every((val, i, arr) => i === 0 || val >= arr[i - 1]);

const ascendingSupportNearEMA70InBullish =
  trend === 'bullish' &&
  ema70AscendingFromSwingLow &&
  isSupportLowsAscending &&
  rsi14AscendingFromSwingLow &&
  rsi14BreakoutAboveSwingLow;

// === Bearish Signals ===
const ema70DescendingFromSwingHigh = bearishStartIndex !== -1 && bearishStartIndex < ema70.length - 1 &&
  ema70.slice(bearishStartIndex).every((val, i, arr) => i === 0 || val <= arr[i - 1]);

const rsi14DescendingFromSwingHigh = bearishStartIndex !== -1 && bearishStartIndex < rsi14.length - 1 &&
  rsi14.slice(bearishStartIndex).every((val, i, arr) => i === 0 || val <= arr[i - 1]);

const rsi14BreakdownBelowSwingHigh = bearishStartIndex !== -1 &&
  rsi14[rsi14.length - 1] < rsi14[bearishStartIndex];

const isResistanceHighsDescending = resistanceHighs.length >= 2 &&
  resistanceHighs.every((val, i, arr) => i === 0 || val <= arr[i - 1]);

const descendingResistanceNearEMA70InBearish =
  trend === 'bearish' &&
  ema70DescendingFromSwingHigh &&
  isResistanceHighsDescending &&
  rsi14DescendingFromSwingHigh &&
  rsi14BreakdownBelowSwingHigh;



    signals[symbol] = {
  // === Trend & Breakout ===
  trend,                      // 'bullish' | 'bearish' | 'neutral'

	 // Bullish
  ascendingSupportNearEMA70InBullish,
  ema70AscendingFromSwingLow,
  rsi14AscendingFromSwingLow,
  rsi14BreakoutAboveSwingLow,

  // Bearish
  descendingResistanceNearEMA70InBearish,
  ema70DescendingFromSwingHigh,
  rsi14DescendingFromSwingHigh,
  rsi14BreakdownBelowSwingHigh,

	    
	    
  breakout,
  bullishBreakout,
  bearishBreakout,

  // === Divergence Detection ===
  divergence,
  divergenceType,             // 'bullish' | 'bearish' | null
  divergenceFromLevel,
      crossSignal,
      stallReversal,
      abcPattern,
        abcSignal,
  divergenceFromLevelType,    // 'bullish' | 'bearish' | null
  nearOrAtEMA70Divergence,

  // === EMA Bounce Detection ===
  ema14Bounce,
  ema70Bounce,
  touchedEMA70Today,

  // === Core Price Metrics ===
  currentPrice: lastClose,
  todaysLowestLow,
  todaysHighestHigh,
  higherHighBreak,
  lowerLowBreak,

  // === Support / Resistance Zone Levels ===
  level,                      // confirmed EMA-cross level
  levelType: type,            // 'support' | 'resistance' | null
  inferredLevel,              // high/low pivot near current
  inferredLevelType,          // 'support' | 'resistance'
  inferredLevelWithinRange,
  differenceVsEMA70,          // { percent: number, direction: 'above' | 'below' | 'equal' }

  // === Trend Continuation Logic ===
  bullishContinuation,
  bearishContinuation,
  cleanTrendContinuation:
    (trend === 'bullish' && bullishContinuation && !bearishContinuation) ||
    (trend === 'bearish' && bearishContinuation && !bullishContinuation),
  continuationEnded,
  continuationReason,

  // === Historical Signals (Optional) ===
  recentCrossings,            // Array<{ type: 'bullish' | 'bearish', price: number, index: n

      momentumSlowing,
        shouldTrade:
    divergence &&
    momentumSlowing !== null &&
    momentumSlowing === divergenceType,  


      
  // === Metadata / External Link ===
  url: `https://okx.com/join/96631749`,
};  
   

    } catch (err) {
      console.error(`Error fetching ${symbol}:`, err);
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
