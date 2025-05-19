import axios from "axios";

const fetchBTCMarketData = async () => {
  try {
    const res = await axios.get(
      "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=500"
    );

    const candles = res.data.map((d) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
    }));

    // === Step 1: Calculate EMA70 ===
    const k = 2 / (70 + 1);
    let emaArray = [];
    let sum = 0;

    for (let i = 0; i < candles.length; i++) {
      const close = candles[i].close;

      if (i < 70) {
        sum += close;
        if (i === 69) {
          emaArray.push(sum / 70);
        } else {
          emaArray.push(null);
        }
      } else {
        const emaPrev = emaArray[i - 1];
        const ema = close * k + emaPrev * (1 - k);
        emaArray.push(ema);
      }
    }

    // === Step 2: Find ATH/ATL ===
    let ath = { price: 0, index: -1 };
    let atl = { price: Number.MAX_VALUE, index: -1 };

    candles.forEach((c, i) => {
      if (c.high > ath.price) {
        ath = { price: c.high, index: i };
      }
      if (c.low < atl.price) {
        atl = { price: c.low, index: i };
      }
    });

    // === Step 3: Find EMA on ATH/ATL candle ===
    const emaAtATH = emaArray[ath.index];
    const emaAtATL = emaArray[atl.index];

    return {
      athPrice: ath.price,
      athEma70: emaAtATH,
      atlPrice: atl.price,
      atlEma70: emaAtATL,
    };
  } catch (error) {
    console.error("Error fetching BTC data:", error);
    return null;
  }
};
