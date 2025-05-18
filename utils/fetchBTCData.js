const fetchBTCData = async () => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30');
    const data = await res.json();
    return data.prices.map(price => ({
      time: new Date(price[0]).toLocaleDateString(),
      value: price[1],
    }));
  } catch (error) {
    console.error('Error fetching BTC data:', error);
    return [];
  }
};

export default fetchBTCData;
