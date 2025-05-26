import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/Alert";



export default function Home() {
        const [ath, setAth] = useState(null);
        const [atl, setAtl] = useState(null);
        const [ema70, setEma70] = useState('');
        const [loading, setLoading] = useState(true);
        const [weeklyCandles, setWeeklyCandles] = useState([]);
        const [weeklyData, setWeeklyData] = useState([]);

        useEffect(() => {
                const fetchBTCWeeklyCandles = async () => {
                        try {
                                const res = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=200");
                                if (!res.ok) throw new Error("Failed to fetch weekly candles");
                                const data = await res.json();
                                const formatted = data.map((candle) => ({
                                        time: Number(candle[0]),
                                        open: parseFloat(candle[1]),
                                        high: parseFloat(candle[2]),
                                        low: parseFloat(candle[3]),
                                        close: parseFloat(candle[4]),
                                        volume: parseFloat(candle[5]),
                                }));

                                const ema14 = calculateEMA(formatted, 14);
                                const ema70 = calculateEMA(formatted, 70);

                                const candlesWithEma = formatted.map((candle, idx) => ({
                                        ...candle,
                                        ema14: ema14[idx] || 0,
                                        ema70: ema70[idx] || 0,
                                }));

                                setWeeklyCandles(candlesWithEma);
                        } catch (err) {
                                console.error("Error loading candles:", err);
                        }
                };

                fetchBTCWeeklyCandles();
        }, []);

        useEffect(() => {
                if (weeklyCandles.length > 0) {
                        const lastEma = weeklyCandles[weeklyCandles.length - 1].ema70;
                        if (lastEma && lastEma > 0) setEma70(lastEma.toFixed(2));
                }
        }, [weeklyCandles]);

        const calculateEMA = (data, period) => {
                const k = 2 / (period + 1);
                let emaArray = [];
                let ema = data.slice(0, period).reduce((sum, val) => sum + val.close, 0) / period;
                emaArray[period - 1] = ema;

                for (let i = period; i < data.length; i++) {
                        ema = data[i].close * k + ema * (1 - k);
                        emaArray[i] = ema;
                }

                return emaArray;
        };
        
useEffect(() => {
    let isMounted = true;

    async function fetchMarketData() {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin');
            const data = await res.json();

            if (isMounted) {
                // Safely extract ATH and ATL
                setAth(data?.market_data?.ath?.usd ?? null);
                setAtl(data?.market_data?.atl?.usd ?? null);
            }
        } catch (error) {
            console.error('Failed to fetch market data:', error);
        } finally {
            if (isMounted) setLoading(false);
        }
    }

    fetchMarketData();

    // Clean-up function to prevent state updates on unmounted component
    return () => {
        isMounted = false;
    };
}, []);
        
const athNum = !isNaN(parseFloat(ath)) ? parseFloat(ath) : null;
const atlNum = !isNaN(parseFloat(atl)) ? parseFloat(atl) : null;
const emaNum = !isNaN(parseFloat(ema70)) ? parseFloat(ema70) : null;
const isValid = emaNum !== null && emaNum > 0;

