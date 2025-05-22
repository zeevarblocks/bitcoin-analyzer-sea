'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BTCReversalStrategies() {
  const [showATH, setShowATH] = useState(false);
  const [showATL, setShowATL] = useState(false);
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
      }
    }

    fetchPrices();
  }, []);

  // ATH Setup
  const previousAthDate = new Date('2021-11-08');
  const recentAthDate = new Date('2025-01-08');
  const previousAthPrice = 69000;
  const recentAthPrice = 73500;
  const ema70AtRecentAth = 43000;

  const weeksSincePreviousAth = Math.floor(
    (recentAthDate.getTime() - previousAthDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  const percentDiffATH = ((recentAthPrice - ema70AtRecentAth) / ema70AtRecentAth) * 100;
  const trendIsBullish = ema14 && ema70 ? ema14 > ema70 : false;
  const reversalConfirmedATH =
    weeksSincePreviousAth > 100 && percentDiffATH < 100 && !trendIsBullish;

  const athEntry = recentAthPrice;
  const athStopLoss = athEntry * 1.01;
  const athTP1 = athEntry * 0.90;
  const athTP2 = athEntry * 0.80;

  // ATL Setup
  const previousAtlDate = new Date('2015-01-14');
  const recentAtlDate = new Date('2022-11-21');
  const previousAtlPrice = 152;
  const recentAtlPrice = 15500;
  const ema70AtRecentAtl = 25000;

  const weeksSincePreviousAtl = Math.floor(
    (recentAtlDate.getTime() - previousAtlDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  const percentDiffATL = ((ema70AtRecentAtl - recentAtlPrice) / ema70AtRecentAtl) * 100;
  const reversalConfirmedATL =
    weeksSincePreviousAtl > 300 && percentDiffATL > 30 && trendIsBullish;

  const atlEntry = recentAtlPrice;
  const atlStopLoss = atlEntry * 0.95;
  const atlTP1 = atlEntry * 1.25;
  const atlTP2 = atlEntry * 1.50;

  return (
    <div className="bg-black text-white p-6 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-10">
      {/* ATH Setup */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Bitcoin ATH Reversal Strategy</h2>

        <button
          onClick={() => setShowATH(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded mb-4"
        >
          {loading ? 'Loading...' : 'Analyze ATH'}
        </button>

        {showATH && !loading && ema14 && ema70 && (
          <div className="space-y-2">
            <p><strong>Previous ATH:</strong> ${previousAthPrice} on {previousAthDate.toDateString()}</p>
            <p><strong>Recent ATH:</strong> ${recentAthPrice} on {recentAthDate.toDateString()}</p>
            <p><strong>EMA70 at Recent ATH:</strong> ${ema70AtRecentAth}</p>
            <p><strong>Weeks Since Previous ATH:</strong> {weeksSincePreviousAth}</p>
            <p><strong>% Diff from EMA70:</strong> {percentDiffATH.toFixed(2)}%</p>
            <p><strong>EMA14:</strong> ${ema14.toFixed(2)} | <strong>EMA70:</strong> ${ema70.toFixed(2)}</p>
            <p><strong>Trend:</strong> {trendIsBullish ? 'Bullish' : 'Bearish'}</p>
            <h3 className={`text-lg font-bold ${reversalConfirmedATH ? 'text-green-400' : 'text-red-400'}`}>
              ATH Reversal Confirmed: {reversalConfirmedATH ? 'YES' : 'NO'}
            </h3>

            {reversalConfirmedATH && (
              <div className="mt-4">
                <h4 className="text-md font-semibold">Trade Setup</h4>
                <p><strong>Entry:</strong> ${athEntry}</p>
                <p><strong>Stop Loss:</strong> ${athStopLoss.toFixed(0)}</p>
                <p><strong>Take Profit 1:</strong> ${athTP1.toFixed(0)}</p>
                <p><strong>Take Profit 2:</strong> ${athTP2.toFixed(0)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ATL Setup */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Bitcoin ATL Reversal Strategy</h2>

        <button
          onClick={() => setShowATL(true)}
          className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded mb-4"
        >
          {loading ? 'Loading...' : 'Analyze ATL'}
        </button>

        {showATL && !loading && ema14 && ema70 && (
          <div className="space-y-2">
            <p><strong>Previous ATL:</strong> ${previousAtlPrice} on {previousAtlDate.toDateString()}</p>
            <p><strong>Recent ATL:</strong> ${recentAtlPrice} on {recentAtlDate.toDateString()}</p>
            <p><strong>EMA70 at Recent ATL:</strong> ${ema70AtRecentAtl}</p>
            <p><strong>Weeks Since Previous ATL:</strong> {weeksSincePreviousAtl}</p>
            <p><strong>% Diff to EMA70:</strong> {percentDiffATL.toFixed(2)}%</p>
            <p><strong>EMA14:</strong> ${ema14.toFixed(2)} | <strong>EMA70:</strong> ${ema70.toFixed(2)}</p>
            <p><strong>Trend:</strong> {trendIsBullish ? 'Bullish' : 'Bearish'}</p>
            <h3 className={`text-lg font-bold ${reversalConfirmedATL ? 'text-green-400' : 'text-red-400'}`}>
              ATL Reversal Confirmed: {reversalConfirmedATL ? 'YES' : 'NO'}
            </h3>

            {reversalConfirmedATL && (
              <div className="mt-4">
                <h4 className="text-md font-semibold">Accumulation Setup</h4>
                <p><strong>Entry:</strong> ${atlEntry}</p>
                <p><strong>Stop Loss:</strong> ${atlStopLoss.toFixed(0)}</p>
                <p><strong>Take Profit 1:</strong> ${atlTP1.toFixed(0)}</p>
                <p><strong>Take Profit 2:</strong> ${atlTP2.toFixed(0)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        This dual setup combines historical and technical patterns. Educational purpose only. Not financial advice.
      </p>
    </div>
  );
}