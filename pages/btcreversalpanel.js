'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BTCReversalSetup() {
    const [showSetup, setShowSetup] = useState(false);
    const [prices, setPrices] = useState([]);
    const [ema14, setEma14] = useState(null);
    const [ema70, setEma70] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPrices() {
            try {
                const res = await axios.get(
                    'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
                    {
                        params: {
                            vs_currency: 'usd',
                            days: '90',
                            interval: 'daily',
                        },
                    }
                );

                const closePrices = res.data.prices.map((p) => p[1]);
                setPrices(closePrices);

                const calculateEMA = (data, period) => {
                    const k = 2 / (period + 1);
                    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
                    for (let i = period; i < data.length; i++) {
                        ema = data[i] * k + ema * (1 - k);
                    }
                    return ema;
                };

                setEma14(calculateEMA(closePrices, 14));
                setEma70(calculateEMA(closePrices, 70));
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch BTC prices:', err);
                setLoading(false);
            }
        }

        fetchPrices();
    }, []);

    const previousAthDate = new Date('2021-11-08');
    const recentAthDate = new Date('2025-01-08');
    const previousAthPrice = 69000;
    const ema70AtPreviousAth = 43000;
    const recentAthPrice = 73500;

    const weeksSincePreviousAth = Math.floor(
        (recentAthDate - previousAthDate) / (1000 * 60 * 60 * 24 * 7)
    );
    const percentDiff = ((previousAthPrice - ema70AtPreviousAth) / ema70AtPreviousAth) * 100;

    const trendIsBullish = ema14 && ema70 ? ema14 > ema70 : false;
    const reversalConfirmed = weeksSincePreviousAth > 100 && percentDiff < 100 && !trendIsBullish;

    const entry = recentAthPrice;
    const stopLoss = entry * 1.01;
    const takeProfit1 = entry * 0.90;
    const takeProfit2 = entry * 0.80;

    return (
        <div className="bg-black text-white p-6 rounded-2xl shadow-lg max-w-xl mx-auto my-10">
            <h2 className="text-2xl font-bold mb-4 text-center">Bitcoin Reversal Strategy</h2>

            <button
                onClick={() => setShowSetup(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded mb-6 w-full"
            >
                {loading ? 'Loading...' : 'Analyze Market'}
            </button>

            {showSetup && !loading && ema14 && ema70 && (
                <>
                    <div className="space-y-2">
                        <p><strong>Previous ATH:</strong> ${previousAthPrice} on <span className="text-yellow-400">{previousAthDate.toDateString()}</span></p>
                        <p><strong>EMA70 at Previous ATH:</strong> ${ema70AtPreviousAth}</p>
                        <p><strong>Weeks Since Previous ATH:</strong> {weeksSincePreviousAth} weeks</p>
                        <p><strong>% Difference from EMA70:</strong> {percentDiff.toFixed(2)}%</p>
                        <p><strong>Recent ATH Breakout:</strong> ${recentAthPrice} on <span className="text-green-400">{recentAthDate.toDateString()}</span></p>
                        <p><strong>Current EMA14:</strong> ${ema14.toFixed(2)}</p>
                        <p><strong>Current EMA70:</strong> ${ema70.toFixed(2)}</p>
                        <p>
                            <strong>Trend Signal:</strong>{' '}
                            <span className={trendIsBullish ? 'text-green-400' : 'text-red-400'}>
                                {trendIsBullish ? 'Bullish (EMA14 > EMA70)' : 'Bearish (EMA14 < EMA70)'}
                            </span>
                        </p>
                    </div>

                    <div className="mt-4">
                        <h3 className={`text-lg font-semibold ${reversalConfirmed ? 'text-green-400' : 'text-red-400'}`}>
                            Reversal Confirmation: {reversalConfirmed ? 'YES' : 'NO'}
                        </h3>
                    </div>

                    {reversalConfirmed && (
                        <div className="mt-4 space-y-2">
                            <h4 className="text-md font-semibold">Trading Setup Plan</h4>
                            <p><strong>Entry Zone:</strong> ~${entry}</p>
                            <p><strong>Stop Loss:</strong> ~${stopLoss.toFixed(0)}</p>
                            <p><strong>Take Profit 1:</strong> ~${takeProfit1.toFixed(0)} (-10%)</p>
                            <p><strong>Take Profit 2:</strong> ~${takeProfit2.toFixed(0)} (-20%)</p>
                        </div>
                    )}

                    <p className="text-xs text-gray-400 mt-4">
                        This setup is based on historical and technical analysis. Not financial advice.
                    </p>
                </>
            )}
        </div>
    );
}