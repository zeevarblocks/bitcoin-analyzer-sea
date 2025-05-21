import {
  computeAthBreakoutSignal,
  computeAtlBreakoutSignal // Updated import
} from '../utils/ath&atlBreakout';

export default function BreakoutPage() {
  const athResult = computeAthBreakoutSignal({
    currentPrice: 73000,
    previousAth: 69000,
    ema70: 71000,
    athBreakoutDate: '2024-03-11',
    previousAthDate: '2021-11-08'
  });

  const atlResult = computeAtlBreakoutSignal({ // Updated function call
    currentPrice: 15000,
    previousAtl: 17000,
    ema70: 19000,
    atlBreakoutDate: '2023-12-01', // Renamed to match updated function
    previousAtlDate: '2022-11-08'
  });

  return (
    <div>
      <h1>ATH Breakout Signal</h1>
      <p>Signal: {athResult.signal}</p>
      <p>Weeks Since Previous ATH: {athResult.weeksSincePreviousAth}</p>
      <p>Exceeds 100 Weeks: {athResult.exceeds100Weeks ? 'Yes' : 'No'}</p>

      <h1 style={{ marginTop: '2rem' }}>ATL Breakout Signal</h1>
      <p>Signal: {atlResult.signal}</p>
      <p>Weeks Since Previous ATL: {atlResult.weeksSincePreviousAtl}</p>
      <p>Exceeds 100 Weeks: {atlResult.exceeds100Weeks ? 'Yes' : 'No'}</p>
    </div>
  );
}
