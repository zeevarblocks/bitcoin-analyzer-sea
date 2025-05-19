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
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchBTCData().then(data => setChartData(data));
  }, []);

  const toNum = val => parseFloat(val) || 0;

  const computeAthGap = () => ((toNum(ath) - toNum(ema70)) / toNum(ema70)) * 100 || 0;
  const computeAtlGap = () => ((toNum(ema70) - toNum(atl)) / toNum(atl)) * 100 || 0;

  const getAthSignal = () => (computeAthGap() > 100 ? 'Bullish Continuation' : 'Possible Reversal');
  const getAtlSignal = () => (computeAtlGap() > 100 ? 'Bearish Continuation' : 'Possible Reversal');

  const risk = ((toNum(entry) - toNum(stopLoss)) / toNum(entry)) * 100 || 0;
  const reward = ((toNum(takeProfit) - toNum(entry)) / toNum(entry)) * 100 || 0;
  const riskRewardRatio = reward / Math.abs(risk);

  const getTradeSignal = () => {
    if (!entry || !stopLoss || !takeProfit) return 'Enter values to evaluate trade';
    if (riskRewardRatio >= 2) return 'Good R/R Setup';
    if (riskRewardRatio >= 1) return 'Moderate Setup';
    return 'Unfavorable R/R';
  };

  return (
    <div className="min-h-screen bg-cover bg-center p-6 text-gray-800" style={{ backgroundImage: 'url(/bg.png)' }}>
      <div className="max-w-4xl mx-auto bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">Bitcoin Signal Analyzer</h1>
        <p className="text-gray-700 text-center">
          Analyze Bitcoin's macro trend using ATH, ATL, EMA70, and enhance your trades with R/R entry logic.
        </p>

        {/* Instruction Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Use 1W timeframe values for ATH, ATL, and EMA70.</li>
            <li>Enter Entry, Stop Loss, and Take Profit to assess your trade setup.</li>
            <li>The tool calculates vertical price gaps and risk/reward ratios to guide your strategy.</li>
          </ul>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input type="number" placeholder="ATH" className="p-2 border rounded" onChange={e => setAth(e.target.value)} />
          <input type="number" placeholder="ATL" className="p-2 border rounded" onChange={e => setAtl(e.target.value)} />
          <input type="number" placeholder="EMA70" className="p-2 border rounded" onChange={e => setEma70(e.target.value)} />
          <input type="number" placeholder="Current Price" className="p-2 border rounded" onChange={e => setCurrentPrice(e.target.value)} />
          <input type="number" placeholder="Entry Point" className="p-2 border rounded" onChange={e => setEntry(e.target.value)} />
          <input type="number" placeholder="Stop Loss" className="p-2 border rounded" onChange={e => setStopLoss(e.target.value)} />
          <input type="number" placeholder="Take Profit" className="p-2 border rounded" onChange={e => setTakeProfit(e.target.value)} />
        </div>

        {/* ATH Analysis */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
          <p>Gap: {computeAthGap().toFixed(2)}%</p>
          <p>
            Signal:{' '}
            <span className={getAthSignal() === 'Bullish Continuation' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {getAthSignal()}
            </span>
          </p>
        </div>

        {/* ATL Analysis */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
          <p>Gap: {computeAtlGap().toFixed(2)}%</p>
          <p>
            Signal:{' '}
            <span className={getAtlSignal() === 'Bearish Continuation' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
              {getAtlSignal()}
            </span>
          </p>
        </div>

        {/* R/R Analysis */}
        <div className="space-y-2 border-t pt-4">
          <h2 className="text-xl font-semibold">Trade Risk/Reward</h2>
          <p>Risk: {Math.abs(risk).toFixed(2)}%</p>
          <p>Reward: {reward.toFixed(2)}%</p>
          <p>R/R Ratio: {riskRewardRatio.toFixed(2)}</p>
          <p>
            Setup Signal:{' '}
            <span className={riskRewardRatio >= 2 ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
              {getTradeSignal()}
            </span>
          </p>
        </div>

        {/* Chart */}
        {chartData && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">BTC Price Chart (Recent)</h2>
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
                  },
                  title: {
                    display: true,
                    text: 'BTC Price Over Time',
                    color: '#111827',
                    font: { size: 18, weight: 'bold' },
                  },
                },
                scales: {
                  x: { ticks: { color: '#6b7280' }, grid: { color: '#eee' } },
                  y: {
                    ticks: { color: '#6b7280', callback: val => `$${val}` },
                    grid: { color: '#eee' },
                  },
                },
              }}
            />
          </div>
        )}

        {/* Disclaimer */}
        <footer className="text-sm text-center text-gray-500 pt-6 border-t">
          <p>
            <strong>Disclaimer:</strong> This tool is for educational purposes only and does not constitute financial advice. Always do your own research.
          </p>
        </footer>
      </div>
    </div>
  );
  }
