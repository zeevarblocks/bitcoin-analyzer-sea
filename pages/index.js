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
  const [ath, setAth] = useState(0);
  const [atl, setAtl] = useState(0);
  const [ema70, setEma70] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [chartData, setChartData] = useState(null);

  const computeAthGap = () => ((ath - ema70) / ema70) * 100;
  const computeAtlGap = () => ((ema70 - atl) / atl) * 100;

  const getAthSignal = () => (computeAthGap() > 100 ? 'Bullish' : 'Bearish');
  const getAtlSignal = () => (computeAtlGap() > 100 ? 'Bearish' : 'Bullish');

  useEffect(() => {
    fetchBTCData().then(data => setChartData(data));
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center p-6" style={{ backgroundImage: 'url(/bg.png)' }}>
      <div className="max-w-4xl mx-auto bg-white bg-opacity-90 rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">Bitcoin Signal Analyzer</h1>

        <p className="text-gray-700 text-center">
          Analyze Bitcoin market trends using vertical alignment between ATH, ATL, and 70 EMA.
          Data should be based on the <strong>1W timeframe</strong>. Ideal for macro swing traders.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Instructions:</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Use weekly timeframe (1W) for ATH, ATL, and EMA70.</li>
            <li>Enter the <strong>All-Time High (ATH)</strong>, <strong>All-Time Low (ATL)</strong>, and <strong>70 EMA</strong>.</li>
            <li>Optionally enter current price for personal tracking.</li>
            <li>The tool computes vertical gaps and provides a bullish/bearish signal.</li>
            <li>BTC chart and calendar-year ATH/ATL shown below.</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="All-Time High (ATH)"
            className="p-2 border border-gray-300 rounded"
            onChange={e => setAth(parseFloat(e.target.value))}
          />
          <input
            type="number"
            placeholder="All-Time Low (ATL)"
            className="p-2 border border-gray-300 rounded"
            onChange={e => setAtl(parseFloat(e.target.value))}
          />
          <input
            type="number"
            placeholder="EMA70 (1W)"
            className="p-2 border border-gray-300 rounded"
            onChange={e => setEma70(parseFloat(e.target.value))}
          />
          <input
            type="number"
            placeholder="Current Price (optional)"
            className="p-2 border border-gray-300 rounded"
            onChange={e => setCurrentPrice(parseFloat(e.target.value))}
          />
        </div>

        <div className="space-y-2 text-gray-800">
          <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
          <p>Gap: {computeAthGap().toFixed(2)}%</p>
          <p>
            Signal:{' '}
            <span className={getAthSignal() === 'Bullish' ? 'text-green-600' : 'text-red-600'}>
              {getAthSignal()}
            </span>
          </p>
        </div>

        <div className="space-y-2 text-gray-800">
          <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
          <p>Gap: {computeAtlGap().toFixed(2)}%</p>
          <p>
            Signal:{' '}
            <span className={getAtlSignal() === 'Bullish' ? 'text-green-600' : 'text-red-600'}>
              {getAtlSignal()}
            </span>
          </p>
        </div>

        {chartData && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">
              BTC Price Chart (Recent)
            </h2>
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

        <div className="bg-white p-4 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
            Yearly Calendar ATH/ATL
          </h2>
          <table className="w-full text-left text-sm border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Year</th>
                <th className="p-2 border">ATH (USD)</th>
                <th className="p-2 border">ATL (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-2 border">2021</td><td className="p-2 border">$69,000</td><td className="p-2 border">$29,000</td></tr>
              <tr><td className="p-2 border">2022</td><td className="p-2 border">$48,000</td><td className="p-2 border">$15,600</td></tr>
              <tr><td className="p-2 border">2023</td><td className="p-2 border">$31,600</td><td className="p-2 border">$15,300</td></tr>
              <tr><td className="p-2 border">2024</td><td className="p-2 border">TBD</td><td className="p-2 border">TBD</td></tr>
            </tbody>
          </table>
        </div>

        <footer className="text-sm text-center text-gray-500 pt-6 border-t border-gray-200">
          <p>
            <strong>Disclaimer:</strong> This tool is for informational purposes only and does not
            constitute financial advice. Always do your own research.
          </p>
        </footer>
      </div>
    </div>
  );
  }
