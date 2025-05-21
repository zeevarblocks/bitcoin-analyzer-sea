import { computeAthBreakoutSignal, computeAtlBreakoutSignal } from '../utils/ath&atlBreakout'; import { useEffect, useState } from 'react'; import { fetchMarketData } from '../utils/fetchMarketData';

export default function BreakoutPage() { const [marketData, setMarketData] = useState({ currentPrice: null, ema70: null });

useEffect(() => { async function getData() { const data = await fetchMarketData(); setMarketData(data); } getData(); }, []);

const athResult = computeAthBreakoutSignal({ currentPrice: marketData.currentPrice || 73000, previousAth: 69000, ema70: marketData.ema70 || 71000, athBreakoutDate: '2024-03-11', previousAthDate: '2021-11-08' });

const atlResult = computeAtlBreakoutSignal({ currentPrice: marketData.currentPrice || 15000, previousAtl: 17000, ema70: marketData.ema70 || 19000, atlBreakoutDate: '2023-12-01', previousAtlDate: '2022-11-08' });

return ( <div> <h1>Bitcoin Market Data</h1> <p>Current Price: ${marketData.currentPrice}</p> <p>EMA70: ${marketData.ema70}</p>

<h1>ATH Breakout Signal</h1>
  <p>Signal: {athResult.signal}</p>
  <p>Weeks Since Previous ATH: {athResult.weeksSincePreviousAth}</p>
  <p>Exceeds 100 Weeks: {athResult.exceeds100Weeks ? 'Yes' : 'No'}</p>

  <h1 style={{ marginTop: '2rem' }}>ATL Breakout Signal</h1>
  <p>Signal: {atlResult.signal}</p>
  <p>Weeks Since Previous ATL: {atlResult.weeksSincePreviousAtl}</p>
  <p>Exceeds 100 Weeks: {atlResult.exceeds100Weeks ? 'Yes' : 'No'}</p>
</div>

); }
  
