import React, { useState, useEffect } from 'react';

export default function Home() {
  const [ath, setAth] = useState(null);
  const [atl, setAtl] = useState(null);
  const [ema70, setEma70] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch ATH/ATL from CoinGecko
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

  // Parsed numbers
  const athNum = parseFloat(ath);
  const atlNum = parseFloat(atl);
  const emaNum = parseFloat(ema70);

  const isValid = !isNaN(emaNum) && emaNum > 0;

  // Calculations
  const athGap = isValid ? ((athNum - emaNum) / emaNum) * 100 : 0;
  const atlGap = isValid ? ((emaNum - atlNum) / atlNum) * 100 : 0;

  const getAthSignal = () => (athGap > 100 ? 'Bullish Continuation' : 'Possible Reversal');
  const getAtlSignal = () => (atlGap > 100 ? 'Bearish Continuation' : 'Possible Reversal');

  const computeBullishLevels = () => ({
    entry: emaNum * 1.02,
    stopLoss: emaNum * 0.97,
    takeProfit1: athNum * 0.98,
    takeProfit2: athNum * 1.05,
  });

  const computeBearishLevels = () => ({
    entry: emaNum * 0.98,
    stopLoss: emaNum * 1.03,
    takeProfit1: atlNum * 1.02,
    takeProfit2: atlNum * 0.95,
  });

  const computeBullishReversalFromAtl = () => ({
    entry: atlNum * 1.02,
    stopLoss: atlNum * 0.97,
    takeProfit1: atlNum * 1.1,
    takeProfit2: atlNum * 1.2,
  });

  const computeBearishReversalFromAth = () => ({
    entry: athNum * 0.98,
    stopLoss: athNum * 1.03,
    takeProfit1: athNum * 0.9,
    takeProfit2: athNum * 0.8,
  });

  const bullish = isValid ? computeBullishLevels() : null;
  const bearish = isValid ? computeBearishLevels() : null;
  const bullishReversal = isValid ? computeBullishReversalFromAtl() : null;
  const bearishReversal = isValid ? computeBearishReversalFromAth() : null;

  return (
    <div className="max-w-4xl mx-auto bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-900">Bitcoin Signal Analyzer</h1>

      <p className="text-gray-700 text-center">
        Analyze the Bitcoin market using the vertical relationship between ATH, ATL, and the 70 EMA on the 1W timeframe.
      </p>

      <div className="space-y-6 bg-gray-950 p-6 rounded-xl text-white">
        <div className="bg-gray-900 p-4 rounded-lg border border-blue-600">
          <h2 className="text-lg font-semibold text-blue-400 mb-2">Mock EMA70 Input</h2>
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
          {/* ATH Block */}
          <div className="space-y-2 text-gray-800">
            <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
            <p>ATH: ${athNum.toFixed(2)}</p>
            <p>Gap: {athGap.toFixed(2)}%</p>
            <p>
              Market Zone:{' '}
              <span className={getAthSignal() === 'Bullish Continuation' ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
                {getAthSignal() === 'Bullish Continuation' ? '🔥 Still in the Buy Zone' : '⚠️ Caution: Sell Zone'}
              </span>
            </p>

            {getAthSignal() === 'Bullish Continuation' && (
              <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
                <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
                <p>Entry: ${bullish.entry.toFixed(2)}</p>
                <p>SL: ${bullish.stopLoss.toFixed(2)}</p>
                <p>TP: ${bullish.takeProfit1.toFixed(2)} to ${bullish.takeProfit2.toFixed(2)}</p>
              </div>
            )}

            {getAthSignal() !== 'Bullish Continuation' && (
              <div className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1">
                <p className="font-semibold text-yellow-800">Trade Setup (Sell Zone):</p>
                <p>Entry: ${bearishReversal.entry.toFixed(2)}</p>
                <p>SL: ${bearishReversal.stopLoss.toFixed(2)}</p>
                <p>TP: ${bearishReversal.takeProfit2.toFixed(2)} to ${bearishReversal.takeProfit1.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* ATL Block */}
          <div className="space-y-2 text-gray-800">
            <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
            <p>ATL: ${atlNum.toFixed(2)}</p>
            <p>Gap: {atlGap.toFixed(2)}%</p>
            <p>
              Market Zone:{' '}
              <span className={getAtlSignal() === 'Bearish Continuation' ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                {getAtlSignal() === 'Bearish Continuation' ? '🔻 Still in the Sell Zone' : '🟢 Opportunity: Buy Zone'}
              </span>
            </p>

            {getAtlSignal() === 'Bearish Continuation' && (
              <div className="text-sm bg-red-50 p-3 rounded-lg border border-red-200 space-y-1">
                <p className="font-semibold text-red-800">Trade Setup (Sell Zone):</p>
                <p>Entry: ${bearish.entry.toFixed(2)}</p>
                <p>SL: ${bearish.stopLoss.toFixed(2)}</p>
                <p>TP: ${bearish.takeProfit2.toFixed(2)} to ${bearish.takeProfit1.toFixed(2)}</p>
              </div>
            )}

            {getAtlSignal() !== 'Bearish Continuation' && (
              <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
                <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
                <p>Entry: ${bullishReversal.entry.toFixed(2)}</p>
                <p>SL: ${bullishReversal.stopLoss.toFixed(2)}</p>
                <p>TP: ${bullishReversal.takeProfit1.toFixed(2)} to ${bullishReversal.takeProfit2.toFixed(2)}</p>
              </div>
            )}
          </div>
        </>
      )};
    </div> // <-- closing main container div
  );
}