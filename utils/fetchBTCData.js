export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=30'
    );

    if (!res.ok) throw new Error('Failed to fetch BTC candlestick data');

    const rawData = await res.json();

    // Format candlestick data for Chart.js Financial plugin
    const candlesticks = rawData.map(item => ({
      x: item[0], // Keep as timestamp (Chart.js handles date conversion)
      o: item[1],
      h: item[2],
      l: item[3],
      c: item[4],
    }));

    const closingPrices = candlesticks.map(c => c.c);

    // Calculate EMA
    const calculateEMA = (prices, period) => {
      const k = 2 / (period + 1);
      let emaArray = [];
      let ema = prices[0];
      for (let i = 0; i < prices.length; i++) {
        ema = i === 0 ? prices[i] : prices[i] * k + ema * (1 - k);
        emaArray.push(ema);
      }
      return emaArray;
    };

    const ema70 = calculateEMA(closingPrices, 70);

    // Format EMA line data
    const ema70Data = candlesticks.map((c, i) => ({
      x: c.x,
      y: ema70[i] || null,
    }));

    return {
      datasets: [
        {
          label: 'BTC/USDT Candlestick',
          data: candlesticks,
          type: 'candlestick',
          color: {
            up: '#16a34a',
            down: '#dc2626',
            unchanged: '#737373',
          },
        },
        {
          label: 'EMA70',
          data: ema70Data,
          type: 'line',
          borderColor: '#facc15',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching BTC data:', error);
    return null;
  }
}
