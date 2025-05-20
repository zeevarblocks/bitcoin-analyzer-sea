export async function fetchBTCData() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily'
    );

    if (!res.ok) {
      throw new Error('Failed to fetch BTC data');
    }

    const data = await res.json();

    const labels = data.prices.map(price => {
      const date = new Date(price[0]);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const prices = data.prices.map(price => price[1]);

    return {
      labels,
      datasets: [
        {
          label: 'BTC/USD',
          data: prices,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };

  } catch (error) {
    console.error('Error fetching BTC data:', error);
    return null;
  }
}


