export async function fetchCandles(symbol: string, interval: string): Promise<any[]> {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
  );
  const data = await response.json();
  return data.map((item: any[]) => ({
    time: item[0],
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5]),
  }));
}
