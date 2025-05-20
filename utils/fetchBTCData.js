export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365'
    );
    if (!res.ok) throw new Error('Failed to fetch');
    const raw = await res.json();

    // Group every 7 days into one candle (to mimic weekly OHLC)
    const prices = raw.prices;
    const ohlc = [];

    for (let i = 0; i < prices.length; i += 7) {
      const week = prices.slice(i, i + 7);
      if (week.length < 2) continue;

      const time = week[0][0];
      const o = week[0][1];
      const c = week[week.length - 1][1];
      const h = Math.max(...week.map(p => p[1]));
      const l = Math.min(...week.map(p => p[1]));

      ohlc.push({ time, o, h, l, c });
    }

    return ohlc;
  } catch (e) {
    console.error('Failed to fetch BTC data:', e);
    return [];
  }
}
