
import React, { useState } from 'react';

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
}

const SignalChecker = ({ signals }: { signals: Record<string, SignalData> }) => {
  const [pair, setPair] = useState('');
  const [customSignal, setCustomSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCustomSignal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/custom-signal?pair=' + pair);
      const data = await res.json();
      setCustomSignal(data.signal);
    } catch (err) {
      console.error(err);
      setCustomSignal(null);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <input
          className="border rounded p-2 text-black"
          placeholder="Enter OKX futures pair (e.g. BTC-USDT-SWAP)"
          value={pair}
          onChange={(e) => setPair(e.target.value)}
        />
        <button
          onClick={fetchCustomSignal}
          className="bg-blue-500 text-white px-3 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch'}
        </button>
      </div>

      {customSignal && (
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 shadow">
          <h2 className="text-xl font-bold text-white">{pair} Signal</h2>
          <p>📈 Trend: <span className="font-semibold">{customSignal.trend}</span></p>
          <p>
            🚀 Daily Breakout:{' '}
            <span className={customSignal.breakout ? 'text-green-400' : 'text-red-400'}>
              {customSignal.breakout ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            📉 RSI Divergence:{' '}
            <span className={customSignal.divergence ? 'text-green-400' : 'text-red-400'}>
              {customSignal.divergence ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🟠 Near/At EMA70 Divergence:{' '}
            <span className={customSignal.nearOrAtEMA70Divergence ? 'text-green-400' : 'text-red-400'}>
              {customSignal.nearOrAtEMA70Divergence ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🟣 Inferred Level within Range:{' '}
            <span className={customSignal.inferredLevelWithinRange ? 'text-green-400' : 'text-red-400'}>
              {customSignal.inferredLevelWithinRange ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🔁 EMA14 Bounce:{' '}
            <span className={customSignal.ema14Bounce ? 'text-green-400' : 'text-red-400'}>
              {customSignal.ema14Bounce ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            🟡 EMA70 Bounce:{' '}
            <span className={customSignal.ema70Bounce ? 'text-green-400' : 'text-red-400'}>
              {customSignal.ema70Bounce ? 'Yes' : 'No'}
            </span>
          </p>
          <p>
            💰 Current Price: <span className="text-blue-400">{customSignal.currentPrice.toFixed(2)}</span>
          </p>
          <p>
            📊 {customSignal.levelType?.toUpperCase()} Level:{' '}
            <span className="text-yellow-300">{customSignal.level ? customSignal.level.toFixed(2) : 'N/A'}</span>
          </p>
          <p>
            🧭 Inferred {customSignal.inferredLevelType === 'support' ? 'Support' : 'Resistance'}:{' '}
            <span className="text-purple-300">{customSignal.inferredLevel.toFixed(2)}</span>
          </p>
        </div>
      )}

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
};

export async function getServerSideProps() {
  const symbols = predefinedSymbols;
  const signals: Record<string, SignalData> = {};

  for (const symbol of symbols) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/signal?symbol=${symbol}`);
      const data = await res.json();
      if (data?.signal) {
        signals[symbol] = data.signal;
      }
    } catch (err) {
      console.error(`Error fetching signal for ${symbol}`, err);
    }
  }

  return {
    props: {
      initialSignals: signals,
    },
  };
                        }
(data?.signal) {
        signals[symbol] = data.signal;
      }
    } catch (err) {
      console.error(`Error fetching signal for ${symbol}`, err);
    }
  }

  return {
    props: {
      initialSignals: signals,
    },
  };
  }
