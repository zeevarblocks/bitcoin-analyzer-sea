export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=180&interval=hourly'
    );

    if (!res.ok) {
      throw new Error('Failed to fetch BTC data');
    }

    const data = await res.json();

    const grouped = {};

    data.prices.forEach(([timestamp, price]) => {
      const date = new Date(timestamp);
      const year = date.getUTCFullYear();
      const week = getISOWeek(date);
      const key = `${year}-W${String(week).padStart(2, '0')}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push({ price, timestamp });
    });

    const candlestickData = Object.entries(grouped).map(([weekKey, entries]) => {
      const sorted = entries.sort((a, b) => a.timestamp - b.timestamp);
      const prices = sorted.map(e => e.price);

      return {
        x: weekKey,
        o: prices[0],
        h: Math.max(...prices),
        l: Math.min(...prices),
        c: prices[prices.length - 1],
      };
    });

    return {
      datasets: [
        {
          label: 'BTC',
          data: candlestickData,
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching BTC data:', error);
    return null;
  }
}

// Utility to get ISO week number
function getISOWeek(date) {
  const tmpDate = new Date(date.getTime());
  tmpDate.setUTCDate(tmpDate.getUTCDate() + 4 - (tmpDate.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmpDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmpDate - yearStart) / 86400000) + 1) / 7);
}
