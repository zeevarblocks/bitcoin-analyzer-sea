import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

import { fetchBTCData, fetchMarketData } from '../utils/fetchMarketData';
import {
  computeAthBreakoutSignal,
  computeAtlBreakoutSignal,
} from '../utils/ath&atlBreakout';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function BreakoutPage() {
  const [marketData, setMarketData] = useState({ currentPrice: null, ema70: null });
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const priceData = await fetchMarketData();
      const btcChart = await fetchBTCData();
      setMarketData(priceData);
      setChartData(btcChart);

      toast.success('Market data loaded!');
    }

    loadData();
  }, []);

  const athResult = computeAthBreakoutSignal({
    currentPrice: marketData.currentPrice || 73000,
    previousAth: 69000,
    ema70: marketData.ema70 || 71000,
    athBreakoutDate: '2024-03-11',
    previousAthDate: '2021-11-08',
  });

  const atlResult = computeAtlBreakoutSignal({
    currentPrice: marketData.currentPrice || 15000,
    previousAtl: 17000,
    ema70: marketData.ema70 || 19000,
    atlBreakoutDate: '2023-12-01',
    previousAtlDate: '2022-11-08',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToastContainer />

      <h1 className="text-3xl font-bold mb-4 text-blue-600">Bitcoin Breakout Dashboard</h1>

      {chartData ? (
        <Line data={chartData} />
      ) : (
        <p className="text-gray-500">Loading chart...</p>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl shadow bg-white border border-gray-200">
          <h2 className="text-xl font-semibold text-green-600">Current Market</h2>
          <p className="mt-2">Current Price: <strong>${marketData.currentPrice}</strong></p>
          <p>EMA70: <strong>${marketData.ema70}</strong></p>
        </div>

        <div className="p-4 rounded-xl shadow bg-white border border-gray-200">
          <h2 className="text-xl font-semibold text-indigo-600">ATH Breakout</h2>
          <p>Signal: <strong>{athResult.signal}</strong></p>
          <p>Weeks Since Previous ATH: {athResult.weeksSincePreviousAth}</p>
          <p>Exceeds 100 Weeks: {athResult.exceeds100Weeks ? 'Yes' : 'No'}</p>
        </div>

        <div className="p-4 rounded-xl shadow bg-white border border-gray-200 md:col-span-2">
          <h2 className="text-xl font-semibold text-red-600">ATL Breakout</h2>
          <p>Signal: <strong>{atlResult.signal}</strong></p>
          <p>Weeks Since Previous ATL: {atlResult.weeksSincePreviousAtl}</p>
          <p>Exceeds 100 Weeks: {atlResult.exceeds100Weeks ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
        }
