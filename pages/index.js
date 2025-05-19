'use client';
import {
  Chart as ChartJS,
  CategoryScale,
  TimeScale,
  LinearScale,
  CandlestickController,
  CandlestickElement,
  Tooltip,
  Title,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  TimeScale,
  LinearScale,
  CandlestickController,
  CandlestickElement,
  Tooltip,
  Title
);

import React, { useState, useEffect } from 'react';
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

  const getAthSignal = () => (computeAthGap() > 100 ? 'Bullish' : 'Bearish');
  const getAtlSignal = () => (computeAtlGap() > 100 ? 'Bearish' : 'Bullish');

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center">Bitcoin Signal Analyzer</h1>

        <p className="text-center text-gray-300">
          Analyze Bitcoin with 1W Timeframe: ATH, ATL, and EMA70 signals using candlestick charting.
        </p>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Enter ATH, ATL, and EMA70 based on 1W timeframe for accuracy.</li>
            <li>The chart below uses candlesticks (daily interval).</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="All-Time High (ATH)"
            className="p-2 rounded bg-gray-700 text-white border border-gray-600"
            onChange={e => setAth(e.target.value)}
          />
          <input
            type="number"
            placeholder="All-Time Low (ATL)"
            className="p-2 rounded bg-gray-700 text-white border border-gray-600"
            onChange={e => setAtl(e.target.value)}
          />
          <input
            type="number"
            placeholder="EMA70"
            className="p-2 rounded bg-gray-700 text-white border border-gray-600"
            onChange={e => setEma70(e.target.value)}
          />
          <input
            type="number"
            placeholder="Current Price"
            className="p-2 rounded bg-gray-700 text-white border border-gray-600"
            onChange={e => setCurrentPrice(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
          <p>Gap: {computeAthGap().toFixed(2)}%</p>
          <p>
            Signal:{' '}
            <span className={getAthSignal() === 'Bullish' ? 'text-green-400' : 'text-red-500'}>
              {getAthSignal()}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
          <p>Gap: {computeAtlGap().toFixed(2)}%</p>
          <p>
            Signal:{' '}
            <span className={getAtlSignal() === 'Bullish' ? 'text-green-400' : 'text-red-500'}>
              {getAtlSignal()}
            </span>
          </p>
        </div>

        {chartData && (
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-center mb-4">BTC/USDT Candlestick Chart</h2>
            <Chart
              type="candlestick"
              data={chartData}
              options={{
                responsive: true,
                scales: {
                  x: {
                    type: 'time',
                    time: { unit: 'day' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#ccc' },
                  },
                  y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                      color: '#ccc',
                      callback: value => `$${value}`,
                    },
                  },
                },
                plugins: {
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#111',
                    titleColor: '#fff',
                    bodyColor: '#ccc',
                  },
                  title: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        )}

        <footer className="text-sm text-center text-gray-500 pt-6 border-t border-gray-700">
          <p>
            <strong>Disclaimer:</strong> This app is for educational purposes only. Do your own
            research before investing.
          </p>
        </footer>
      </div>
    </div>
  );
          }
