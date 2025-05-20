import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  CandlestickController,
  CandlestickElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchBTCData } from '../utils/fetchBTCData';
import ChartComponent from '../components/ChartComponent';

export default function Home() {
  const [ath, setAth] = useState('');
  const [atl, setAtl] = useState('');
  const [ema70, setEma70] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchBTCData().then(data => setChartData(data));
  }, []);

  const computeAthGap = () => {
    const athNum = parseFloat(ath);
    const emaNum = parseFloat(ema70);
    if (isNaN(athNum) || isNaN(emaNum) || emaNum === 0) return 0;
    return ((athNum - emaNum) / emaNum) * 100;
  };

  const computeAtlGap = () => {
    const atlNum = parseFloat(atl);
    const emaNum = parseFloat(ema70);
    if (isNaN(atlNum) || isNaN(emaNum) || atlNum === 0) return 0;
    return ((emaNum - atlNum) / atlNum) * 100;
  };

  const getAthSignal = () => (computeAthGap() > 100 ? 'Bullish Continuation' : 'Possible Reversal');
  const getAtlSignal = () => (computeAtlGap() > 100 ? 'Bearish Continuation' : 'Possible Reversal');

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
    entry: atlNum * 1.02, // Entry just above ATL
    stopLoss: atlNum * 0.97, // SL below ATL
    takeProfit1: ema * 0.98, // First TP slightly below EMA
    takeProfit2: ema * 1.05, // Second TP above EMA
  };
};


const computeBearishReversalFromAth = () => {
  const athNum = parseFloat(ath);
  const ema = parseFloat(ema70);
  if (isNaN(athNum) || isNaN(ema)) return {};
  return {
    entry: athNum * 0.98, // Entry just below ATH
    stopLoss: athNum * 1.03, // SL above ATH
    takeProfit1: ema * 1.02, // First TP just above EMA
    takeProfit2: ema * 0.95, // Second TP below EMA
  };
};
  
  const bullishReversal = computeBullishReversalFromAtl();
