'use client';

import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchBTCData } from '../utils/fetchBTCData';
import { fetchMarketData } from '../utils/fetchMarketData';
import { computeAthBreakoutSignal, computeAtlBreakoutSignal } from '../utils/ath&atlBreakout';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function BreakoutPage() {
  const [marketData, setMarketData] = useState({ currentPrice: null, ema70: null });
  const [chartData, setChartData] = useState(null);
  const tvContainer = useRef(null);

  useEffect(() => {
    fetchBTCData().then(data => setChartData(data));
    fetchMarketData().then(data => setMarketData(data));
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;

    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          width: '100%',
          height: 500,
          symbol: 'OKX:BTCUSDT',
          interval: '60',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1e1e1e',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_okxbtc'
        });
      }
    };

    document.body.appendChild(script);
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
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4' }}>
      <h1 style={{ textAlign: 'center', color: '#0d6efd', marginBottom: '2rem', fontSize: '2rem' }}>
        Bitcoin Signal Analyzer
      </h1>

      {/* Custom Line Chart */}
      {chartData && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">BTC Price Chart (Recent)</h2>
          <Line data={chartData} options={{ responsive: true }} />
        </div>
      )}

      {/* TradingView Widget */}
      <div style={{ marginTop: '3rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Live BTC/USDT Chart (OKX)
        </h2>
        <div id="tradingview_okxbtc" ref={tvContainer} style={{ borderRadius: '8px', overflow: 'hidden' }} />
        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
          <em>Chart powered by TradingView. For informational purposes only. Not financial advice.</em>
        </p>
      </div>

      {/* Ad-Safe Placement */}
      <div style={{ margin: '2rem 0', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px' }}>
        {/* Example ad placeholder — replace with real ad component */}
        <p style={{ textAlign: 'center', color: '#888' }}>[ Advertisement Space ]</p>
      </div>

      {/* Market, ATH, and ATL Signals... (unchanged) */}
      {/* ... Your other sections here ... */}
    </div>
  );
                }
