import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/Alert";



export default function Home() {
        const [ath, setAth] = useState(null);
        const [atl, setAtl] = useState(null);
        const [ema70, setEma70] = useState('');
        const [loading, setLoading] = useState(true);
        const [weeklyCandles, setWeeklyCandles] = useState([]);

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
                async function fetchMarketData() {
                        try {
                                const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin');
                                const data = await res.json();
                                setAth(data.market_data.ath.usd);
                                setAtl(data.market_data.atl.usd);
                        } catch (error) {
                                console.error('Failed to fetch market data:', error);
                        } finally {
                                setLoading(false);
                        }
                }
                fetchMarketData();
        }, []);

        const athNum = parseFloat(ath);
        const atlNum = parseFloat(atl);
        const emaNum = parseFloat(ema70);
        const isValid = !isNaN(emaNum) && emaNum > 0;

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
        
        const atlInfo = findRecentATL(weeklyCandles);
        const athInfo = findRecentATH(weeklyCandles);

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

        const atlWeeklyNum = atlInfo ? atlInfo.atl : null;
        const athWeeklyNum = athInfo ? athInfo.ath : null;

        const isValidAtl = atlWeeklyNum !== null;
        const isValidAth = athWeeklyNum !== null;

        const athGap = isValid && isValidAth ? ((athNum - emaNum) / emaNum) * 100 : 0;
        const atlGap = isValid && isValidAtl ? ((emaNum - atlWeeklyNum) / atlWeeklyNum) * 100 : 0;

       const getATHSignal = (candles, { type }) => {
  if (!candles || candles.length < 100) return { valid: false, error: 'Need at least 100 candles.' };

  const scope = type === "recent" ? candles.slice(-100) : candles.slice(0, -1);
  const filtered = scope.filter(c => c.high != null && c.ema70 != null);
  if (filtered.length === 0) return { valid: false, error: 'No valid candles.' };

  let athCandle = filtered[0];
  for (const c of filtered) if (c.high > athCandle.high) athCandle = c;

  const ath = athCandle.high;
  const ema70 = athCandle.ema70;
  if (!ema70) return { valid: false, error: 'Invalid EMA70 at ATH.' };

  const gapPercent = ((ath - ema70) / ema70) * 100;
  const classification = gapPercent > 100 ? 'Bullish Continuation' : 'Possible Reversal';
  const rejectionNearEMA = filtered.some(c => Math.abs(c.low - c.ema70) / c.ema70 <= 0.03);

  return {
    valid: true, ath, ema70,
    gapPercent: gapPercent.toFixed(2),
    classification, rejectionNearEMA,
    candle: athCandle,
    time: new Date(athCandle.time).toLocaleDateString()
  };
}; 


        const getATLSignal = (candles, { type }) => {
  if (!candles || candles.length < 100) return { valid: false, error: 'Need at least 100 candles.' };

  const scope = type === "recent" ? candles.slice(-100) : candles.slice(0, -1);
  const filtered = scope.filter(c => c.low != null && c.ema70 != null);
  if (filtered.length === 0) return { valid: false, error: 'No valid candles.' };

  let atlCandle = filtered[0];
  for (const c of filtered) if (c.low < atlCandle.low) atlCandle = c;

  const atl = atlCandle.low;
  const ema70 = atlCandle.ema70;
  if (!ema70) return { valid: false, error: 'Invalid EMA70 at ATL.' };

  const gapPercent = ((ema70 - atl) / ema70) * 100;
  const classification = gapPercent > 100 ? 'Bearish Continuation' : 'Possible Reversal';
  const rejectionNearEMA = filtered.some(c => Math.abs(c.high - c.ema70) / c.ema70 <= 0.03);

  return {
    valid: true, atl, ema70,
    gapPercent: gapPercent.toFixed(2),
    classification, rejectionNearEMA,
    candle: atlCandle,
    time: new Date(atlCandle.time).toLocaleDateString()
  };
};
        


        
const resolveFinalATHSignal = (candles) => {
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

const resolveFinalATLSignal = (candles) => {
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
                                                <p>ATH: ${athNum.toFixed(2)}</p>
                                                <p>Gap: {athGap.toFixed(2)}%</p>
                                                <p>
                                                        Market Zone:{' '}
                                                        <span className={resolveFinalATHSignal() === 'Bullish Continuation' ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
                                                                {resolveFinalATHSignal() === 'Bullish Continuation' ? '🔥 Still in the Buy Zone' : '⚠️ Caution: Sell Zone'}
                                                        </span>
                                                </p>

                                                {resolveFinalATHSignal() === 'Bullish Continuation' ? (
                                                        <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
                                                                <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
                                                                <p>Entry: ${bullish.entry.toFixed(2)}</p>
                                                                <p>SL: ${bullish.stopLoss.toFixed(2)}</p>
                                                                <p>TP: ${bullish.takeProfit1.toFixed(2)} to ${bullish.takeProfit2.toFixed(2)}</p>
                                                        </div>
                                                ) : (
                                                        <div className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1">
                                                                <p className="font-semibold text-yellow-800">Trade Setup (Sell Zone):</p>
                                                                <p>Entry: ${bearishReversal.entry.toFixed(2)}</p>
                                                                <p>SL: ${bearishReversal.stopLoss.toFixed(2)}</p>
                                                                <p>TP: ${bearishReversal.takeProfit2.toFixed(2)} to ${bearishReversal.takeProfit1.toFixed(2)}</p>
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
                                        <h2 className="text-xl font-semibold">ATH Heat Check</h2>

                                        {previousATHInfo && (
                                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl shadow-inner border border-gray-700 mt-4">
                                                        <h3 className="text-lg font-bold text-yellow-400 mb-2">Previous ATH Reference</h3>
                                                        <p className="text-sm text-gray-300">Price: ${previousATHInfo.price.toFixed(2)}</p>
                                                        <p className="text-sm text-gray-400">Occurred on: {previousATHInfo.time}</p>
                                                <p>ATH: ${atHNum.toFixed(2)}</p>
                                                <p>Gap: {atHGap.toFixed(2)}%</p>
                                                </div>
                                        )}
                                        
                                        
                                        
                                                
                                                <p>
                                                        Market Zone:{' '}
                                                        <span className={resolveFinalATLSignal() === 'Bearish Continuation' ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                                                                {resolveFinalATLSignal() === 'Bearish Continuation' ? '🔻 Still in the Sell Zone' : '🟢 Opportunity: Buy Zone'}
                                                        </span>
                                                </p>

                                                {resolveFinalATLSignal() === 'Bearish Continuation' ? (
                                                        <div className="text-sm bg-red-50 p-3 rounded-lg border border-red-200 space-y-1">
                                                                <p className="font-semibold text-red-800">Trade Setup (Sell Zone):</p>
                                                                <p>Entry: ${bearish.entry.toFixed(2)}</p>
                                                                <p>SL: ${bearish.stopLoss.toFixed(2)}</p>
                                                                <p>TP: ${bearish.takeProfit2.toFixed(2)} to ${bearish.takeProfit1.toFixed(2)}</p>
                                                        </div>
                                                ) : (
                                                        <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
                                                                <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
                                                                <p>Entry: ${bullishReversal.entry.toFixed(2)}</p>
                                                                <p>SL: ${bullishReversal.stopLoss.toFixed(2)}</p>
                                                                <p>TP: ${bullishReversal.takeProfit1.toFixed(2)} to ${bullishReversal.takeProfit2.toFixed(2)}</p>
                                                        </div>
                                                )}
                                        </div>
                                )}
                        </>
                )}
        </div>

        );
                        }
                                
