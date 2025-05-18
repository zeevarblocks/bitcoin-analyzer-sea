import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip } from 'chart.js';
import fetchBTCData from '../utils/fetchBTCData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip);

export default function Home() {
  const [ath, setAth] = useState('');
  const [atl, setAtl] = useState('');
  const [ema70, setEma70] = useState('');
  const [signal, setSignal] = useState('');
  const [btcPrices, setBtcPrices] = useState([]);

  useEffect(() => {
    fetchBTCData().then(setBtcPrices);
  }, []);

  const checkSignal = () => {
    const athNum = parseFloat(ath);
    const atlNum = parseFloat(atl);
    const emaNum = parseFloat(ema70);

    if (!athNum || !atlNum || !emaNum) {
      setSignal('Please enter all values.');
      return;
    }

    if (athNum > 2 * emaNum) {
      setSignal('Bullish Signal');
    } else if (emaNum > 2 * atlNum) {
      setSignal('Bearish Signal');
    } else {
      setSignal('Neutral');
    }
  };

  const data = {
    labels: btcPrices.map(p => p.time),
    datasets: [
      {
        label: 'BTC Price (USD)',
        data: btcPrices.map(p => p.value),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        backgroundColor: 'white',
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: 'black',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'black' },
      },
      y: {
        ticks: { color: 'black' },
      },
    },
  };

  return (
    <div className="p-4 bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4">Bitcoin Analyzer SEA</h1>
      <div className="mb-4 space-y-2">
        <input className="border p-2 w-full" placeholder="ATH" onChange={e => setAth(e.target.value)} />
        <input className="border p-2 w-full" placeholder="ATL" onChange={e => setAtl(e.target.value)} />
        <input className="border p-2 w-full" placeholder="EMA70" onChange={e => setEma70(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={checkSignal}>Check Signal</button>
        <p className="mt-2 font-semibold">{signal}</p>
      </div>
      <div className="bg-white p-4 border rounded">
        <Line data={data} options={options} />
      </div>
    </div>
  );
    }
