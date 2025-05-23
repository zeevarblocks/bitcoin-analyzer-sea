// /utils/fetchWeeklyBTC.ts
export async function fetchBTCWeeklyCandles() {
    const url = 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=1000';

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weekly candles from Binance');

    const data = await res.json();

    // Map data into your format (timestamp, open, high, low, close, volume)
    return data.map((candle: any) => ({
        time: Number(candle[0]),              // open time (timestamp)
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
    }));
}