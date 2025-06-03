import React from 'react';

interface SignalData {
  trend: 'bullish' | 'bearish' | 'neutral';
  breakout: boolean;
  bullishBreakout: boolean;
  bearishBreakout: boolean;
  divergence: boolean;
  divergenceType?: 'bullish' | 'bearish' | null;
  divergenceFromLevel: boolean;
  divergenceFromLevelType?: 'bullish' | 'bearish' | null;
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
  cleanTrendContinuation: boolean; // ✅ Confirmed continuation with clean trend
  continuationEnded: boolean; // ✅ NEW: true if clean continuation broke
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

// === Bearish Continuation with Solid Structure End Detection === 
function detectBearishContinuationWithEnd( closes: number[], highs: number[], ema70: number[], rsi: number[], ema14: number[], ): { continuation: boolean; ended: boolean; reason?: string } { for (let i = ema14.length - 5; i >= 1; i--) { const prev14 = ema14[i - 1]; const prev70 = ema70[i - 1]; const curr14 = ema14[i]; const curr70 = ema70[i];

const ema70IsDescending = isDescending(ema70, i - 2, 3);
if (prev14 > prev70 && curr14 < curr70 && ema70IsDescending) {
  const rsiAtCross = rsi[i];
  let pointA = { high: highs[i], index: i };
  let pointB: null | { high: number; index: number } = null;
  let pointC: null | { high: number; index: number } = null;

  for (let j = i + 1; j < closes.length; j++) {
    const price = closes[j];
    const nearEMA70 = Math.abs(price - ema70[j]) / price < 0.003;
    const rsiHigher = rsi[j] > rsiAtCross;

    if (highs[j] < pointA.high && nearEMA70 && rsiHigher && ema70[j] < ema70[pointA.index]) {
      if (!pointB) {
        pointB = { high: highs[j], index: j };
      } else if (highs[j] < pointB.high && ema70[j] < ema70[pointB.index]) {
        pointC = { high: highs[j], index: j };
        return { continuation: true, ended: false };
      }
    } else if (highs[j] > pointA.high) {
      return { continuation: false, ended: true, reason: "Point A broken" };
    }
  }
  break;
}

} return { continuation: false, ended: false }; }

// === Bullish Continuation with Solid Structure End Detection === 
  function detectBullishContinuationWithEnd( closes: number[], lows: number[], ema70: number[], rsi: number[], ema14: number[], ): { continuation: boolean; ended: boolean; reason?: string } { for (let i = ema14.length - 5; i >= 1; i--) { const prev14 = ema14[i - 1]; const prev70 = ema70[i - 1]; const curr14 = ema14[i]; const curr70 = ema70[i];

const ema70IsAscending = isAscending(ema70, i - 2, 3);
if (prev14 < prev70 && curr14 > curr70 && ema70IsAscending) {
  const rsiAtCross = rsi[i];
  let pointA = { low: lows[i], index: i };
  let pointB: null | { low: number; index: number } = null;
  let pointC: null | { low: number; index: number } = null;

  for (let j = i + 1; j < closes.length; j++) {
    const price = closes[j];
    const nearEMA70 = Math.abs(price - ema70[j]) / price < 0.003;
    const rsiLower = rsi[j] < rsiAtCross;

    if (lows[j] > pointA.low && nearEMA70 && rsiLower && ema70[j] > ema70[pointA.index]) {
      if (!pointB) {
        pointB = { low: lows[j], index: j };
      } else if (lows[j] > pointB.low && ema70[j] > ema70[pointB.index]) {
        pointC = { low: lows[j], index: j };
        return { continuation: true, ended: false };
      }
    } else if (lows[j] < pointA.low) {
      return { continuation: false, ended: true, reason: "Point A broken" };
    }
  }
  break;
}

} return { continuation: false, ended: false }; }





// logic in getServerSideProps:
export async function getServerSideProps() {
  async function fetchTopPairs(limit = 100): Promise<string[]> {
    const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    const data = await response.json();

    const sorted = data.data
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

if (trend === 'bearish') {
  const { continuation, ended } = detectBearishContinuationWithEnd(
    closes,
    highs,
    ema70,
    rsi14,
    ema14
  );
  bearishContinuation = continuation;
  continuationEnded = ended;
}

if (trend === 'bullish') {
  const { continuation, ended } = detectBullishContinuationWithEnd(
    closes,
    lows,
    ema70,
    rsi14,
    ema14
  );
  bullishContinuation = continuation;
  continuationEnded = ended;
}

const continuationSignal = {
  trend,
  bearishContinuation,
  bullishContinuation,
  continuationDetected:
    (trend === 'bearish' && bearishContinuation) ||
    (trend === 'bullish' && bullishContinuation),
  continuationEnded,
};
      
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
  continuationEnded, // NEW: tells you if trend continuation has ended

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
    import { useState, useEffect, useRef } from 'react';

export default function SignalChecker({ signals }: { signals: Record<string, SignalData> }) {
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
const [isLoadingPairs, setIsLoadingPairs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
const [dropdownVisible, setDropdownVisible] = useState(false);
  const containerRef = useRef(null);
  
const filteredPairs = pairs
  .filter((pair) => signals?.[pair])
  .filter((pair) => pair.toLowerCase().includes(searchTerm.toLowerCase()));

  
  useEffect(() => {
    const fetchPairs = async () => {
  setIsLoadingPairs(true);
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
  } finally {
    setIsLoadingPairs(false);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [containerRef]);
  
return (
  <div className="p-6 space-y-8 bg-gradient-to-b from-gray-900 to-black min-h-screen">
    {isLoadingPairs && (
      <div className="text-white font-medium animate-pulse">
        Loading trading pairs...
      </div>
    )}

    {/* Dropdown for Trading Pairs */}
      {/* Searchable input */}
  <div ref={containerRef} className="relative w-full md:w-auto flex flex-col md:flex-row gap-4">
      <div className="relative w-full md:w-64">
        <input
          type="text"
          placeholder="Search trading pair..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setDropdownVisible(true);
          }}
          onFocus={() => setDropdownVisible(true)}
          className="w-full p-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
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
                onClick={() => {
                  if (!selectedPairs.includes(pair)) {
                    setSelectedPairs([...selectedPairs, pair]);
                  }
                  setSearchTerm('');
                  setDropdownVisible(false);
                }}
                className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer transition-colors"
              >
                {pair}
              </li>
            ))}
          </ul>
        )}
</div>

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

