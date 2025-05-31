// In the component SignalChecker, just render the two new fields like this:
import { useState, useEffect } from 'react';

export default function SignalChecker({ signals }: { signals: Record<string, SignalData> }) {
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
        const data = await response.json();

        const sortedPairs = data.data
          .sort((a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
          .map((item: any) => item.instId);

        setPairs(sortedPairs);

        // Find the first pair that exists in signals and has valid data
        const defaultPair = sortedPairs.find(
          (pair) => signals?.[pair]?.currentPrice !== undefined
        );
        if (defaultPair) {
          setSelectedPair(defaultPair);
        }
      } catch (error) {
        console.error('Error fetching trading pairs:', error);
      }
    };

    fetchPairs();

    const intervalId = setInterval(fetchPairs, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [signals]);

  // Filter signals based on selectedPair
  const filteredSignals =
    selectedPair && signals?.[selectedPair] ? { [selectedPair]: signals[selectedPair] } : {};

  return (
    <div className="p-6 space-y-8 bg-gradient-to-b from-gray-900 to-black min-h-screen">
      {/* Dropdown for Trading Pairs */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <label htmlFor="tradingPair" className="text-white font-semibold">
          Select Trading Pair:
        </label>
        <select
          id="tradingPair"
          className="p-2 rounded border bg-gray-800 text-white"
          value={selectedPair ?? ''}
          onChange={(e) => setSelectedPair(e.target.value === '' ? null : e.target.value)}
        >
          {pairs.filter((pair) => signals?.[pair]).map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>
      </div>

      {Object.entries(filteredSignals).map(([symbol, data]) => {
        if (!data) return null;

        return (
          <div
            key={symbol}
            className="bg-black/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10 text-white space-y-4"
          >
            <h2 className="text-2xl font-bold text-yellow-400">📡 {symbol} Signal Overview</h2>

            <div className="space-y-1">
              <p>
                💰{' '}
                <span className="font-medium text-white/70">Current Price:</span>{' '}
                <span className="text-blue-400">
                  {data.currentPrice !== undefined
                    ? `$${data.currentPrice.toFixed(2)}`
                    : 'N/A'}
                </span>
              </p>
              <p>
                📊{' '}
                <span className="font-medium text-white/70">
                  {data.levelType?.toUpperCase() ?? 'N/A'} Level:
                </span>{' '}
                <span className="text-yellow-300">
                  {data.level !== undefined ? data.level.toFixed(2) : 'N/A'}
                </span>
              </p>
              <p>
                🧭{' '}
                <span className="font-medium text-white/70">
                  Inferred{' '}
                  {data.inferredLevelType === 'support' ? 'Support' : 'Resistance'}:
                </span>{' '}
                <span className="text-purple-300">
                  {data.inferredLevel !== undefined
                    ? data.inferredLevel.toFixed(2)
                    : 'N/A'}
                </span>
              </p>
              <p>
                📈{' '}
                <span className="font-medium text-white/70">Trend:</span>{' '}
                <span className="font-semibold text-cyan-300">
                  {data.trend ?? 'N/A'}
                </span>
              </p>
            </div>

            {(data.bullishBreakout || data.bearishBreakout) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">📊 Breakout Signals</h3>
                {data.bullishBreakout && (
                  <p className="text-green-400">
                    🟢 Bullish Breakout: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.bearishBreakout && (
                  <p className="text-red-400">
                    🔴 Bearish Breakout: <span className="font-semibold">Yes</span>
                  </p>
                )}
              </div>
            )}

            {(data.bearishContinuation || data.bullishContinuation) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">🔄 Trend Continuation</h3>
                {data.bearishContinuation && (
                  <p className="text-red-400">
                    🔻 Bearish Continuation: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.bullishContinuation && (
                  <p className="text-green-400">
                    🔺 Bullish Continuation: <span className="font-semibold">Yes</span>
                  </p>
                )}
              </div>
            )}

            {(data.ema14Bounce || data.ema70Bounce || data.touchedEMA70Today) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  🧲 EMA Bounce & Zone Testing
                </h3>
                {data.ema14Bounce && (
                  <p className="text-green-400">
                    🔁 EMA14 Bounce: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.ema70Bounce && (
                  <p className="text-yellow-300">
                    🟡 EMA70 Bounce: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.touchedEMA70Today && (
                  <p className="text-blue-300">
                    🧲 EMA70 Tested Today: <span className="font-semibold">Yes</span>
                  </p>
                )}
              </div>
            )}

            {(data.divergenceFromLevel ||
              data.divergence ||
              data.nearOrAtEMA70Divergence) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">📉 RSI Divergence</h3>
                {data.divergenceFromLevel && (
                  <p className="text-pink-400">
                    🔍 Divergence vs Level: <span className="font-semibold">Yes</span>
                  </p>
                )}
                {data.divergence && (
                  <p className="text-orange-400">
                    📉 RSI High/Low Divergence:{' '}
                    <span className="font-semibold">
                      {data.divergenceType === 'bullish' ? 'Bullish' : 'Bearish'}
                    </span>
                  </p>
                )}
                {data.nearOrAtEMA70Divergence && (
                  <p className="text-violet-400">
                    🟠 EMA70 Zone Divergence: <span className="font-semibold">Yes</span>
                  </p>
                )}
              </div>
            )}

            {data.inferredLevelWithinRange && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  🧭 Inferred Key Level Range
                </h3>
                <p className="text-green-300 italic">
                  🟣 In Range Today — “Price is near a key support or resistance level.”
                </p>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                onClick={() => window.open(data.url ?? '#', '_blank')}
                className="transition-transform transform hover:-translate-y-1 hover:shadow-lg bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
                title={`Access the best ${symbol} trading signals`}
              >
                🚀 Trade Now — Access the Best Signals Here!
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
      }
