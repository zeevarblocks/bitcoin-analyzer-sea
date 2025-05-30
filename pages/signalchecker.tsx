
import React, { useEffect, useState } from 'react';

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function getUTCWindowForPHT(): { from: number; to: number } {
  const now = new Date();
  const phtOffset = 8 * 60 * 60 * 1000;

  const todayPHT = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 45);
  const from = todayPHT.getTime() - phtOffset - 24 * 60 * 60 * 1000;
  const to = todayPHT.getTime() - phtOffset;

  return { from, to };
}

async function fetchCandlesInRange(symbol: string, interval: string, from: number, to: number): Promise<Candle[]> {
  let allCandles: Candle[] = [];
  let fetchAfter = from;

  while (fetchAfter < to) {
    const response = await fetch(
      \`https://www.okx.com/api/v5/market/candles?instId=\${symbol}&bar=\${interval}&after=\${fetchAfter}&limit=1000\`
    );
    const json = await response.json();
    const raw = json.data;
    if (!raw || raw.length === 0) break;

    const candles: Candle[] = raw.map((d: string[]) => ({
      timestamp: +d[0],
      open: +d[1],
      high: +d[2],
      low: +d[3],
      close: +d[4],
      volume: +d[5],
    }));

    allCandles = allCandles.concat(candles.reverse());
    const lastTs = candles[candles.length - 1].timestamp;
    fetchAfter = lastTs + 60_000;
  }

  return allCandles.filter(c => c.timestamp >= from && c.timestamp <= to);
}

function getHighLow(candles: Candle[]): { high: number; low: number } {
  let high = -Infinity;
  let low = Infinity;

  for (const c of candles) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }

  return { high, low };
}

const BTCPriceRange: React.FC = () => {
  const [range, setRange] = useState<{ high: number; low: number } | null>(null);

  useEffect(() => {
    async function getRange() {
      const { from, to } = getUTCWindowForPHT();
      const candles = await fetchCandlesInRange('BTC-USDT', '1m', from, to);
      const { high, low } = getHighLow(candles);
      setRange({ high, low });
    }
    getRange();
  }, []);

  return (
    <div>
      <h2>BTC High/Low (PHT 7:45 AM Yesterday to Today)</h2>
      {range ? (
        <div>
          <p>🔼 High: {range.high}</p>
          <p>🔽 Low: {range.low}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BTCPriceRange;
