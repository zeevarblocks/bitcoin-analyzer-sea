export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=100'
    );

    if (!res.ok) throw new Error('Failed to fetch BTC kline data');

    const rawData = await res.json();

    const ohlc = rawData.map(item => ({
      x: new Date(item[0]),
      o: parseFloat(item[1]),
      h: parseFloat(item[2]),
      l: parseFloat(item[3]),
      c: parseFloat(item[4]),
    }));

    const closes = rawData.map(item => parseFloat(item[4]));
    const ema70 = calculateEMA(closes, 70);

    const emaLine = ema70.map((value, index) => ({
      x: new Date(rawData[index + 69][0]),
      y: value,
    }));

    return {
      datasets: [
        {
          label: 'BTC/USDT',
          data: ohlc,
          type: 'candlestick',
          color: {
            up: '#26a69a',
            down: '#ef5350',
            unchanged: '#999999',
          },
        },
        {
          label: 'EMA70',
          data: emaLine,
          type: 'line',
          borderColor: '#f59e0b',
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching BTC data:', error);
    return null;
  }
}

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  const emaArray = [];
  let ema = prices.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    emaArray.push(ema);
  }

  return emaArray;
}