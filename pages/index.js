import React, { useEffect, useState } from 'react';
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
import { fetchBTCData } from '../utils/fetchBTCData';

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

export default function Home() {
  const [chartData, setChartData] = useState(null);
  const [ath, setAth] = useState(null);
  const [atl, setAtl] = useState(null);
  const [ema70, setEma70] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [signal, setSignal] = useState('');

  useEffect(() => {
    fetchBTCData().then(data => {
      setChartData(buildChartData(data));
      computeMetrics(data);
    });
  }, []);

  function computeMetrics(data) {
    const prices = data.map(d => d.c);
    const highs = data.map(d => d.h);
    const lows = data.map(d => d.l);
    const ema = computeEMA(prices, 70);

    const ATH = Math.max(...highs);
    const ATL = Math.min(...lows);
    const current = prices[prices.length - 1];
    const lastEMA = ema[ema.length - 1];

    setAth(ATH);
    setAtl(ATL);
    setEma70(lastEMA);
    setCurrentPrice(current);
    setSignal(getSignal(current, ATH, ATL, lastEMA));
  }

  function computeEMA(prices, period) {
    const k = 2 / (period + 1);
    let emaArray = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      const ema = prices[i] * k + emaArray[i - 1] * (1 - k);
      emaArray.push(ema);
    }

    return emaArray;
  }

  function getSignal(price, ath, atl, ema) {
    const athDist = ((ath - price) / ath) * 100;
    const atlDist = ((price - atl) / atl) * 100;

    if (price > ema && athDist < 15) {
      return 'Bullish - ATH Nearby';
    } else if (price < ema && atlDist < 15) {
      return 'Bearish - ATL Nearby';
    } else {
      return 'Neutral - No Signal';
    }
  }

  function buildChartData(data) {
    return {
      datasets: [
        {
          label: 'BTC/USD',
          data: data.map(d => ({
            x: new Date(d.time),
            o: d.o,
            h: d.h,
            l: d.l,
            c: d.c
          })),
          type: 'candlestick',
          borderColor: '#888',
          borderWidth: 1,
        },
      ]
    };
  }

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'week' },
        ticks: { source: 'auto' }
      },
      y: {
        position: 'left',
        title: { display: true, text: 'Price (USD)' }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Bitcoin Weekly Chart with ATH/ATL & EMA70'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Bitcoin Signal Analyzer</h1>

      {chartData ? (
        <Chart type="candlestick" data={chartData} options={options} />
      ) : (
        <p>Loading chart...</p>
      )}

      <div className="mt-6 space-y-2 text-lg">
        <p><strong>ATH:</strong> {ath?.toLocaleString() || 'Loading...'}</p>
        <p><strong>ATL:</strong> {atl?.toLocaleString() || 'Loading...'}</p>
        <p><strong>EMA70:</strong> {ema70?.toFixed(2) || 'Loading...'}</p>
        <p><strong>Current Price:</strong> {currentPrice?.toFixed(2) || 'Loading...'}</p>
        <p><strong>Signal:</strong> <span className="font-semibold">{signal}</span></p>
      </div>
    </div>
  );
}