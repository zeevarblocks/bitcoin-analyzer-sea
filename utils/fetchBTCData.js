import axios from 'axios';
import { Chart as ChartJS } from 'chart.js';

export async function fetchBTCData() {
  try {
    const response = await axios.get(
      'https://api.binance.com/api/v3/klines',
      {
        params: {
          symbol: 'BTCUSDT',
          interval: '1d',
          limit: 100,
        },
      }
    );

    const rawData = response.data;

    const candlestickData = rawData.map(d => ({
      x: new Date(d[0]),
      o: parseFloat(d[1]),
      h: parseFloat(d[2]),
      l: parseFloat(d[3]),
      c: parseFloat(d[4]),
    }));

    const closingPrices = rawData.map(d => parseFloat(d[4]));
    const ema70 = calculateEMA(closingPrices, 70);

    const emaDataset = ema70.map((val, i) => ({
      x: new Date(rawData[i + 69]?.[0]), // Shifted due to EMA window
      y: val,
    }));

    return {
      datasets: [
        {
          label: 'Candlestick',
          data: candlestickData,
          type: 'candlestick',
        },
        {
          label: 'EMA70',
          data: emaDataset,
          borderColor: 'rgba(255, 255, 0, 0.8)',
          borderWidth: 1.5,
          pointRadius: 0,
          type: 'line',
        },
      ],
    };
  } catch (error) {
    console.error('Failed to fetch BTC data:', error);
    return null;
  }
}

function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const emaArray = [];

  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emaArray.push(ema);

  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    emaArray.push(ema);
  }

  return emaArray;
    }