const getPreviousATL = (candles) => {
  if (!candles || candles.length < 100) {
    return {
      error: 'Not enough data: need at least 100 weekly candles.',
      valid: false,
    };
  }

  const candlesExcludingLast = candles.slice(0, -1).filter(c => c.low != null && c.ema70 != null);
  if (candlesExcludingLast.length === 0) {
    return {
      error: 'No valid candles found for previous ATL.',
      valid: false,
    };
  }

  const prevAtlCandle = candlesExcludingLast.reduce((min, curr) =>
    curr.low < min.low ? curr : min
  );

  const price = prevAtlCandle.low;
  const ema70 = prevAtlCandle.ema70;
  if (ema70 === 0) {
    return {
      error: 'Invalid EMA70 at previous ATL.',
      valid: false,
    };
  }

  const gapPercent = ((ema70 - price) / ema70) * 100;
  const classification = gapPercent > 100 ? 'Bearish Continuation' : 'Possible Reversal';

  const rejectionNearEMA = candlesExcludingLast.some(candle => {
    if (!candle.ema70) return false;
    const diff = Math.abs(candle.low - candle.ema70);
    return diff / candle.ema70 <= 0.03;
  });

  const bearishSignal = gapPercent > 100 && rejectionNearEMA;

  return {
    price,
    ema70,
    gapPercent: gapPercent.toFixed(2),
    classification,
    rejectionNearEMA,
    bearishSignal,
    time: new Date(prevAtlCandle.time).toLocaleDateString(),
    valid: true,
  };
};
        
        
        const findRecentATL = (data) => {
  if (!data || data.length < 100) {
    return {
      error: 'Not enough data: need at least 100 weekly candles.',
      valid: false,
    };
  }

  const last100 = data.slice(-100);
  const latestCandle = data[data.length - 1];

  if (latestCandle.ema14 >= latestCandle.ema70) {
    return {
      error: 'Market is not in a bearish condition (ema14 >= ema70).',
      valid: false,
    };
  }

  let atlCandle = last100[0];
  last100.forEach(candle => {
    if (candle.low < atlCandle.low) {
      atlCandle = candle;
    }
  });

  const atlPrice = atlCandle.low;
  const atlEMA70 = atlCandle.ema70;
  const gapPercent = ((atlEMA70 - atlPrice) / atlEMA70) * 100;
  const classification = gapPercent > 100 ? 'Bearish Continuation' : 'Possible Reversal';

  const rejectionNearEMA = last100.some(candle => {
    if (!candle.ema70) return false;
    const diff = Math.abs(candle.low - candle.ema70);
    return diff / candle.ema70 <= 0.03;
  });

  const bearishSignal = gapPercent > 100 && rejectionNearEMA;

  return {
    atl: atlPrice,
    ema70: atlEMA70,
    gapPercent: gapPercent.toFixed(2),
    classification,
    rejectionNearEMA,
    bearishSignal,
    candle: atlCandle,
    time: new Date(atlCandle.time).toLocaleDateString(),
    valid: true,
  };
};
        
     const getPreviousATH = (candles) => {
  if (!candles || candles.length < 100) {
    return {
      error: 'Not enough data: need at least 100 weekly candles.',
      valid: false,
    };
  }

  const candlesExcludingLast = candles.slice(0, -1).filter(c => c.high != null && c.ema70 != null);
  if (candlesExcludingLast.length === 0) {
    return {
      error: 'No valid candles found for previous ATH.',
      valid: false,
    };
  }

  const prevAthCandle = candlesExcludingLast.reduce((max, curr) =>
    curr.high > max.high ? curr : max
  );

  const price = prevAthCandle.high;
  const ema70 = prevAthCandle.ema70;
  if (ema70 === 0) {
    return {
      error: 'Invalid EMA70 at previous ATH.',
      valid: false,
    };
  }

  const gapPercent = ((price - ema70) / ema70) * 100;
  const classification = gapPercent > 100 ? 'Bullish Continuation' : 'Possible Reversal';

  const rejectionNearEMA = candlesExcludingLast.some(candle => {
    if (!candle.ema70) return false;
    const diff = Math.abs(candle.high - candle.ema70);
    return diff / candle.ema70 <= 0.03;
  });

  const bullishSignal = gapPercent > 100 && rejectionNearEMA;

  return {
    price,
    ema70,
    gapPercent: gapPercent.toFixed(2),
    classification,
    rejectionNearEMA,
    bullishSignal,
    time: new Date(prevAthCandle.time).toLocaleDateString(),
    valid: true,
  };
};
          
        
        const findRecentATH = (data) => {
  if (!data || data.length < 100) {
    return {
      error: 'Not enough data: need at least 100 weekly candles.',
      valid: false,
    };
  }

  const last100 = data.slice(-100);
  const latestCandle = data[data.length - 1];

  if (latestCandle.ema14 <= latestCandle.ema70) {
    return {
      error: 'Market is not in a bullish condition (ema14 <= ema70).',
      valid: false,
    };
  }

  let athCandle = last100[0];
  last100.forEach(candle => {
    if (candle.high > athCandle.high) {
      athCandle = candle;
    }
  });

  const athPrice = athCandle.high;
  const athEMA70 = athCandle.ema70;
  const gapPercent = ((athPrice - athEMA70) / athEMA70) * 100;
  const classification = gapPercent > 100 ? 'Bullish Continuation' : 'Possible Reversal';

  const rejectionNearEMA = last100.some(candle => {
    if (!candle.ema70) return false;
    const diff = Math.abs(candle.high - candle.ema70);
    return diff / candle.ema70 <= 0.03;
  });

  const bullishSignal = gapPercent > 100 && rejectionNearEMA;

  return {
    ath: athPrice,
    ema70: athEMA70,
    gapPercent: gapPercent.toFixed(2),
    classification,
    rejectionNearEMA,
    bullishSignal,
    candle: athCandle,
    time: new Date(athCandle.time).toLocaleDateString(),
    valid: true,
  };
};

        
        const previousATLInfo = getPreviousATL(weeklyCandles);
        const previousATHInfo = getPreviousATH(weeklyCandles);
        const atlInfo = findRecentATL(weeklyCandles);
        const athInfo = findRecentATH(weeklyCandles);
        const currentATH = findRecentATH();
        const currentATHInfo = findRecentATH(weeklyData);
