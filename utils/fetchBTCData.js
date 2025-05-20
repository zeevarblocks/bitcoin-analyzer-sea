// lib/fetchBTCData.js

export async function fetchBTCData() {
  const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=1'
        );

          if (!response.ok) {
              throw new Error('Failed to fetch Bitcoin data');
                }

                  const rawData = await response.json();

                    // Format for lightweight-charts
                      return rawData.map(([timestamp, open, high, low, close]) => ({
                          time: Math.floor(timestamp / 1000),
                              open,
                                  high,
                                      low,
                                          close,
                                            }));
                                            }