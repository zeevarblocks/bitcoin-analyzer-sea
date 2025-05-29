import React from 'react';

interface SignalData {
  trend: string;
  breakout: boolean;
  divergence: boolean;
  ema14Bounce: boolean;
  ema70Bounce: boolean;
  currentPrice: number;
  level: number | null;
  levelType: 'support' | 'resistance' | null;
  inferredLevel: number;
  inferredLevelType: 'support' | 'resistance';
  nearOrAtEMA70Divergence: boolean;
  inferredLevelWithinRange: boolean;
  divergenceFromLevel: boolean;
  touchedEMA70Today: boolean;
}

// The rest of your existing implementation including fetchCandles, calculateEMA, etc., stays the same.

// Add the new logic in getServerSideProps:

export async function getServerSideProps() {
  const symbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'PI-USDT', 'CORE-USDT'];
  const results: Record<string, SignalData> = {};

  for (const symbol of symbols) {
    try {
      const candles = await fetchCandles(symbol, '15m');
      const closes = candles.map(c => c.close);
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);

      const ema14 = calculateEMA(closes, 14);
      const ema70 = calculateEMA(closes, 70);
      const rsi14 = calculateRSI(closes, 14);

      const lastClose = closes.at(-1)!;
      const lastEMA14 = ema14.at(-1)!;
      const lastEMA70 = ema70.at(-1)!;

      const trend = lastEMA14 > lastEMA70 ? 'bullish' : 'bearish';

      const dailyCandles = await fetchCandles(symbol, '1d');
      const prevDay = dailyCandles.at(-2);
      const currDay = dailyCandles.at(-1);

      const dailyHigh = prevDay?.high ?? 0;
      const dailyLow = prevDay?.low ?? 0;
      const currDayHigh = currDay?.high ?? 0;
      const currDayLow = currDay?.low ?? 0;

      const prevHighIdx = highs.lastIndexOf(dailyHigh);
      const prevLowIdx = lows.lastIndexOf(dailyLow);

      const divergence =
        (highs.at(-1)! > dailyHigh && prevHighIdx !== -1 && rsi14.at(-1)! < rsi14[prevHighIdx]) ||
        (lows.at(-1)! < dailyLow && prevLowIdx !== -1 && rsi14.at(-1)! > rsi14[prevLowIdx]);

      const nearOrAtEMA70Divergence =
        divergence && (Math.abs(lastClose - lastEMA70) / lastClose < 0.002);

      const nearEMA14 = closes.slice(-3).some(c => Math.abs(c - lastEMA14) / c < 0.002);
      const nearEMA70 = closes.slice(-3).some(c => Math.abs(c - lastEMA70) / c < 0.002);
      const ema14Bounce = nearEMA14 && lastClose > lastEMA14;
      const ema70Bounce = nearEMA70 && lastClose > lastEMA70;

      const { level, type } = findRelevantLevel(ema14, ema70, closes, highs, lows, trend);
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const inferredLevel = trend === 'bullish' ? highestHigh : lowestLow;
      const inferredLevelType = trend === 'bullish' ? 'resistance' : 'support';

      const inferredLevelWithinRange =
        inferredLevel <= currDayHigh && inferredLevel >= currDayLow;

      let divergenceFromLevel = false;
      if (type && level !== null) {
        const levelIdx = closes.findIndex(c => Math.abs(c - level) / c < 0.002);
        if (
          (type === 'resistance' && lastClose > level && levelIdx !== -1 && rsi14.at(-1)! < rsi14[levelIdx]) ||
          (type === 'support' && lastClose < level && levelIdx !== -1 && rsi14.at(-1)! > rsi14[levelIdx])
        ) {
          divergenceFromLevel = true;
        }
      }

      const touchedEMA70Today =
        dailyHigh >= lastEMA70 && dailyLow <= lastEMA70 &&
        candles.some(c => Math.abs(c.close - lastEMA70) / c.close < 0.002);

      results[symbol] = {
        trend,
        breakout: highs.at(-1)! > dailyHigh || lows.at(-1)! < dailyLow,
        divergence,
        ema14Bounce,
        ema70Bounce,
        currentPrice: lastClose,
        level,
        levelType: type,
        inferredLevel,
        inferredLevelType,
        nearOrAtEMA70Divergence,
        inferredLevelWithinRange,
        divergenceFromLevel,
        touchedEMA70Today,
      };
    } catch (err) {
      console.error(`Error fetching ${symbol}:`, err);
    }
  }

  return {
    props: {
      signals: results,
    },

    export default function SignalChecker({ signals }: { signals: Record<string, SignalData> }) {
  return (
    <div className="p-4 space-y-6">
      {Object.entries(signals).map(([symbol, data]) => (
        <div key={symbol} className="bg-black/60 backdrop-blur-md rounded-xl p-4 shadow">
          <h2 className="text-xl font-bold text-white">{symbol} Signal</h2>
          <p>📈 Trend: <span className="font-semibold">{data.trend}</span></p>
          <p>
            🚀 Daily Breakout:{' '}
            <span className={data.breakout ? 'text-green-400' : 'text-red-400'}>
              {data.breakout ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            📉 RSI Divergence:{' '}
            <span className={data.divergence ? 'text-green-400' : 'text-red-400'}>
              {data.divergence ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🟠 Near/At EMA70 Divergence:{' '}
            <span className={data.nearOrAtEMA70Divergence ? 'text-green-400' : 'text-red-400'}>
              {data.nearOrAtEMA70Divergence ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🟣 Inferred Level within Range:{' '}
            <span className={data.inferredLevelWithinRange ? 'text-green-400' : 'text-red-400'}>
              {data.inferredLevelWithinRange ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🔁 EMA14 Bounce:{' '}
            <span className={data.ema14Bounce ? 'text-green-400' : 'text-red-400'}>
              {data.ema14Bounce ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🟡 EMA70 Bounce:{' '}
            <span className={data.ema70Bounce ? 'text-green-400' : 'text-red-400'}>
              {data.ema70Bounce ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            💰 Current Price: <span className="text-blue-400">{data.currentPrice.toFixed(2)}</span>
          </p>
          <p>
            📊 {data.levelType?.toUpperCase()} Level:{' '}
            <span className="text-yellow-300">{data.level ? data.level.toFixed(2) : 'N/A'}</span>
          </p>
          <p>
            🧭 Inferred {data.inferredLevelType === 'support' ? 'Support' : 'Resistance'}:{' '}
            <span className="text-purple-300">{data.inferredLevel.toFixed(2)}</span>
          </p>
<p>
  🔍 Divergence From Level:{' '}
  <span className={data.divergenceFromLevel ? 'text-green-400' : 'text-red-400'}>
    {data.divergenceFromLevel ? 'Yes' : 'No'}
  </span>
</p>
<p>
  🧲 Touched EMA70 Today:{' '}
  <span className={data.touchedEMA70Today ? 'text-green-400' : 'text-red-400'}>
    {data.touchedEMA70Today ? 'Yes' : 'No'}
  </span>
</p>
          
        </div>
      ))}
    </div>
  );
    }
  };
        }

  
