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

  const getAthSignal = () =>
    computeAthGap() > 100 ? 'Bullish Continuation' : 'Possible Reversal';
  const getAtlSignal = () =>
    computeAtlGap() > 100 ? 'Bearish Continuation' : 'Possible Reversal';

  const suggestedEntry = currentPrice ? parseFloat(currentPrice) : '';
  const suggestedSL = suggestedEntry ? (suggestedEntry * 0.98).toFixed(2) : '';
  const suggestedTP = suggestedEntry ? (suggestedEntry * 1.05).toFixed(2) : '';

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">Bitcoin Signal Analyzer</h1>

        <p className="text-gray-800 text-center">
          Analyze Bitcoin’s macro trend by measuring the vertical gap between ATH, ATL, and EMA70 on the 1W timeframe. This tool gives macro insights and suggests entry points with risk levels.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Instructions:</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Use <strong>1W timeframe</strong> data only.</li>
            <li>Input the <strong>ATH</strong>, <strong>ATL</strong>, <strong>EMA70</strong>, and optionally <strong>Current Price</strong>.</li>
            <li>The app calculates gaps and signals based on price behavior.</li>
            <li>Suggested entry, stop-loss, and take-profit levels are optional tools.</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="All-Time High (ATH)"
            className="p-2 border border-gray-300 rounded"
            onChange={e => setAth(e.target.value)}
          />
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
          <input
            type="number"
            placeholder="Current Price"
            className="p-2 border border-gray-300 rounded"
            onChange={e => setCurrentPrice(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-green-800">ATH vs EMA70</h2>
            <p className="text-gray-800">Gap: {computeAthGap().toFixed(2)}%</p>
            <p className="font-bold text-green-700">
              Signal: {getAthSignal()}
            </p>
            {currentPrice && (
              <>
                <p className="text-gray-700 mt-2">
                  Suggested Entry: <strong>${suggestedEntry}</strong>
                </p>
                <p className="text-red-600">Stop Loss: <strong>${suggestedSL}</strong></p>
                <p className="text-blue-600">Take Profit: <strong>${suggestedTP}</strong></p>
              </>
            )}
          </div>

          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-red-800">ATL vs EMA70</h2>
            <p className="text-gray-800">Gap: {computeAtlGap().toFixed(2)}%</p>
            <p className="font-bold text-red-700">
              Signal: {getAtlSignal()}
            </p>
            {currentPrice && (
              <>
                <p className="text-gray-700 mt-2">
                  Suggested Entry: <strong>${suggestedEntry}</strong>
                </p>
                <p className="text-red-600">Stop Loss: <strong>${suggestedSL}</strong></p>
                <p className="text-blue-600">Take Profit: <strong>${suggestedTP}</strong></p>
              </>
            )}
          </div>
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

        <footer className="text-sm text-center text-gray-600 pt-6 border-t border-gray-300">
          <p>
            <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always do your own research before trading.
          </p>
        </footer>
      </div>
    </div>
  );
    }
