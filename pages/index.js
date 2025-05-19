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

  const getEntryPoint = () => {
    const price = parseFloat(currentPrice);
    return price ? `Around $${(price * 1.01).toFixed(2)}` : 'N/A';
  };

  const getStopLoss = () => {
    const price = parseFloat(currentPrice);
    return price ? `Around $${(price * 0.97).toFixed(2)}` : 'N/A';
  };

  const getTakeProfit = () => {
    const price = parseFloat(currentPrice);
    return price ? `Target $${(price * 1.15).toFixed(2)}` : 'N/A';
  };

  return (
    <div className="min-h-screen bg-cover bg-center p-6" style={{ backgroundImage: 'url(/bg.png)' }}>
      <div className="max-w-4xl mx-auto bg-white bg-opacity-90 rounded-xl shadow-xl p-6 space-y-6 text-gray-900">
        <h1 className="text-3xl font-bold text-center">Bitcoin Signal Analyzer</h1>

        <p className="text-center">
          Analyze the Bitcoin market using the vertical relationship between ATH, ATL, and the 70 EMA on the 1W timeframe. This tool generates a signal—either continuation or reversal—based on macro price behavior.
        </p>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Use data from the <strong>1W timeframe</strong> only for consistency.</li>
            <li>Enter the <strong>All-Time High (ATH)</strong> and <strong>70 EMA</strong> for bullish signal check.</li>
            <li>Enter the <strong>All-Time Low (ATL)</strong> and <strong>70 EMA</strong> for bearish zones.</li>
            <li>Optionally add the <strong>Current Price</strong> for entry and exit strategy estimates.</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="All-Time High (ATH)"
            className="p-3 bg-white text-gray-900 border border-gray-400 rounded shadow-sm"
            onChange={e => setAth(e.target.value)}
          />
          <input
            type="number"
            placeholder="All-Time Low (ATL)"
            className="p-3 bg-white text-gray-900 border border-gray-400 rounded shadow-sm"
            onChange={e => setAtl(e.target.value)}
          />
          <input
            type="number"
            placeholder="EMA70"
            className="p-3 bg-white text-gray-900 border border-gray-400 rounded shadow-sm"
            onChange={e => setEma70(e.target.value)}
          />
          <input
            type="number"
            placeholder="Current Price"
            className="p-3 bg-white text-gray-900 border border-gray-400 rounded shadow-sm"
            onChange={e => setCurrentPrice(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
          <p>Gap: {computeAthGap().toFixed(2)}%</p>
          <p>
            Signal: <span className={getAthSignal().includes('Bullish') ? 'text-green-600' : 'text-red-600'}>
              {getAthSignal()}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
          <p>Gap: {computeAtlGap().toFixed(2)}%</p>
          <p>
            Signal: <span className={getAtlSignal().includes('Bearish') ? 'text-red-600' : 'text-green-600'}>
              {getAtlSignal()}
            </span>
          </p>
        </div>

        <div className="space-y-2 bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold">Position Strategy</h2>
          <p><strong>Entry Point:</strong> {getEntryPoint()}</p>
          <p><strong>Stop Loss:</strong> {getStopLoss()}</p>
          <p><strong>Take Profit:</strong> {getTakeProfit()}</p>
        </div>

        {chartData && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-center mb-4">BTC Price Chart (Recent)</h2>
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

        <footer className="text-sm text-center text-gray-600 pt-6 border-t border-gray-300">
          <p>
            <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice.
          </p>
        </footer>
      </div>
    </div>
  );
  }
