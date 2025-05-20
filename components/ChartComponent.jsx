'use client';

import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';

import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';

import { Chart } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { fetchBTCData } from '../utils/fetchBTCData';

// Register required chart components
ChartJS.register(
  TimeScale,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CandlestickController,
  CandlestickElement
);

export default function ChartComponent() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await fetchBTCData();
      setChartData(data);
    }

    loadData();
  }, []);

  if (!chartData) return <p>Loading chart...</p>;

  return (
    <Chart
      type='candlestick'
      data={chartData}
      options={{
        responsive: true,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
            },
          },
        },
      }}
    />
  );
}