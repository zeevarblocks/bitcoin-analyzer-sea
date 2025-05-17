export async function fetchBTCData() {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30');
  const data = await res.json();

  return {
    labels: data.prices.map(p => new Date(p[0]).toLocaleDateString()),
    datasets: [{
      label: 'BTC Price (30D)',
      data: data.prices.map(p => p[1]),
      borderColor: 'rgba(34, 197, 94, 1)',
      fill: false
    }]
  };
}
