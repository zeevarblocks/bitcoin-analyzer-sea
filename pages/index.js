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

  return (
    <div className="min-h-screen bg-cover bg-center p-6 text-gray-800" style={{ backgroundImage: 'url(/bg.png)' }}>
      <div className="max-w-4xl mx-auto bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">Bitcoin Signal Analyzer</h1>

        <p className="text-gray-700 text-center">
          Analyze the Bitcoin market using the vertical relationship between ATH, ATL, and the 70 EMA on the 1W timeframe. This tool generates a signal—either bullish continuation or possible reversal—based on macro price behavior.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Instructions:</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Use data from the <strong>1W timeframe</strong> only for consistency.</li>
            <li>Enter the <strong>All-Time High (ATH)</strong> and <strong>70 EMA</strong> together to check macro bullish signals.</li>
            <li>Enter the <strong>All-Time Low (ATL)</strong> and <strong>70 EMA</strong> together to analyze bearish potential zones.</li>
            <li>The tool calculates percentage gaps and suggests a bullish continuation or possible reversal signal.</li>
            <li>Optionally add the <strong>current price</strong> for your own tracking context.</li>
            <li>Check the live BTC chart below for trend confirmation and historical data reference.</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="All-Time High (ATH)" className="p-2 border border-gray-300 rounded" onChange={e => setAth(e.target.value)} />
          <input type="number" placeholder="All-Time Low (ATL)" className="p-2 border border-gray-300 rounded" onChange={e => setAtl(e.target.value)} />
          <input type="number" placeholder="EMA70" className="p-2 border border-gray-300 rounded" onChange={e => setEma70(e.target.value)} />
          <input type="number" placeholder="Current Price" className="p-2 border border-gray-300 rounded" onChange={e => setCurrentPrice(e.target.value)} />
        </div>

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
        </div>

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
        </div>

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
              style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
              }}
            />
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
