function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let emaArray = [];
  let ema = prices[0]; // Start with first close as initial EMA

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i];
    ema = i === 0 ? price : price * k + ema * (1 - k);
    emaArray.push(ema);
  }

  return emaArray;
}

export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=100'
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

    const closingPrices = candlesticks.map(c => c.c);
    const ema70 = calculateEMA(closingPrices, 70);

    const ema70Data = candlesticks.map((c, i) => ({
      x: c.x,
      y: ema70[i] || null,
    }));

    return {
      labels,
      datasets: [
        {
          label: 'BTC/USDT',
          data: candlesticks,
          type: 'candlestick',
          borderColor: '#0ea5e9',
          color: {
            up: '#22c55e',
            down: '#ef4444',
            unchanged: '#999',
          },
        },
        {
          label: 'EMA70',
          data: ema70Data,
          type: 'line',
          borderColor: '#facc15',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching candlestick data:', error);
    return null;
  }
      }
