'use client';
import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Title,
    LineElement,
    PointElement,
} from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js modules
ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Title,
    CandlestickController,
    CandlestickElement,
    LineElement,
    PointElement
);

export default function CandlestickChart({ data }) {
    const options = {
        responsive: true,
        scales: {
            x: {
                type: 'time',
                time: { unit: 'week' },
                ticks: { source: 'auto' },
            },
            y: {
                position: 'left',
                title: { display: true, text: 'Price (USD)' },
            },
        },
        plugins: {
            title: {
                display: true,
                text: 'Bitcoin Weekly Chart with ATH/ATL & EMA70',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
    };

    return <Chart type="candlestick" data={data} options={options} />;
}