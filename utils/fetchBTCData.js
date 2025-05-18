// utils/fetchBTCData.js
import axios from 'axios';

export async function fetchBTCData() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
      {
        params: {
          vs_currency: 'usd',
          days: 30,
          interval: 'daily',
        },
      }
    );

    const data = response.data;

    return {
      labels: data.prices.map(p => new Date(p[0]).toLocaleDateString()),
      datasets: [
        {
          label: 'BTC Price (USD)',
          data: data.prices.map(p => p[1]),
          borderColor: '#3b82f6',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  } catch (error) {
    console.error('Failed to fetch BTC data:', error);
    return null;
  }
}
