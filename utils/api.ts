export async function fetchCandles(pair: string, interval: string = '1h', limit: number = 100) {
  try {
    const response = await fetch(
      `https://www.okx.com/api/v5/market/candles?instId=${pair}-USDT-SWAP&bar=${interval}&limit=${limit}`
    );
    const data = await response.json();
    if (!data.data) throw new Error('No data from API');

    return data.data.map((candle: string[]) => ({
      timestamp: parseInt(candle[0]),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));
  } catch (error) {
    console.error('fetchCandles error:', error);
    return [];
  }
}
