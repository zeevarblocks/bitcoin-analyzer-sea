import {
  Chart,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
  Legend
} from 'chart.js';

import {
  CandlestickController,
  CandlestickElement
} from 'chartjs-chart-financial';

import 'chartjs-chart-financial'; // This is important — loads prototype extensions

Chart.register(
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
  Legend,
  CandlestickController,
  CandlestickElement
);


import { Chart as ChartJS } from 'react-chartjs-2';
import { fetchBTCData } from '../utils/fetchBTCData';

import {
  computeAthBreakoutSignal,
  computeAtlBreakoutSignal
} from '../utils/ath&atlBreakout';
import { useEffect, useState } from 'react';
import { fetchMarketData } from '../utils/fetchMarketData';

export default function BreakoutPage() {
  const [marketData, setMarketData] = useState({ currentPrice: null, ema70: null });
  const [chartData, setChartData] = useState(null);


  useEffect(() => {
    fetchBTCData().then(data => setChartData(data));
  }, []);

  useEffect(() => {
    async function getData() {
      const data = await fetchMarketData();
      setMarketData(data);
    }
    getData();
  }, []);

  const athResult = computeAthBreakoutSignal({
    currentPrice: marketData.currentPrice || 73000,
    previousAth: 69000,
    ema70: marketData.ema70 || 71000,
    athBreakoutDate: '2024-03-11',
    previousAthDate: '2021-11-08'
  });

  const atlResult = computeAtlBreakoutSignal({
    currentPrice: marketData.currentPrice || 15000,
    previousAtl: 17000,
    ema70: marketData.ema70 || 19000,
    atlBreakoutDate: '2023-12-01',
    previousAtlDate: '2022-11-08'
  });

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f4f4f4',
      color: '#212529',
      lineHeight: '1.6',
      fontSize: '1.05rem'
    }}>

      <h1 style={{
        textAlign: 'center',
        color: '#0d6efd',
        marginBottom: '2rem',
        fontSize: '2rem'
      }}>
        Bitcoin Signal Analyzer
      </h1>

      {/* Chart Section */}
      {chartData && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">BTC Price Chart (Recent)</h2>
          <ChartJS
            type="candlestick"
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                },
                title: {
                  display: true,
                  text: 'BTC Candlestick Chart',
                  font: { size: 18 }
                },
              },
              scales: {
                x: {
                  type: 'time',
                  time: {
                    unit: 'day',
                    tooltipFormat: 'MMM dd',
                  },
                  ticks: { color: '#6b7280' },
                  grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y: {
                  ticks: {
                    callback: value => `$${value}`,
                    color: '#6b7280',
                  },
                  grid: { color: 'rgba(0, 0, 0, 0.05)' }
                }
              }
            }}
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
            }}
          />
        </div>
      )}

      {/* Market Data Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '1.5rem',
        boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#212529', marginBottom: '1rem' }}>Current Market Data</h2>
        <p><strong>Current Price:</strong> ${marketData.currentPrice?.toLocaleString() || 'Loading...'}</p>
        <p><strong>EMA70:</strong> ${marketData.ema70?.toLocaleString() || 'Loading...'}</p>
      </div>

      {/* ATH Breakout Section */}
      <div style={{
        backgroundColor: '#eafaf1',
        borderLeft: '5px solid #198754',
        borderRadius: '10px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#198754', marginBottom: '1rem' }}>ATH Breakout Signal</h2>
        <p><strong>Signal:</strong> {athResult.signal}</p>
        <p><strong>Weeks Since Previous ATH:</strong> {athResult.weeksSincePreviousAth}</p>
        <p><strong>Exceeds 100 Weeks:</strong> {athResult.exceeds100Weeks ? 'Yes' : 'No'}</p>
      </div>

      {/* ATL Breakout Section */}
      <div style={{
        backgroundColor: '#fbeaea',
        borderLeft: '5px solid #dc3545',
        borderRadius: '10px',
        padding: '1.5rem'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>ATL Breakout Signal</h2>
        <p><strong>Signal:</strong> {atlResult.signal}</p>
        <p><strong>Weeks Since Previous ATL:</strong> {atlResult.weeksSincePreviousAtl}</p>
        <p><strong>Exceeds 100 Weeks:</strong> {atlResult.exceeds100Weeks ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