  {/* Unselect All */}
  <button
    onClick={() => setSelectedPairs([])}
    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm rounded transition"
  >
    Unselect All
  </button>
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
             <button
          onClick={() => setSelectedPairs((prev) => prev.filter((p) => p !== symbol))}
          className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
        >
          Unselect
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

{((data.bearishContinuation && data.ema70Bounce && !data.continuationEnded) ||
  (data.bullishContinuation && data.ema70Bounce && !data.continuationEnded)) && (
  <div className="pt-4 border-t border-white/10 space-y-3">
    <h3 className="text-lg font-semibold text-white">📊 Signal Summary</h3>

    {data.bearishContinuation && data.ema70Bounce && !data.continuationEnded && (
      <div className="text-red-400">
        🔻 <span className="font-semibold">Bearish Continuation</span>: Confirmed
        <p className="text-sm text-white/70 ml-4">
          • EMA70 is sloping downward<br />
          • Lower highs near EMA70<br />
          • Bounce off EMA70 occurred
        </p>
      </div>
    )}

    {data.bullishContinuation && data.ema70Bounce && !data.continuationEnded && (
      <div className="text-green-400">
        🔺 <span className="font-semibold">Bullish Continuation</span>: Confirmed
        <p className="text-sm text-white/70 ml-4">
          • EMA70 is sloping upward<br />
          • Higher lows near EMA70<br />
          • Bounce off EMA70 occurred
        </p>
      </div>
    )}
  </div>
)}

{data.continuationEnded && (
  <div className="pt-4 border-t border-white/10 text-yellow-400">
    ⚠️ <span className="font-semibold">Continuation Ended</span>: The clean trend structure was broken.
    <p className="text-sm text-white/70 ml-4">
      • Price action failed to maintain structure<br />
      • Trend continuation conditions no longer valid
    </p>
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

    {/* Footer */}
    <footer className="text-sm text-center text-gray-500 pt-6 border-t border-neutral-700 mt-10 px-4">
      <p>
        <strong className="text-gray-300">Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
      </p>
    </footer>
  </div>
);
}