const previousATH = previousATHInfo?.price;
const ema70AtPreviousATH = previousATHInfo?.ema70;
        const currentATL = findRecentATL();
        const currentATLInfo = findRecentATL(weeklyData);
const previousATL = previousATLInfo?.price;
const ema70AtPreviousATL = previousATLInfo?.ema70;

        if (atlInfo) {
                console.log("Recent ATL:", atlInfo.atl);
                console.log("EMA70 from ATL:", atlInfo.ema70);
                console.log("Gap to EMA70 (%):", atlInfo.gapPercent);
        }

        if (athInfo) {
                console.log("Recent ATH:", athInfo.ath);
                console.log("EMA70 from ATH:", athInfo.ema70);
                console.log("Gap to EMA70 (%):", athInfo.gapPercent);
        }

        if (previousATLInfo) {
                console.log("Previous ATL:", previousATLInfo.price, "on", previousATLInfo.time);
        }
        if (previousATHInfo) {
                console.log("Previous ATH:", previousATHInfo.price, "on", previousATHInfo.time);
        }


        const atlWeeklyNum = atlInfo ? atlInfo.atl : null;
        const athWeeklyNum = athInfo ? athInfo.ath : null;

        const isValidAtl = atlWeeklyNum !== null;
        const isValidAth = athWeeklyNum !== null;

        const athGap = isValid && isValidAth ? ((athNum - emaNum) / emaNum) * 100 : 0;
        const atlGap = isValid && isValidAtl ? ((emaNum - atlWeeklyNum) / atlWeeklyNum) * 100 : 0;

        const resolveFinalATHSignal = (weeklyData) => {
  const previous = getATHSignal(candles, { type: "previous" });
  const recent = getATHSignal(candles, { type: "recent" });

  if (!previous.valid || !recent.valid) {
    return {
      error: "Invalid data in one or both ATH signals.",
      valid: false,
      previous,
      recent,
    };
  }

  const breakout = recent.ath > previous.ath;
  const bounce = recent.rejectionNearEMA;

  const strongPrior = previous.classification === "Bullish Continuation";
  const recentSetupValid = recent.classification === "Possible Reversal" && breakout && bounce;

  const finalClassification =
    strongPrior && recentSetupValid ? "Bullish Continuation" : "Possible Reversal";

  return {
    valid: true,
    finalClassification,
    previous,
    recent,
    breakout,
    bounce,
  };
};
        const athSignal = resolveFinalATHSignal(weeklyData);

let bullish = {};
if (athSignal.valid) {
  const ema = parseFloat(athSignal.recent.ema70);
  const ath = parseFloat(athSignal.recent.ath);
  if (!isNaN(ema) && !isNaN(ath)) {
    bullish = {
      entry: ema * 1.02,
      stopLoss: ema * 0.97,
      takeProfit1: ath * 0.98,
      takeProfit2: ath * 1.05,
    };
  }
}
        

const resolveFinalATLSignal = (weeklyData) => {
  const previous = getATLSignal(candles, { type: "previous" });
  const recent = getATLSignal(candles, { type: "recent" });

  if (!previous.valid || !recent.valid) {
    return {
      error: "Invalid data in one or both ATL signals.",
      valid: false,
      previous,
      recent,
    };
  }

  const breakdown = recent.atl < previous.atl;
  const bounce = recent.rejectionNearEMA;

  const strongPrior = previous.classification === "Bearish Continuation";
  const recentSetupValid =
    recent.classification === "Possible Reversal" && breakdown && bounce;

  const finalClassification =
    strongPrior && recentSetupValid ? "Bearish Continuation" : "Possible Reversal";

  return {
    valid: true,
    finalClassification,
    previous,
    recent,
    breakdown,
    bounce,
  };
};
        
        
 
        
        

