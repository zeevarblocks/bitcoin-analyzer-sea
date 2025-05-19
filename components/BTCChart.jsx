import React, { useEffect, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  CandlestickController,
  CandlestickElement,
} from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { fetchBTCData } from '../utils/fetchBTCData';

ChartJS.register(
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

const BTCChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchBTCData().then(data => setChartData(data));
  }, []);

  if (!chartData) return <div>Loading BTC Chart...</div>;

  return (
    <Chart
      type="candlestick"
      data={chartData}
      options={{
        responsive: true,
        scales: {
          x: { type: 'time' },
        },
      }}
    />
  );
};

export default BTCChart;
