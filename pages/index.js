import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
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
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow-md space-y-6">
      <h1 className="text-2xl font-bold text-center">Bitcoin Signal Analyzer</h1>
      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="All-Time High (ATH)" className="p-2 border rounded" onChange={e => setAth(parseFloat(e.target.value))} />
        <input type="number" placeholder="All-Time Low (ATL)" className="p-2 border rounded" onChange={e => setAtl(parseFloat(e.target.value))} />
        <input type="number" placeholder="EMA70" className="p-2 border rounded" onChange={e => setEma70(parseFloat(e.target.value))} />
        <input type="number" placeholder="Current Price" className="p-2 border rounded" onChange={e => setCurrentPrice(parseFloat(e.target.value))} />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
        <p>Gap: {computeAthGap().toFixed(2)}%</p>
        <p>Signal: <span className={getAthSignal() === "Bullish" ? "text-green-600" : "text-red-600"}>{getAthSignal()}</span></p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
        <p>Gap: {computeAtlGap().toFixed(2)}%</p>
        <p>Signal: <span className={getAtlSignal() === "Bullish" ? "text-green-600" : "text-red-600"}>{getAtlSignal()}</span></p>
      </div>

      {chartData && (
        <div>
          <h2 className="text-xl font-semibold text-center">BTC Price Chart</h2>
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
      }
