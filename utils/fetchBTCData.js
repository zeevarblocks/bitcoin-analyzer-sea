export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=30'
    );

    if (!res.ok) {
      throw new Error('Failed to fetch BTC candlestick data');
    }

    const rawData = await res.json();

    const candlesticks = rawData.map(item => ({
      x: new Date(item[0]),
      o: item[1],
      h: item[2],
      l: item[3],
      c: item[4],
    }));

    const labels = candlesticks.map(c => {
      const date = new Date(c.x);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'BTC/USD',
          data: candlesticks,
          type: 'candlestick',
          color: {
            up: '#22c55e',
            down: '#ef4444',
            unchanged: '#999',
          },
          borderColor: '#0ea5e9',
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching BTC candlestick data:', error);
    return null;
  }
}
