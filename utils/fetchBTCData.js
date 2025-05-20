// utils/fetchBTCData.js
export async function fetchBTCData() {
  try {
      const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365'); // or your valid API URL
          if (!res.ok) throw new Error('Failed to fetch');
              const raw = await res.json();

                  // Convert to candlestick format
                      const ohlc = raw.prices.map((p, i) => ({
                            time: p[0],
                                  o: raw.prices[i][1],
                                        h: raw.prices[i][1],
                                              l: raw.prices[i][1],
                                                    c: raw.prices[i][1],
                                                        }));

                                                            return ohlc;
                                                              } catch (e) {
                                                                  console.error('Failed to fetch BTC data:', e);
                                                                      return [];
                                                                        }
                                                                        }