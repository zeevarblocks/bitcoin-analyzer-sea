export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=30'
    );

    if (!res.ok) {
      throw new Error('Failed to fetch BTC candlestick data');
    }

    const rawData = await res.json();

    const labels = rawData.map(item => {
      const date = new Date(item[0]);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const candlesticks = rawData.map(item => ({
      x: new Date(item[0]),
      o: parseFloat(item[1]),
      h: parseFloat(item[2]),
      l: parseFloat(item[3]),
      c: parseFloat(item[4]),
    }));

    return {
      labels,
      datasets: [
        {
          label: 'BTC/USDT',
          data: candlesticks,
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching candlestick data:', error);
    return null;
  }
}
