import { fetchCandles } from '../utils/api';
import { calculateEMA, calculateRSI } from '../utils/indicators';
import { findRelevantLevel } from '../utils/signalUtils';
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
}

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
          {/* Add other data displays as needed */}
        </div>
      ))}
    </div>
  );
            }
