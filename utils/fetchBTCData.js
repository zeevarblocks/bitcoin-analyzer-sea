import { ema } from 'react-financial-charts/lib/indicator';

export async function fetchBTCData() {
  const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=90'
        );
          const ohlcData = await res.json();

            const formatted = ohlcData.map(([timestamp, open, high, low, close]) => ({
                date: new Date(timestamp),
                    open, high, low, close
                      }));

                        const ema70Calc = ema()
                            .options({ windowSize: 70 })
                                .merge((d, c) => { d.ema70 = c; })
                                    .accessor(d => d.ema70);

                                      ema70Calc(formatted);

                                        return formatted;
                                        }