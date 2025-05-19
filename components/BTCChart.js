import React, { useRef, useEffect } from 'react';
import {
  Chart,
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

// Register necessary chart elements
Chart.register(
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

const BTCChart = () => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');

    chartRef.current = new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: [
          {
            label: 'BTC Price',
            data: [
              { x: new Date('2023-01-01'), o: 20000, h: 22000, l: 19000, c: 21000 },
              { x: new Date('2023-01-02'), o: 21000, h: 23000, l: 20500, c: 22500 },
              { x: new Date('2023-01-03'), o: 22500, h: 24000, l: 21500, c: 22000 },
            ],
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day' },
          },
          y: {
            beginAtZero: false,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} />;
};

export default BTCChart;
