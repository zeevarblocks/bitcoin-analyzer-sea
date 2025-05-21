import { computeAthBreakoutSignal } from '../utils/athBreakout';

export default function BreakoutPage() {
  const result = computeAthBreakoutSignal({
    currentPrice: 73000,
    previousAth: 69000,
    ema70: 71000,
    athBreakoutDate: '2024-03-11',
    previousAthDate: '2021-11-08'
  });

  return (
    <div>
      <h1>ATH Breakout Signal</h1>
      <p>Signal: {result.signal}</p>
      <p>Weeks Since Previous ATH: {result.weeksSincePreviousAth}</p>
      <p>Exceeds 100 Weeks: {result.exceeds100Weeks ? 'Yes' : 'No'}</p>
    </div>
  );
}