const bearishReversal = computeBearishReversalFromAth();

  const bullish = computeBullishLevels();
  const bearish = computeBearishLevels();

  return (
    <div className="min-h-screen bg-cover bg-center p-6 text-gray-800" style={{ backgroundImage: 'url(/bg.png)' }}>
      <div className="max-w-4xl mx-auto bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">Bitcoin Signal Analyzer</h1>

        <p className="text-gray-700 text-center">
          Analyze the Bitcoin market using the vertical relationship between ATH, ATL, and the 70 EMA on the 1W timeframe. This tool generates a signal—either bullish continuation or possible reversal—based on macro price behavior.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg">
  <h2 className="text-lg font-semibold text-gray-800 mb-2">How to Use This Tool:</h2>
  <ul className="list-disc list-inside text-gray-700 space-y-2">
    <li><strong>Use the 1W (Weekly) chart timeframe</strong> to maintain consistency with EMA70 calculations.</li>

    <li>
      When entering the <strong>All-Time High (ATH)</strong> value, make sure you also enter the corresponding
      <strong> EMA70 value that was active on the exact weekly candle</strong> when the ATH occurred.
    </li>

    <li>
      Similarly, for <strong>All-Time Low (ATL)</strong> analysis, use the <strong>EMA70 value from the same weekly candle</strong> where the ATL occurred.
    </li>

    <li>
      The app calculates the vertical distance (gap) between ATH/ATL and EMA70 as a percentage.
      <ul className="list-disc list-inside ml-6 space-y-1">
        <li>If ATH is more than <strong>+100% above EMA70</strong>, it suggests a <strong>Bullish Continuation</strong>.</li>
        <li>If ATL is more than <strong>-100% below EMA70</strong>, it suggests a <strong>Bearish Continuation</strong>.</li>
        <li>Smaller gaps imply potential reversal zones or consolidation.</li>
      </ul>
    </li>

    <li>
      The system generates trade levels (entry, stop loss, take profits) based on whether price is continuing or reversing from macro zones.
    </li>

    <li>
      Optionally, you may enter the <strong>current BTC price</strong> to track how price is behaving relative to historical extremes and EMA70.
    </li>

    <li>
      Use the live BTC chart below to explore historical price behavior and visually identify the weekly candle of the ATH/ATL.
    </li>
  </ul>
</div>

        {/* Grouped Input Sections */}
<div className="space-y-6">
  {/* ATH (Bullish) Inputs */}
  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
    <h2 className="text-lg font-semibold text-green-800 mb-2">Bullish Analysis (ATH vs EMA70)</h2>
    <div className="grid grid-cols-2 gap-4">
      <input
        type="number"
        placeholder="All-Time High (ATH)"
        className="p-2 border border-gray-300 rounded"
        onChange={e => setAth(e.target.value)}
      />
      <input
        type="number"
        placeholder="EMA70"
        className="p-2 border border-gray-300 rounded"
        onChange={e => setEma70(e.target.value)}
      />
    </div>
  </div>

  {/* ATL (Bearish) Inputs */}
  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
    <h2 className="text-lg font-semibold text-red-800 mb-2">Bearish Analysis (ATL vs EMA70)</h2>
    <div className="grid grid-cols-2 gap-4">
      <input
        type="number"
        placeholder="All-Time Low (ATL)"
        className="p-2 border border-gray-300 rounded"
        onChange={e => setAtl(e.target.value)}
      />
      <input
        type="number"
        placeholder="EMA70"
        className="p-2 border border-gray-300 rounded"
        onChange={e => setEma70(e.target.value)}
      />
    </div>
  </div>

  {/* Optional: Current Price Input */}
  <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
    <h2 className="text-lg font-semibold text-gray-800 mb-2">Optional: Current BTC Price</h2>
    <input
      type="number"
      placeholder="Current Price"
      className="w-full p-2 border border-gray-300 rounded"
      onChange={e => setCurrentPrice(e.target.value)}
    />
  </div>
</div>

        {/* ATH Signal Block */}
        <div className="space-y-2 text-gray-800">
          <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
          <p>Gap: {computeAthGap().toFixed(2)}%</p>
          <p>
            Signal:{' '}
            <span className={getAthSignal() === 'Bullish Continuation' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {getAthSignal()}
            </span>
          </p>
          <p className="text-sm text-gray-700">
            {getAthSignal() === 'Bullish Continuation'
              ? 'Price is trending above long-term resistance. Momentum is strong; consider watching for breakout confirmations.'
              : 'Price may be weakening. A pullback or trend reversal could be developing. Monitor weekly candles closely.'}
          </p>
          {getAthSignal() === 'Bullish Continuation' && bullish.entry && (
  <div className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-1">
    <p className="font-semibold text-blue-800">Suggested Trade Levels (Bullish):</p>
    <p>Entry Point: <span className="font-medium text-gray-800">${bullish.entry.toFixed(2)}</span></p>
    <p>Stop Loss: <span className="font-medium text-gray-800">${bullish.stopLoss.toFixed(2)}</span></p>
    <p>Take Profit: <span className="font-medium text-gray-800">${bullish.takeProfit1.toFixed(2)} to ${bullish.takeProfit2.toFixed(2)}</span></p>
  </div>
)}

{getAthSignal() === 'Possible Reversal' && bearishReversal.entry && (
  <div className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1">
    <p className="font-semibold text-yellow-800">Suggested Trade Levels (Bearish - Based on ATH Reversal):</p>
    <p>Entry Point: <span className="font-medium text-gray-800">${bearishReversal.entry.toFixed(2)}</span></p>
    <p>Stop Loss: <span className="font-medium text-gray-800">${bearishReversal.stopLoss.toFixed(2)}</span></p>
    <p>Take Profit: <span className="font-medium text-gray-800">${bearishReversal.takeProfit2.toFixed(2)} to ${bearishReversal.takeProfit1.toFixed(2)}</span></p>
  </div>
)}
        </div>

        {/* ATL Signal Block */}
        <div className="space-y-2 text-gray-800">
          <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
          <p>Gap: {computeAtlGap().toFixed(2)}%</p>
          <p>
            Signal:{' '}
            <span className={getAtlSignal() === 'Bearish Continuation' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
              {getAtlSignal()}
            </span>
          </p>
          <p className="text-sm text-gray-700">
            {getAtlSignal() === 'Bearish Continuation'
              ? 'Price remains under long-term pressure. Trend continuation likely unless strong reversal patterns emerge.'
              : 'Price may be rebounding from historic lows. Watch for a higher low structure and rising EMA support.'}
          </p>
          {getAtlSignal() === 'Bearish Continuation' && bearish.entry && (
  <div className="text-sm bg-red-50 p-3 rounded-lg border border-red-200 space-y-1">
    <p className="font-semibold text-red-800">Suggested Trade Levels (Bearish):</p>
    <p>Entry Point: <span className="font-medium text-gray-800">${bearish.entry.toFixed(2)}</span></p>
    <p>Stop Loss: <span className="font-medium text-gray-800">${bearish.stopLoss.toFixed(2)}</span></p>
    <p>Take Profit: <span className="font-medium text-gray-800">${bearish.takeProfit2.toFixed(2)} to ${bearish.takeProfit1.toFixed(2)}</span></p>
  </div>
)}

{getAtlSignal() === 'Possible Reversal' && bullishReversal.entry && (
  <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
    <p className="font-semibold text-green-800">Suggested Trade Levels (Bullish - Based on ATL Reversal):</p>
    <p>Entry Point: <span className="font-medium text-gray-800">${bullishReversal.entry.toFixed(2)}</span></p>
    <p>Stop Loss: <span className="font-medium text-gray-800">${bullishReversal.stopLoss.toFixed(2)}</span></p>
    <p>Take Profit: <span className="font-medium text-gray-800">${bullishReversal.takeProfit1.toFixed(2)} to ${bullishReversal.takeProfit2.toFixed(2)}</span></p>
  </div>
)}
        </div>

        {/* Chart Section */}
{!chartData ? (
    <p className="text-center text-gray-600 flex items-center justify-center space-x-2">
        <svg
              className="animate-spin h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                                viewBox="0 0 24 24"
                                    >
                                          <circle
                                                  className="opacity-25"
                                                          cx="12"
                                                                  cy="12"
                                                                          r="10"
                                                                                  stroke="currentColor"
                                                                                          strokeWidth="4"
                                                                                                />
                                                                                                      <path
                                                                                                              className="opacity-75"
                                                                                                                      fill="currentColor"
                                                                                                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                                                                                                    />
                                                                                                                                        </svg>
                                                                                                                                            <span>Loading BTC chart...</span>
                                                                                                                                              </p>
                                                                                                                                              ) : (
                                                                                                                                                <div className="bg-white p-4 rounded-lg shadow-md">
                                                                                                                                                    <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">
                                                                                                                                                          BTC Price Chart (Recent)
                                                                                                                                                              </h2>
                                                                                                                                                                  <ChartComponent datasets={chartData.datasets} />
                                                                                                                                                                    </div>
                                                                                                                                                                    )}


        <footer className="text-sm text-center text-gray-500 pt-6 border-t border-gray-200">
          <p>
            <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
          </p>
        </footer>
      </div>
    </div>
  );
    }
