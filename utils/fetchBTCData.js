export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=100'
    );

    if (!res.ok) {
      throw new Error('Failed to fetch BTC data from Binance');
    }

    const rawData = await res.json();

    // Extract labels (dates) and OHLC data
    const labels = rawData.map((item: any) => {
      const date = new Date(item[0]);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const candleData = rawData.map((item: any) => ({
      x: new Date(item[0]),
      o: parseFloat(item[1]),
      h: parseFloat(item[2]),
      l: parseFloat(item[3]),
      c: parseFloat(item[4]),
    }));

    const closes = candleData.map(candle => candle.c);

    // EMA70 Calculation
    function calculateEMA(prices: number[], period = 70): number[] {
      const k = 2 / (period + 1);
      const ema = [prices[0]];
      for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[i - 1] * (1 - k));
      }
      return ema;
    }

    const ema70 = calculateEMA(closes);

    return {
      labels,
      datasets: [
        {
          label: 'Candlestick',
          data: candleData,
          type: 'candlestick',
        },
        {
          label: 'EMA70',
          data: ema70.map((value, index) => ({
            x: candleData[index]?.x,
            y: value,
          })),
          borderColor: 'orange',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          type: 'line',
        },
      ],
    };

  } catch (error) {
    console.error('Error fetching BTC candlestick data:', error);
    return null;
  }
}