const getSignalColor = (signal) => {
  if (typeof signal !== 'string') return 'text-gray-600';
  if (signal.includes('Bullish')) return 'text-green-700';
  if (signal.includes('Bearish')) return 'text-red-700';
  if (signal.includes('Neutral')) return 'text-yellow-600';
  return 'text-gray-600';
};

const getBoxColor = (signal) => {
  if (typeof signal !== 'string') return 'bg-gray-100 border-gray-300 text-gray-800';
  if (signal.includes('Bullish')) return 'bg-green-50 border-green-200 text-green-800';
  if (signal.includes('Bearish')) return 'bg-red-50 border-red-200 text-red-800';
  if (signal.includes('Neutral')) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  return 'bg-gray-100 border-gray-300 text-gray-800';
};




const computeBullishLevels = () => {
        const ema = parseFloat(ema70);
        const athNum = parseFloat(ath);
        if (isNaN(ema) || isNaN(athNum)) return {};
        return {
                entry: ema * 1.02,
                stopLoss: ema * 0.97,
                takeProfit1: athNum * 0.98,
                takeProfit2: athNum * 1.05,
        };
};


const computeBearishLevels = () => {
        const ema = parseFloat(ema70);
        const atlNum = parseFloat(atl);
        if (isNaN(ema) || isNaN(atlNum)) return {};
        return {
                entry: ema * 0.98,
                stopLoss: ema * 1.03,
                takeProfit1: atlNum * 1.02,
                takeProfit2: atlNum * 0.95,
        };
};
const computeBullishReversalFromAtl = () => {
        const atlNum = parseFloat(atl);
        const ema = parseFloat(ema70);
        if (isNaN(atlNum) || isNaN(ema)) return {};
        return {
                entry: atlNum * 1.02,       // Entry just above ATL
                stopLoss: atlNum * 0.97,    // SL below ATL
                takeProfit1: atlNum * 1.10, // TP1: 10% above ATL
                takeProfit2: atlNum * 1.20, // TP2: 20% above ATL
        };
};


const computeBearishReversalFromAth = () => {
        const athNum = parseFloat(ath);
        const ema = parseFloat(ema70);
        if (isNaN(athNum) || isNaN(ema)) return {};
        return {
                entry: athNum * 0.98,         // Entry just below ATH
                stopLoss: athNum * 1.03,      // SL above ATH
                takeProfit1: athNum * 0.90,   // TP1 10% below ATH
                takeProfit2: athNum * 0.80,   // TP2 20% below ATH
        };
};

const bullishContinuation = isStrongBullishContinuation();
const bullishReversal = computeBullishReversalFromAtl();
const bearishReversal = computeBearishReversalFromAth();
const bullish = computeBullishLevels();
const bearish = computeBearishLevels();


