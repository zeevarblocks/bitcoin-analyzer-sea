import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/Alert";
import { startOfWeek } from "date-fns";

export default function Home() {
    const [ath, setAth] = useState(null);
    const [atl, setAtl] = useState(null);
    const [ema70, setEma70] = useState('');
    const [loading, setLoading] = useState(true);
    const [weeklyCandles, setWeeklyCandles] = useState([]);

    const calculateEMA = (data, period) => {
        if (data.length < period) return [];
        const k = 2 / (period + 1);
        const emaArray = new Array(data.length).fill(null);
        let ema = data.slice(0, period).reduce((sum, val) => sum + val.close, 0) / period;
        emaArray[period - 1] = ema;
        for (let i = period; i < data.length; i++) {
            ema = data[i].close * k + ema * (1 - k);
            emaArray[i] = ema;
        }
        return emaArray;
    };

    useEffect(() => {
        const fetchBTCWeeklyCandles = async () => {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200&interval=daily"
                );
                if (!res.ok) throw new Error("Failed to fetch daily data");

                const data = await res.json();
                const daily = data.prices.map((price, idx) => ({
                    time: price[0],
                    close: price[1],
                    low: data.low_24h ? data.low_24h[idx][1] : price[1],
                    high: data.high_24h ? data.high_24h[idx][1] : price[1],
                    open: idx === 0 ? price[1] : data.prices[idx - 1][1],
                    volume: data.total_volumes[idx][1],
                }));

                const grouped = new Map();
                for (const d of daily) {
                    const week = startOfWeek(new Date(d.time)).getTime();
                    if (!grouped.has(week)) grouped.set(week, []);
                    grouped.get(week).push(d);
                }

                const weekly = Array.from(grouped.entries()).map(([time, candles]) => ({
                    time,
                    open: candles[0].open,
                    close: candles[candles.length - 1].close,
                    high: Math.max(...candles.map(c => c.high)),
                    low: Math.min(...candles.map(c => c.low)),
                    volume: candles.reduce((sum, c) => sum + c.volume, 0),
                }));

                const ema14 = calculateEMA(weekly, 14);
                const ema70Array = calculateEMA(weekly, 70);

                const candlesWithEma = weekly.map((candle, idx) => ({
                    ...candle,
                    ema14: ema14[idx] || 0,
                    ema70: ema70Array[idx] || 0,
                }));

                setWeeklyCandles(candlesWithEma);
            } catch (err) {
                console.error("Error loading candles:", err);
            }
        };

        fetchBTCWeeklyCandles();
    }, []);

    useEffect(() => {
        const lastEma = weeklyCandles.at(-1)?.ema70;
        if (lastEma && lastEma > 0) {
            setEma70(lastEma.toFixed(2));
        }
    }, [weeklyCandles]);

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

    const findRecentATL = (data) => {
        if (!data || data.length < 100) return null;
        const last100 = data.slice(-100);
        const latestCandle = data[data.length - 1];
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

    const findRecentATH = (data) => {
        if (!data || data.length < 100) return null;
        const last100 = data.slice(-100);
        const latestCandle = data[data.length - 1];
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

    const atlInfo = findRecentATL(weeklyCandles);
    const athInfo = findRecentATH(weeklyCandles);
    const previousATLInfo = getPreviousATL(weeklyCandles);
    const previousATHInfo = getPreviousATH(weeklyCandles);

    const isValidAtl = atlInfo?.atl != null;
    const isValidAth = athInfo?.ath != null;
    const athGap = isValid && isValidAth ? ((athNum - emaNum) / emaNum) * 100 : 0;
    const atlGap = isValid && isValidAtl ? ((emaNum - atlInfo.atl) / atlInfo.atl) * 100 : 0;

    const getAthSignal = () => (athGap > 100 ? 'Bullish Continuation' : 'Possible Reversal');
    const getAtlSignal = () => (atlGap > 100 ? 'Bearish Continuation' : 'Possible Reversal');

    const computeBullishLevels = () => {
        if (!isValid) return {};
        return {
            entry: emaNum * 1.02,
            stopLoss: emaNum * 0.97,
            takeProfit1: athNum * 0.98,
            takeProfit2: athNum * 1.05,
        };
    };

    const computeBearishLevels = () => {
        if (!isValid) return {};
        return {
            entry: emaNum * 0.98,
            stopLoss: emaNum * 1.03,
            takeProfit1: atlNum * 1.02,
            takeProfit2: atlNum * 0.95,
        };
    };

    const computeBullishReversalFromAtl = () => {
        if (!isValid) return {};
        return {
            entry: atlNum * 1.02,
            stopLoss: atlNum * 0.97,
            takeProfit1: atlNum * 1.10,
            takeProfit2: atlNum * 1.20,
        };
    };

    const computeBearishReversalFromAth = () => {
        if (!isValid) return {};
        return {
            entry: athNum * 0.98,
            stopLoss: athNum * 1.03,
            takeProfit1: athNum * 0.90,
            takeProfit2: athNum * 0.80,
        };
    };

    const bullish = computeBullishLevels();
    const bearish = computeBearishLevels();
    const bullishReversal = computeBullishReversalFromAtl();
    const bearishReversal = computeBearishReversalFromAth();

    // Render UI
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
                                                        <span className={getAthSignal() === 'Bullish Continuation' ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
                                                                {getAthSignal() === 'Bullish Continuation' ? '🔥 Still in the Buy Zone' : '⚠️ Caution: Sell Zone'}
                                                        </span>
                                                </p>

                                                {getAthSignal() === 'Bullish Continuation' ? (
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
                                                        Market Zone:{' '}
                                                        <span className={getAtlSignal() === 'Bearish Continuation' ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                                                                {getAtlSignal() === 'Bearish Continuation' ? '🔻 Still in the Sell Zone' : '🟢 Opportunity: Buy Zone'}
                                                        </span>
                                                </p>

                                                {getAtlSignal() === 'Bearish Continuation' ? (
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
