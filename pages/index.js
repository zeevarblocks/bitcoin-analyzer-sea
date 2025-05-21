import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchBTCData } from '../utils/fetchBTCData';

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

    return (
        <div
  className="min-h-screen bg-fixed bg-cover bg-center p-6 flex justify-center items-start"
  style={{ backgroundImage: 'url(/bg.png)' }}
>
  <div className="w-full max-w-5xl bg-black/60 backdrop-blur-md text-white rounded-2xl shadow-2xl p-8 space-y-8">
    
    {/* ATH Signal Block */}
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
      <p>Gap: {computeAthGap().toFixed(2)}%</p>
      <p>
        Signal: <span className={getAthSignal() === 'Bullish' ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
          {getAthSignal()}
        </span>
      </p>
      <p className="text-sm text-gray-300">
        {getAthSignal() === 'Bullish'
          ? 'Price may be poised to retest all-time highs. Momentum likely increasing.'
          : 'Current price indicates weakness against long-term trend. Caution advised.'}
      </p>

      {getAthSignal() === 'Bullish' && bullishReversal.entry && (
        <div className="text-sm bg-green-100/20 p-4 rounded-lg border border-green-400 space-y-1">
          <p className="font-semibold text-green-300">Suggested Trade Levels (Bullish):</p>
          <p>Entry Point: <span className="font-medium">${bullishReversal.entry.toFixed(2)}</span></p>
          <p>Stop Loss: <span className="font-medium">${bullishReversal.stopLoss.toFixed(2)}</span></p>
          <p>Take Profit: <span className="font-medium">${bullishReversal.takeProfit1.toFixed(2)} to ${bullishReversal.takeProfit2.toFixed(2)}</span></p>
        </div>
      )}

      {getAthSignal() === 'Bearish' && bearishReversal.entry && (
        <div className="text-sm bg-red-100/20 p-4 rounded-lg border border-red-400 space-y-1">
          <p className="font-semibold text-red-300">Suggested Trade Levels (Bearish):</p>
          <p>Entry Point: <span className="font-medium">${bearishReversal.entry.toFixed(2)}</span></p>
          <p>Stop Loss: <span className="font-medium">${bearishReversal.stopLoss.toFixed(2)}</span></p>
          <p>Take Profit: <span className="font-medium">${bearishReversal.takeProfit2.toFixed(2)} to ${bearishReversal.takeProfit1.toFixed(2)}</span></p>
        </div>
      )}
    </div>

    {/* ATL Signal Block */}
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
      <p>Gap: {computeAtlGap().toFixed(2)}%</p>
      <p>
        Signal: <span className={getAtlSignal() === 'Bearish Continuation' ? 'text-red-500 font-semibold' : 'text-green-500 font-semibold'}>
          {getAtlSignal()}
        </span>
      </p>
      <p className="text-sm text-gray-300">
        {getAtlSignal() === 'Bearish Continuation'
          ? 'Price remains under long-term pressure. Trend continuation likely unless strong reversal patterns emerge.'
          : 'Price may be rebounding from historic lows. Watch for a higher low structure and rising EMA support.'}
      </p>

      {getAtlSignal() === 'Bearish Continuation' && bearish.entry && (
        <div className="text-sm bg-red-100/20 p-4 rounded-lg border border-red-400 space-y-1">
          <p className="font-semibold text-red-300">Suggested Trade Levels (Bearish):</p>
          <p>Entry Point: <span className="font-medium">${bearish.entry.toFixed(2)}</span></p>
          <p>Stop Loss: <span className="font-medium">${bearish.stopLoss.toFixed(2)}</span></p>
          <p>Take Profit: <span className="font-medium">${bearish.takeProfit2.toFixed(2)} to ${bearish.takeProfit1.toFixed(2)}</span></p>
        </div>
      )}

      {getAtlSignal() === 'Possible Reversal' && bullishReversal.entry && (
        <div className="text-sm bg-green-100/20 p-4 rounded-lg border border-green-400 space-y-1">
          <p className="font-semibold text-green-300">Suggested Trade Levels (Bullish - Based on ATL Reversal):</p>
          <p>Entry Point: <span className="font-medium">${bullishReversal.entry.toFixed(2)}</span></p>
          <p>Stop Loss: <span className="font-medium">${bullishReversal.stopLoss.toFixed(2)}</span></p>
          <p>Take Profit: <span className="font-medium">${bullishReversal.takeProfit1.toFixed(2)} to ${bullishReversal.takeProfit2.toFixed(2)}</span></p>
        </div>
      )}
    </div>

    {/* Chart Section */}
    {chartData && (
      <div className="bg-white/90 p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">BTC Price Chart (Recent)</h2>
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#1f2937',
                titleColor: '#fff',
                bodyColor: '#d1d5db',
                borderColor: '#4b5563',
                borderWidth: 1,
                padding: 12,
              },
              title: {
                display: true,
                text: 'BTC Price Over Time',
                color: '#111827',
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 30 },
              },
            },
            scales: {
              x: {
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: { color: '#6b7280' },
              },
              y: {
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: {
                  color: '#6b7280',
                  callback: value => `$${value}`,
                },
              },
            },
            elements: {
              line: { tension: 0.4, borderColor: '#3b82f6', borderWidth: 3 },
              point: { radius: 3, backgroundColor: '#3b82f6' },
            },
          }}
        />
      </div>
    )}

    <footer className="text-sm text-center text-gray-400 pt-6 border-t border-gray-500">
      <p>
        <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
      </p>
    </footer>
  </div>
</div>
);
        }