return (<div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto mt-10">
        <h1 className="text-4xl font-extrabold mb-4 text-yellow-400">
                Bitcoin Signal Analyzer
        </h1>
        <p className="text-lg mb-6 text-gray-300">
                <span className="font-semibold text-white">Smart Bitcoin Trading Starts Here.</span> Instantly analyze Bitcoin's market status using ATH, ATL, and EMA70 trends. This tool gives you actionable trade setups, identifies market zones (Buy or Sell), and provides real-time insights—all in one simple interface.
        </p>
        <div className="border-l-4 border-yellow-400 pl-4 text-sm text-yellow-100 italic">
                Plan smarter. Trade better.
        </div>

        <div className="space-y-6 bg-gray-950 p-6 rounded-xl text-white">
                <div className="bg-gray-900 p-4 rounded-lg border border-blue-600">
                        <h2 className="text-lg font-semibold text-blue-400 mb-2">EMA70 Input</h2>
                        <input
                                type="number"
                                placeholder="EMA70 (Manual Input)"
                                className="bg-gray-800 text-white placeholder-gray-500 border border-blue-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                value={ema70}
                                onChange={e => setEma70(e.target.value)}
                        />
                </div>
        </div>

        {loading && <p className="text-center text-gray-500">Fetching market data...</p>}

        {!loading && isValid && (
                <>
                        {/* ATH Analysis */}
                        {athWeeklyNum === null ? (
                                <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 mt-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-semibold">ATH Signal Unavailable</AlertTitle>
                                        <AlertDescription className="text-sm italic">
                                                Trend is not currently bullish — EMA14 is not above EMA70 in the most recent week.
                                        </AlertDescription>
                                </Alert>
                        ) : (
                                <div className="space-y-2 text-gray-800">
                                        <h2 className="text-xl font-semibold">ATH Heat Check</h2>

                                        {previousATHInfo && (
                                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl shadow-inner border border-gray-700 mt-4">
                                                        <h3 className="text-lg font-bold text-yellow-400 mb-2">Previous ATH Reference</h3>
                                                        <p className="text-sm text-gray-300">Price: ${previousATHInfo.price.toFixed(2)}</p>
                                                        <p className="text-sm text-gray-400">Occurred on: {previousATHInfo.time}</p>
                                                </div>
                                        )}

                                        <p>ATH: ${athNum.toFixed(2)}</p>
                                        <p>Gap: {athGap.toFixed(2)}%</p>                            
                                        
<p>
  Market Zone:{' '}
  <span className={
    athSignal.finalClassification === 'Bullish Continuation'
      ? 'text-green-700 font-bold'
      : 'text-yellow-700 font-bold'
  }>
    {athSignal.finalClassification === 'Bullish Continuation'
      ? '🔥 Still in the Buy Zone'
      : '⚠️ Caution: Sell Zone'}
  </span>
</p>

{athSignal.finalClassification === 'Bullish Continuation' && bullish.entry ? (
  <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
    <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
    <p>Entry: ${bullish.entry.toFixed(2)}</p>
    <p>SL: ${bullish.stopLoss.toFixed(2)}</p>
    <p>TP: ${bullish.takeProfit1.toFixed(2)} to ${bullish.takeProfit2.toFixed(2)}</p>
  </div>
) : null}
         
                                        {isStrongBullishContinuation() === 'Strong Bullish Continuation' && (
                                                <div className={`text-sm p-3 rounded-lg border space-y-1 ${getBoxColor('Strong Bullish Continuation')}`}>
                                                        <p className="font-semibold">Trade Setup (Strong Bullish Continuation):</p>
                                                        <p>Entry: ${strongBullish.entry.toFixed(2)}</p>
                                                        <p>SL: ${strongBullish.stopLoss.toFixed(2)}</p>
                                                        <p>TP: ${strongBullish.takeProfit1.toFixed(2)} to ${strongBullish.takeProfit2.toFixed(2)}</p>
                                                </div>
                                        )}

                                        {getAthSignal() === 'Bullish Continuation' && (
                                                <div className={`text-sm p-3 rounded-lg border space-y-1 ${getBoxColor(getAthSignal())}`}>
                                                        <p className="font-semibold">Trade Setup (Bullish Continuation):</p>
                                                        <p>Entry: ${bullish.entry.toFixed(2)}</p>
                                                        <p>SL: ${bullish.stopLoss.toFixed(2)}</p>
                                                        <p>TP: ${bullish.takeProfit1.toFixed(2)} to ${bullish.takeProfit2.toFixed(2)}</p>
                                                </div>
                                        )}

                                        {getAthSignal() === 'Sell Zone (Possible Reversal)' && (
                                                <div className={`text-sm p-3 rounded-lg border space-y-1 ${getBoxColor(getAthSignal())}`}>
                                                        <p className="font-semibold">Trade Setup (Bearish Reversal):</p>
                                                        <p>Entry: ${bearishReversal.entry.toFixed(2)}</p>
                                                        <p>SL: ${bearishReversal.stopLoss.toFixed(2)}</p>
                                                        <p>TP: ${bearishReversal.takeProfit2.toFixed(2)} to ${bearishReversal.takeProfit1.toFixed(2)}</p>
                                                </div>
                                        )}

                                        {getAthSignal() === 'Neutral Zone' && (
                                                <div className={`text-sm p-4 rounded-lg border shadow-sm space-y-1 ${getBoxColor('Neutral Zone')}`}>
                                                        <p className="font-semibold">Neutral Zone</p>
                                                        <p>Wait for a bounce from EMA70 before entering a trade.</p>
                                                </div>
                                        )}
                                </div>
                        )}

                        {/* ATL Analysis */}
                        {atlWeeklyNum === null ? (
                                <Alert variant="default" className="bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300 mt-4">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-semibold">ATL Signal Unavailable</AlertTitle>
                                        <AlertDescription className="text-sm italic">
                                                Trend is not currently bearish — EMA14 is not below EMA70 in the most recent week.
                                        </AlertDescription>
                                </Alert>
                        ) : (
                                <div className="space-y-2 text-gray-800">
                                        <h2 className="text-xl font-semibold">ATL Heat Check</h2>

                                        {previousATLInfo && (
                                                <div className="text-sm bg-gray-800 p-3 rounded-lg border border-gray-700 text-gray-300 space-y-1">
                                                        <p className="font-semibold text-gray-100">Previous ATL (Historical):</p>
                                                        <p>Price: ${previousATLInfo.price.toFixed(2)}</p>
                                                        <p>Date: {previousATLInfo.time}</p>
                                                </div>
                                        )}
                                        <p>ATL: ${atlNum.toFixed(2)}</p>
                                        <p>Gap: {atlGap.toFixed(2)}%</p>
                                        <p>
  Market Zone (ATL):{' '}
  <span className={`font-bold ${getSignalColor(isStrongBearishContinuation)}`}>
    {isStrongBearishContinuation}
  </span>
</p>
{bearishConfirmed === 'Strong Bearish Breakdown' && (
  <div className={`text-sm p-3 rounded-lg border space-y-1 ${getBoxColor('Strong Bearish Breakdown')}`}>
    <p className="font-semibold">Trade Setup (Strong Bearish Breakdown):</p>
    <p>Entry: ${bullish.entry.toFixed(2)}</p>
    <p>SL: ${bullish.stopLoss.toFixed(2)}</p>
    <p>TP: ${bullish.takeProfit1.toFixed(2)} to ${bullish.takeProfit2.toFixed(2)}</p>
  </div>
)}



                                        {getAtlSignal() === 'Strong Bullish Continuation' && (
                                                <div className={`text-sm p-3 rounded-lg border space-y-1 ${getBoxColor('Strong Bearish Breakdown')}`}>
                                                        <p className="font-semibold">Trade Setup (Strong Bearish Continuation):</p>
                                                        <p>Entry: ${strongBearish.entry.toFixed(2)}</p>
                                                        <p>SL: ${strongBearish.stopLoss.toFixed(2)}</p>
                                                        <p>TP: ${strongBearish.takeProfit1.toFixed(2)} to ${strongBearish.takeProfit2.toFixed(2)}</p>
                                                </div>
                                        )}

                                        {getAtlSignal() === 'Bearish Breakdown' && (
                                                <div className={`text-sm p-3 rounded-lg border space-y-1 ${getBoxColor(getAtlSignal())}`}>
                                                        <p className="font-semibold">Trade Setup (Bearish Breakdown):</p>
                                                        <p>Entry: ${bearish.entry.toFixed(2)}</p>
                                                        <p>SL: ${bearish.stopLoss.toFixed(2)}</p>
                                                        <p>TP: ${bearish.takeProfit2.toFixed(2)}</p>
                                                </div>
                                        )}

                                        {getAtlSignal() === 'Buy Zone (Possible Reversal)' && (
                                                <div className={`text-sm p-3 rounded-lg border space-y-1 ${getBoxColor(getAtlSignal())}`}>
                                                        <p className="font-semibold">Trade Setup (Bullish Reversal):</p>
                                                        <p>Entry: ${bullishReversal.entry.toFixed(2)}</p>
                                                        <p>SL: ${bullishReversal.stopLoss.toFixed(2)}</p>
                                                        <p>TP: ${bullishReversal.takeProfit2.toFixed(2)}</p>
                                                </div>
                                        )}

                                        {getAtlSignal() === 'Neutral Zone' && (
                                                <div className={`text-sm p-4 rounded-lg border shadow-sm space-y-1 ${getBoxColor('Neutral Zone')}`}>
                                                        <p className="font-semibold">Neutral Zone</p>
                                                        <p>Wait for a bounce from EMA70 before entering a trade.</p>
                                                </div>
                                        )}
                                </div>
                        )}
                </>
        )}
</div>

);
                                                                        }
