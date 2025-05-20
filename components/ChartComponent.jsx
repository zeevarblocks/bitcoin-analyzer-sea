import React from 'react';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart as ChartJSReact } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

export default function ChartComponent({ datasets }) {
  if (!datasets || datasets.length === 0) return <p>Loading chart...</p>;

  const data = { datasets };

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'MMM dd' },
      },
      y: {
        position: 'right',
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  return <ChartJSReact type="candlestick" data={data} options={options} />;
      }
