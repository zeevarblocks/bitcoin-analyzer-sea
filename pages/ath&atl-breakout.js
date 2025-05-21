import {
  computeAthBreakoutSignal,
  computeAtlBreakoutSignal
} from '../utils/ath&atlBreakout';
import { useEffect, useState } from 'react';
import { fetchMarketData } from '../utils/fetchMarketData';

export default function BreakoutPage() {
  const [marketData, setMarketData] = useState({ currentPrice: null, ema70: null });

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
  <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa' }}>
    <h1 style={{ textAlign: 'center', color: '#007bff', marginBottom: '2rem' }}>
      Bitcoin Signal Analyzer
    </h1>

    {/* Market Data Section */}
    <div style={{
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '1.5rem',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ color: '#343a40', marginBottom: '1rem' }}>Current Market Data</h2>
      <p><strong>Current Price:</strong> ${marketData.currentPrice?.toLocaleString() || 'Loading...'}</p>
      <p><strong>EMA70:</strong> ${marketData.ema70?.toLocaleString() || 'Loading...'}</p>
    </div>

    {/* ATH Breakout Section */}
    <div style={{
      backgroundColor: '#e3fcec',
      borderLeft: '5px solid #28a745',
      borderRadius: '10px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h2 style={{ color: '#28a745', marginBottom: '1rem' }}>ATH Breakout Signal</h2>
      <p><strong>Signal:</strong> {athResult.signal}</p>
      <p><strong>Weeks Since Previous ATH:</strong> {athResult.weeksSincePreviousAth}</p>
      <p><strong>Exceeds 100 Weeks:</strong> {athResult.exceeds100Weeks ? 'Yes' : 'No'}</p>
    </div>

    {/* ATL Breakout Section */}
    <div style={{
      backgroundColor: '#fcebea',
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
