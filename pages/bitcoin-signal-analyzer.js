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
            const res = await fetch("https://www.okx.com/api/v5/market/candles?instId=BTC-USDT&bar=1W&limit=200");
            if (!res.ok) throw new Error("Failed to fetch weekly candles");
            const json = await res.json();

            const rawCandles = json.data || []; // OKX API returns { code, msg, data: [...] }

            const formatted = rawCandles.map((candle) => ({
                time: Number(candle[0]),
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5]),
            })).reverse(); // reverse for oldest-to-newest order

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

        const getPreviousATL = (candles) => {
                if (candles.length < 2) return null;
                const candlesExcludingLast = candles.slice(0, -1);
                const prevAtlCandle = candlesExcludingLast.reduce((min, curr) =>
                        curr.low < min.low ? curr : min
                );
                return {
                        price: prevAtlCandle.low,
                        time: new Date(prevAtlCandle.time).toLocaleDateString(),
                };
        };

        const findRecentATL = (data) => {
                if (!data || data.length < 100) return null;

                const last100 = data.slice(-100);
                const latestCandle = data[data.length - 1];

                // Ensure current trend is bearish
                if (latestCandle.ema14 >= latestCandle.ema70) return null;

                let atlCandle = last100[0];
                last100.forEach(candle => {
                        if (candle.low < atlCandle.low) {
                                atlCandle = candle;
                        }
                });

                const atlPrice = atlCandle.low;
                const atlEMA70 = atlCandle.ema70;
                const gapPercent = ((atlEMA70 - atlPrice) / atlEMA70) * 100;

                return {
                        atl: atlPrice,
                        ema70: atlEMA70,
                        gapPercent: gapPercent.toFixed(2),
                };
        };
        const getPreviousATH = (candles) => {
                if (candles.length < 2) return null;
                const candlesExcludingLast = candles.slice(0, -1);
                const prevAthCandle = candlesExcludingLast.reduce((max, curr) =>
                        curr.high > max.high ? curr : max
                );
                return {
                        price: prevAthCandle.high,
                        time: new Date(prevAthCandle.time).toLocaleDateString(),
                };
        };


        const findRecentATH = (data) => {
                if (!data || data.length < 100) return null;

                const last100 = data.slice(-100);
                const latestCandle = data[data.length - 1];

                // Ensure current trend is bullish
                if (latestCandle.ema14 <= latestCandle.ema70) return null;

                let athCandle = last100[0];
                last100.forEach(candle => {
                        if (candle.high > athCandle.high) {
                                athCandle = candle;
                        }
                });

                const athPrice = athCandle.high;
                const athEMA70 = athCandle.ema70;
                const gapPercent = ((athPrice - athEMA70) / athEMA70) * 100;

                return {
                        ath: athPrice,
                        ema70: athEMA70,
                        gapPercent: gapPercent.toFixed(2),
                };
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

        const previousATLInfo = getPreviousATL(weeklyCandles);
        const previousATHInfo = getPreviousATH(weeklyCandles);
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

        const getAthSignal = () => (athGap > 100 ? 'Bullish Continuation' : 'Possible Reversal');
        const getAtlSignal = () => (atlGap > 100 ? 'Bearish Continuation' : 'Possible Reversal');


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

        return (        <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: '2rem',
          borderRadius: '16px',
          color: 'white',
          maxWidth: '600px',
          width: '100%',
        }}
      >                
                        
                <p className="text-lg mb-6 text-gray-300">
                        <span className="font-semibold text-white">Smart Bitcoin Trading Starts Here.</span> Instantly analyze Bitcoin's market status using 1W timeframe data, tracking ATH, ATL, and EMA70 trends. This tool gives you actionable trade setups, identifies market zones (Buy or Sell), and provides real-time insights—all in one simple interface.
                </p>
                <div className="border-l-4 border-yellow-400 pl-4 text-sm text-yellow-100 italic">
                        Plan smarter. Trade better.
                </div>

                <div className="space-y-6 bg-gray-950 p-6 rounded-xl text-white">
  <div className="bg-gray-900 p-4 rounded-lg border border-blue-600">
    <h2 className="text-lg font-semibold text-blue-400 mb-2">EMA70 Value</h2>
    <div className="bg-gray-800 text-blue-300 border border-blue-700 rounded px-4 py-2">
      {ema70}
    </div>
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
                                        <div className="space-y-4 bg-gray-900 p-6 rounded-xl shadow-lg text-gray-100 border border-gray-700">
  <h2 className="text-xl font-semibold text-yellow-400">ATH Heat Check</h2>

  {previousATHInfo && (
    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500 shadow-inner">
      <h3 className="text-lg font-bold mb-2">Previous ATH Reference</h3>
      <p className="text-sm">Price: ${previousATHInfo.price.toFixed(2)}</p>
      <p className="text-sm text-gray-400">Occurred on: {previousATHInfo.time}</p>
    </div>
  )}

  <div className="bg-gray-800 p-4 rounded-lg border border-blue-600 space-y-2">
    <p className="text-sm">Current ATH: <span className="font-medium text-blue-300">${athNum.toFixed(2)}</span></p>
    <p className="text-sm">Gap from EMA70: <span className="font-medium text-orange-400">{athGap.toFixed(2)}%</span></p>
  </div>
                                                <p>
                                                        Market Zone:{' '}
                                                        <span className={getAthSignal() === 'Bullish Continuation' ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
                                                                {getAthSignal() === 'Bullish Continuation' ? '🔥 Buying Zone' : '⚠️ Caution: Selling Zone'}
                                                        </span>
                                                </p>

                                                {getAthSignal() === 'Bullish Continuation' ? (
  // === Bullish Trade Setup ===
  <div className="text-slate-800 bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1 font-semibold">
  <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
  <p>
    Entry: <span className="text-blue-700">${bullish.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
  <p>
    Stop-Loss: <span className="text-red-700">${bullish.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
  <p>
    Take-Profit: <span className="text-green-700">${bullish.takeProfit1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> 
    to <span className="text-green-700">${bullish.takeProfit2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
</div>
) : (
  // === Bearish Trade Setup ===
  <div className="text-slate-800 bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1 font-semibold">
  <p className="font-semibold text-yellow-800">Trade Setup (Sell Zone):</p>
  <p>
    Entry: <span className="text-blue-700">${bearishReversal.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
  <p>
    Stop-Loss: <span className="text-red-700">${bearishReversal.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
  <p>
    Take-Profit: <span className="text-green-700">${bearishReversal.takeProfit2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> 
    to <span className="text-green-700">${bearishReversal.takeProfit1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
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
                                        <div className="space-y-4 bg-gray-900 p-6 rounded-xl shadow-lg text-gray-100 border border-gray-700">
  <h2 className="text-xl font-semibold text-green-400">ATL Heat Check</h2>

  {previousATLInfo && (
    <div className="bg-gray-800 p-4 rounded-lg border border-green-500 shadow-inner">
      <h3 className="text-lg font-bold mb-2">Previous ATL Reference</h3>
      <p className="text-sm">Price: ${previousATLInfo.price.toFixed(2)}</p>
      <p className="text-sm text-gray-400">Occurred on: {previousATLInfo.time}</p>
    </div>
  )}

  <div className="bg-gray-800 p-4 rounded-lg border border-blue-600 space-y-2">
    <p className="text-sm">Current ATL: <span className="font-medium text-blue-300">${atlNum.toFixed(2)}</span></p>
    <p className="text-sm">Gap from EMA70: <span className="font-medium text-orange-400">{atlGap.toFixed(2)}%</span></p>
  </div>
                                                
                                        
                                                <p>
                                                        Market Zone:{' '}
                                                        <span className={getAtlSignal() === 'Bearish Continuation' ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                                                                {getAtlSignal() === 'Bearish Continuation' ? '🔻 Still in the Sell Zone' : '🟢 Opportunity: Buy Zone'}
                                                        </span>
                                                </p>

                                                {getAtlSignal() === 'Bearish Continuation' ? (
                                                        <div className="text-slate-800 bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1 font-semibold">
  <p className="font-semibold text-red-800">Trade Setup (Sell Zone):</p>
  <p>
    Entry: <span className="text-blue-700">${bearish.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
  <p>
    Stop-Loss: <span className="text-red-700">${bearish.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
  <p>
    Take-Profit: <span className="text-green-700">${bearish.takeProfit2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    {" "}to{" "}
    <span className="text-green-700">${bearish.takeProfit1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
</div>
                                                ) : (
                                                        <div className="text-slate-800 bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1 font-semibold">
  <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
  <p>
    Entry: <span className="text-blue-700">${bullishReversal.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
  <p>
    Stop-Loss: <span className="text-red-700">${bullishReversal.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
  <p>
    Take-Profit: <span className="text-green-700">${bullishReversal.takeProfit1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    {" "}to{" "}
    <span className="text-green-700">${bullishReversal.takeProfit2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </p>
</div>
                                                )}
                                        </div>
                                )}
                        </>
                )}
        </div>

        );
          }
          
