'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  LinearScale,
  TimeScale,
  Tooltip,
  Title,
  CategoryScale,
} from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';

Chart.register(
  CandlestickController,
  CandlestickElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Title
);

const sampleData = [
  {
    x: new Date('2024-05-10'),
    o: 30000,
    h: 31000,
    l: 29500,
    c: 30500,
  },
  {
    x: new Date('2024-05-11'),
    o: 30500,
    h: 31500,
    l: 30000,
    c: 31000,
  },
];

export default function FinancialChart() {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');

    const chart = new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: [
          {
            label: 'BTC/USD',
            data: sampleData,
            borderColor: 'green',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'time',
            time: {
              tooltipFormat: 'MMM dd',
            },
          },
          y: {
            beginAtZero: false,
          },
        },
      },
    });

    return () => chart.destroy();
  }, []);

  return <canvas ref={chartRef} />;
    }
