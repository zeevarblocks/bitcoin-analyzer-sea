'use client';

import React, { useState } from 'react';

export default function BTCReversalSetup() {
    const [showSetup, setShowSetup] = useState(false);

    // Mock Data
    const previousAthDate = new Date('2021-11-08');
    const previousAthPrice = 69000;
    const ema70AtPreviousAth = 43000;

    const recentAthDate = new Date('2025-01-08');
    const recentAthPrice = 73500;

    const weeksSincePreviousAth = Math.floor(
        (recentAthDate.getTime() - previousAthDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );

    const percentDiff = ((previousAthPrice - ema70AtPreviousAth) / ema70AtPreviousAth) * 100;
    const reversalPossible = weeksSincePreviousAth > 100 && percentDiff < 100;

    // Trading Setup
    const entry = recentAthPrice;
    const stopLoss = entry * 1.01;
    const takeProfit1 = entry * 0.90;
    const takeProfit2 = entry * 0.80;

    return (
        <div className="bg-black text-white p-6 rounded-2xl shadow-lg max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Bitcoin Reversal Strategy</h2>

            <button
                onClick={() => setShowSetup(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded mb-6"
            >
                Analyze Market
            </button>

            {showSetup && (
                <>
                    <div className="space-y-2">
                        <p><strong>Previous ATH:</strong> ${previousAthPrice} on <span className="text-yellow-400">{previousAthDate.toDateString()}</span></p>
                        <p><strong>EMA70 at ATH:</strong> ${ema70AtPreviousAth}</p>
                        <p><strong>Weeks Since ATH:</strong> {weeksSincePreviousAth} weeks</p>
                        <p><strong>% Difference from EMA70:</strong> {percentDiff.toFixed(2)}%</p>
                        <p><strong>Recent ATH Breakout:</strong> ${recentAthPrice} on <span className="text-green-400">{recentAthDate.toDateString()}</span></p>
                    </div>

                    <div className="mt-4">
                        <h3 className={`text-lg font-semibold ${reversalPossible ? 'text-green-400' : 'text-red-400'}`}>
                            Reversal Confirmation: {reversalPossible ? 'YES' : 'NO'}
                        </h3>
                    </div>

                    {reversalPossible && (
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