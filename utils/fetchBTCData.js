export async function fetchBTCData() {
  const endpoint = 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=100';

  try {
    const response = await fetch(endpoint);
    const rawData = await response.json();

    // Format data: Binance returns [time, open, high, low, close, volume, ...]
    const formattedData = rawData.map(d => ({
      time: +d[0],          // Unix timestamp in ms
      o: parseFloat(d[1]),  // Open
      h: parseFloat(d[2]),  // High
      l: parseFloat(d[3]),  // Low
      c: parseFloat(d[4]),  // Close
    }));

    return formattedData;
  } catch (error) {
    console.error('Failed to fetch BTC data:', error);
    return [];
  }
}
