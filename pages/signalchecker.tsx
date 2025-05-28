
import React from 'react';


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
        </div>
      ))}
    </div>
  );
}
