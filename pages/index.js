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
    <div
      className="min-h-screen bg-cover bg-center p-6"
      style={{ backgroundImage: "url('/background.jpg')" }} // Replace with your image path
    >
      <div className="bg-white bg-opacity-90 rounded-2xl max-w-3xl mx-auto shadow-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Bitcoin Signal Analyzer</h1>
        
        <p className="text-gray-600 text-center">
          Enter your data to instantly see Bitcoin signals based on All-Time High (ATH), All-Time Low (ATL), and 70 EMA. This tool helps crypto traders evaluate trend directions using smart gap logic.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          <strong>Instructions:</strong> Enter the Bitcoin values (ATH, ATL, EMA70, and Current Price). The app will calculate percentage gaps and show whether each metric gives a Bullish or Bearish signal.
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="All-Time High (ATH)" className="p-2 border rounded" onChange={e => setAth(parseFloat(e.target.value))} />
          <input type="number" placeholder="All-Time Low (ATL)" className="p-2 border rounded" onChange={e => setAtl(parseFloat(e.target.value))} />
          <input type="number" placeholder="EMA70" className="p-2 border rounded" onChange={e => setEma70(parseFloat(e.target.value))} />
          <input type="number" placeholder="Current Price" className="p-2 border rounded" onChange={e => setCurrentPrice(parseFloat(e.target.value))} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-700">ATH vs EMA70</h2>
          <p>Gap: {computeAthGap().toFixed(2)}%</p>
          <p>Signal: <span className={getAthSignal() === "Bullish" ? "text-green-600" : "text-red-600"}>{getAthSignal()}</span></p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-700">ATL vs EMA70</h2>
          <p>Gap: {computeAtlGap().toFixed(2)}%</p>
          <p>Signal: <span className={getAtlSignal() === "Bullish" ? "text-green-600" : "text-red-600"}>{getAtlSignal()}</span></p>
        </div>

        {chartData && (
          <div>
            <h2 className="text-xl font-semibold text-center text-gray-700">BTC Price Chart</h2>
            <Line data={chartData} />
          </div>
        )}

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>
            <strong>Disclaimer:</strong> This app is for educational purposes only. Cryptocurrency is volatile — always research before investing.
          </p>
        </footer>
      </div>
    </div>
  );
      }
