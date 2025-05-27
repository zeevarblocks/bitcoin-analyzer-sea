// pages/trading-zones.js
import { useEffect, useState } from "react";
import { EMA, RSI } from "technicalindicators";

export default function TradingZones() {
  const [zones, setZones] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch 15-min candlestick data from OKX API
      const response = await fetch(
        "https://www.okx.com/api/v5/market/candles?instId=BTC-USDT&bar=15m&limit=200"
      );
      const data = await response.json();
      const candles = data.data.map(candle => ({
        time: Number(candle[0]),
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
      })).reverse(); // oldest first

      const closes = candles.map(c => c.close);

      // 2. Calculate EMAs
      const ema14 = EMA.calculate({ period: 14, values: closes });
      const ema17 = EMA.calculate({ period: 17, values: closes });
      const ema70 = EMA.calculate({ period: 70, values: closes });

      // Pad EMAs for alignment
      const pad = closes.length - ema14.length;
      const ema14Full = Array(pad).fill(null).concat(ema14);
      const ema17Full = Array(pad).fill(null).concat(ema17);
      const ema70Full = Array(pad).fill(null).concat(ema70);

      // 3. Calculate RSI
      const rsiValues = RSI.calculate({ period: 14, values: closes });
      const rsiFull = Array(closes.length - rsiValues.length).fill(null).concat(rsiValues);

      // 4. Get previous daily high and low
      const dailyResponse = await fetch(
        "https://www.okx.com/api/v5/market/history-candles?instId=BTC-USDT&bar=1D&limit=2"
      );
      const dailyData = await dailyResponse.json();
      const prevDailyHigh = Number(dailyData.data[1][2]);
      const prevDailyLow = Number(dailyData.data[1][3]);

      // 5. Analyze current candle
      const lastIdx = closes.length - 1;

      const bullish = ema14Full[lastIdx] > ema17Full[lastIdx] && ema14Full[lastIdx] > ema70Full[lastIdx];
      const bearish = ema14Full[lastIdx] < ema17Full[lastIdx] && ema14Full[lastIdx] < ema70Full[lastIdx];

      // 6. Detect previous EMA14/EMA70 cross (resistance/support reference)
      let lastCross = null;
      for (let i = lastIdx - 1; i >= 0; i--) {
        if (
          (ema14Full[i] < ema70Full[i] && ema14Full[i + 1] > ema70Full[i + 1]) ||
          (ema14Full[i] > ema70Full[i] && ema14Full[i + 1] < ema70Full[i + 1])
        ) {
          lastCross = {
            price: closes[i + 1],
            time: new Date(candles[i + 1].time).toLocaleString(),
          };
          break;
        }
      }

      // 7. Check divergence (simple example)
      const priceDir = closes[lastIdx] - closes[lastIdx - 1];
      const rsiDir = rsiFull[lastIdx] - rsiFull[lastIdx - 1];
      const divergence = (priceDir > 0 && rsiDir < 0) || (priceDir < 0 && rsiDir > 0);

      // 8. Daily high/low breakout
      const highBreakout = closes[lastIdx] > prevDailyHigh;
      const lowBreakout = closes[lastIdx] < prevDailyLow;

      // 9. EMA14 bounce detection
      const bounceZone = closes[lastIdx] > ema14Full[lastIdx] && closes[lastIdx - 1] < ema14Full[lastIdx - 1];

      // 10. Define buy/sell zones with SL & TP
      let zone = null;
      if (bullish && bounceZone) {
        const entry = ema14Full[lastIdx];
        zone = {
          type: "Buy",
          entry,
          stopLoss: entry * 0.99, // SL 1% below EMA14
          takeProfit: [entry * 1.4, entry * 1.6], // 40-60% TP
        };
      } else if (bearish && bounceZone) {
        const entry = ema14Full[lastIdx];
        zone = {
          type: "Sell",
          entry,
          stopLoss: entry * 1.01, // SL 1% above EMA14
          takeProfit: [entry * 0.6, entry * 0.4], // 40-60% TP
        };
      }

      setZones({
        trend: bullish ? "Bullish" : bearish ? "Bearish" : "Sideways",
        divergence,
        highBreakout,
        lowBreakout,
        lastCross,
        bounceZone,
        zone,
      });
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 font-mono">
      <h1 className="text-2xl font-bold mb-4">Trading Zones (15m)</h1>
      {zones ? (
        <div className="space-y-2">
          <p>Trend: {zones.trend}</p>
          <p>Divergence: {zones.divergence ? "Yes" : "No"}</p>
          <p>High Breakout: {zones.highBreakout ? "Yes" : "No"}</p>
          <p>Low Breakout: {zones.lowBreakout ? "Yes" : "No"}</p>
          {zones.lastCross && (
            <p>Last EMA Cross: {zones.lastCross.price} at {zones.lastCross.time}</p>
          )}
          <p>EMA14 Bounce Zone: {zones.bounceZone ? "Yes" : "No"}</p>
          {zones.zone ? (
            <div className="border border-green-500 p-2 rounded">
              <p>Zone Type: {zones.zone.type}</p>
              <p>Entry: {zones.zone.entry.toFixed(2)}</p>
              <p>Stop Loss: {zones.zone.stopLoss.toFixed(2)}</p>
              <p>Take Profit: {zones.zone.takeProfit.map(tp => tp.toFixed(2)).join(" / ")}</p>
            </div>
          ) : (
            <p>No valid zone detected.</p>
          )}
        </div>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
                                   }
