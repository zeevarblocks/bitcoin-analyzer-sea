import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import {
  CandlestickController,
  CandlestickElement,
} from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { fetchBTCData } from '../utils/fetchBTCData';

// Register Chart.js components (do this only once globally or here)
Chart.register(
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  LineElement,
  PointElement
);

const BTCChart = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null); // useRef is better here than useState

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      const data = await fetchBTCData();
      if (!data || !isMounted) return;

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');

      chartInstanceRef.current = new Chart(ctx, {
        type: 'candlestick',
        data: {
          datasets: data.datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day',
              },
              ticks: { maxRotation: 0 },
            },
            y: {
              beginAtZero: false,
            },
          },
        },
      });
    };

    renderChart();

    return () => {
      isMounted = false;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []); // No chartInstance dependency needed now

  return <canvas ref={chartRef} width={800} height={400} />;
};

export default BTCChart;
