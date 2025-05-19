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

// Register Chart.js components
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
  const [chartInstance, setChartInstance] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetchBTCData().then(data => {
      if (!data || !isMounted) return;

      if (chartInstance) {
        chartInstance.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      const newChart = new Chart(ctx, {
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

      setChartInstance(newChart);
    });

    return () => {
      isMounted = false;
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  return <canvas ref={chartRef} width={800} height={400} />;
};

export default BTCChart;
