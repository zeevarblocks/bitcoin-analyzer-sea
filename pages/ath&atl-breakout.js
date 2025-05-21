import {
  computeAthBreakoutSignal,
  computeAtlBreakoutSignal
} from '../utils/ath&atlBreakout';
import { useEffect, useState } from 'react';
import { fetchMarketData } from '../utils/fetchMarketData';

export default function BreakoutPage() {
  const [marketData, setMarketData] = useState({ currentPrice: null, ema70: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      const data = await fetchMarketData();
      setMarketData(data);
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white text-xl">
        Loading market data...
      </div>
    );
  }

  const athResult = computeAthBreakoutSignal({
    currentPrice: marketData.currentPrice,
    previousAth: 69000,
    ema70: marketData.ema70,
    athBreakoutDate: '2024-03-11',
    previousAthDate: '2021-11-08'
  });

  const atlResult = computeAtlBreakoutSignal({
    currentPrice: marketData.currentPrice,
    previousAtl: 17000,
    ema70: marketData.ema70,
    atlBreakoutDate: '2023-12-01',
    previousAtlDate: '2022-11-08'
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Bitcoin Breakout Analysis</h1>

      <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Market Data</h2>
        <p className="mb-2">Current Price: <span className="text-green-400">${marketData.currentPrice.toLocaleString()}</span></p>
        <p>EMA70: <span className="text-blue-400">${marketData.ema70.toLocaleString()}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">ATH Breakout Signal</h2>
          <p className="mb-2">Signal: <span className="font-medium text-white">{athResult.signal}</span></p>
          <p className="mb-2">Weeks Since Previous ATH: <span>{athResult.weeksSincePreviousAth}</span></p>
          <p>Exceeds 100 Weeks: <span>{athResult.exceeds100Weeks ? 'Yes' : 'No'}</span></p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-red-400">ATL Breakout Signal</h2>
          <p className="mb-2">Signal: <span className="font-medium text-white">{atlResult.signal}</span></p>
          <p className="mb-2">Weeks Since Previous ATL: <span>{atlResult.weeksSincePreviousAtl}</span></p>
          <p>Exceeds 100 Weeks: <span>{atlResult.exceeds100Weeks ? 'Yes' : 'No'}</span></p>
        </div>
      </div>
    </div>
  );
}
