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

const predefinedSymbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'PI-USDT', 'CORE-USDT'];

export default function SignalCheckerPage({ initialSignals }: { initialSignals: Record<string, SignalData> }) {
  const [signals, setSignals] = useState<Record<string, SignalData>>(initialSignals);
  const [inputSymbol, setInputSymbol] = useState('');

  const fetchSignal = async (symbol: string) => {
    const res = await fetch(`/api/signal?symbol=${symbol}`);
    const data = await res.json();
    if (data && data.signal) {
      setSignals(prev => ({ ...prev, [symbol]: data.signal }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      fetchSignal(inputSymbol.trim().toUpperCase());
    }
  };

  return (
    <div className="p-4 space-y-6">
      <form onSubmit={handleSubmit} className="mb-4 space-x-2">
        <input
          type="text"
          placeholder="Enter OKX Futures Pair (e.g. XRP-USDT-SWAP)"
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value)}
          className="p-2 rounded text-black"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Check Signal
        </button>
      </form>

      {Object.entries(signals).map(([symbol, data]) => (
        <div key={symbol} className="bg-black/60 backdrop-blur-md rounded-xl p-4 shadow">
          <h2 className="text-xl font-bold text-white">{symbol} Signal</h2>
          <p>📈 Trend: <span className="font-semibold">{data.trend}</span></p>
          <p>🚀 Daily Breakout: <span className={data.breakout ? 'text-green-400' : 'text-red-400'}>{data.breakout ? 'Yes' : 'No'}</span></p>
          <p>📉 RSI Divergence: <span className={data.divergence ? 'text-green-400' : 'text-red-400'}>{data.divergence ? 'Yes' : 'No'}</span></p>
          <p>🟠 Near/At EMA70 Divergence: <span className={data.nearOrAtEMA70Divergence ? 'text-green-400' : 'text-red-400'}>{data.nearOrAtEMA70Divergence ? 'Yes' : 'No'}</span></p>
          <p>🟣 Inferred Level within Range: <span className={data.inferredLevelWithinRange ? 'text-green-400' : 'text-red-400'}>{data.inferredLevelWithinRange ? 'Yes' : 'No'}</span></p>
          <p>🔁 EMA14 Bounce: <span className={data.ema14Bounce ? 'text-green-400' : 'text-red-400'}>{data.ema14Bounce ? 'Yes' : 'No'}</span></p>
          <p>🟡 EMA70 Bounce: <span className={data.ema70Bounce ? 'text-green-400' : 'text-red-400'}>{data.ema70Bounce ? 'Yes' : 'No'}</span></p>
          <p>💰 Current Price: <span className="text-blue-400">{data.currentPrice.toFixed(2)}</span></p>
          <p>📊 {data.levelType?.toUpperCase()} Level: <span className="text-yellow-300">{data.level ? data.level.toFixed(2) : 'N/A'}</span></p>
          <p>🧭 Inferred {data.inferredLevelType === 'support' ? 'Support' : 'Resistance'}: <span className="text-purple-300">{data.inferredLevel.toFixed(2)}</span></p>
        </div>
      ))}
    </div>
  );
}

export async function getServerSideProps() {
  const res = await fetch('http://localhost:3000/api/signal?symbols=BTC-USDT,ETH-USDT,SOL-USDT,PI-USDT,CORE-USDT');
  const data = await res.json();
  return {
    props: {
      initialSignals: data.signals,
    },
  };
    }
