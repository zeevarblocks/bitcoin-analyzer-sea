// components/ChartComponent.jsx
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';

// Register components
ChartJS.register(
  TimeScale,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

// Chart options
const options = {
  responsive: true,
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
      },
      ticks: {
        source: 'auto',
      },
    },
    y: {
      beginAtZero: false,
    },
  },
};

export default function ChartComponent({ datasets }) {
  const data = {
    datasets: datasets || [], // fallback to empty if no data
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <Chart type="candlestick" data={data} options={options} />
    </div>
  );
}