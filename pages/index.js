import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Legend,
  Tooltip,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Legend, Tooltip);

export default function Home() {
  // Example data — replace with your real historical BTC weekly data
  const labels = [
    'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5',
    'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'
  ];

  const btcPrice = [45000, 47000, 49000, 52000, 51000, 53000, 55000, 57000, 60000, 62000];
  const ema70 = [44000, 45500, 46800, 48000, 49500, 51000, 52500, 54000, 55500, 57000];
  const ath = new Array(10).fill(62000);
  const atl = new Array(10).fill(17000);

  const data = {
    labels,
    datasets: [
      {
        label: 'BTC Price',
        data: btcPrice,
        borderColor: '#f7931a',
        backgroundColor: '#f7931a',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'EMA70',
        data: ema70,
        borderColor: '#1e90ff',
        backgroundColor: '#1e90ff',
        borderDash: [5, 5],
        tension: 0.3,
        fill: false,
      },
      {
        label: 'ATH (1W)',
        data: ath,
        borderColor: '#00ff00',
        borderDash: [10, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'ATL (1W)',
        data: atl,
        borderColor: '#ff0000',
        borderDash: [10, 5],
        pointRadius: 0,
        fill: false,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#fff'
        }
      },
      title: {
        display: true,
        text: 'Bitcoin Weekly Price Chart with EMA70, ATH, and ATL',
        color: '#fff',
        font: {
          size: 18
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        ticks: { color: '#ccc' },
        grid: { color: '#444' }
      },
      y: {
        ticks: { color: '#ccc' },
        grid: { color: '#444' }
      }
    }
  };

  return (
    <div className="main-content">
      <h1>Bitcoin Analyzer</h1>
      <div style={{ background: '#111', padding: '2rem', borderRadius: '16px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
    }
