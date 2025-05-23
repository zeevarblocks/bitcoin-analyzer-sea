import React, { useState, useEffect } from 'react';

export default function Home() {
  const [ath, setAth] = useState(null);
  const [atl, setAtl] = useState(null);
  const [ema70, setEma70] = useState('');
  const [loading, setLoading] = useState(true);
  const [weeklyCandles, setWeeklyCandles] = useState([]);

  useEffect(() => {
    const fetchBTCWeeklyCandles = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=200");
        if (!res.ok) throw new Error("Failed to fetch weekly candles");
        const data = await res.json();
        const formatted = data.map((candle) => ({
          time: Number(candle[0]),
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5]),
        }));

        const ema14 = calculateEMA(formatted, 14);
        const ema70 = calculateEMA(formatted, 70);

        const candlesWithEma = formatted.map((candle, idx) => ({
          ...candle,
          ema14: ema14[idx] || 0,
          ema70: ema70[idx] || 0,
        }));

        setWeeklyCandles(candlesWithEma);
      } catch (err) {
        console.error("Error loading candles:", err);
      }
    };

    fetchBTCWeeklyCandles();
  }, []);

  useEffect(() => {
    if (weeklyCandles.length > 0) {
      const lastEma = weeklyCandles[weeklyCandles.length - 1].ema70;
      if (lastEma && lastEma > 0) setEma70(lastEma.toFixed(2));
    }
  }, [weeklyCandles]);

  const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    let emaArray = [];
    let ema = data.slice(0, period).reduce((sum, val) => sum + val.close, 0) / period;
    emaArray[period - 1] = ema;

    for (let i = period; i < data.length; i++) {
      ema = data[i].close * k + ema * (1 - k);
      emaArray[i] = ema;
    }

    return emaArray;
  };

  const findValidATL = (data) => {
    if (!data || data.length < 100) return null;
    const last100 = data.slice(-100);
    const validBearishCandles = last100.filter(candle => candle.ema14 < candle.ema70);
    if (validBearishCandles.length === 0) return null;
    let lowest = validBearishCandles[0].low;
    validBearishCandles.forEach(candle => {
      if (candle.low < lowest) lowest = candle.low;
    });
    return lowest;
  };

  const findValidATH = (data) => {
    if (!data || data.length < 100) return null;
    const last100 = data.slice(-100);
    const validBullishCandles = last100.filter(candle => candle.ema14 > candle.ema70);
    if (validBullishCandles.length === 0) return null;
    let highest = validBullishCandles[0].high;
    validBullishCandles.forEach(candle => {
      if (candle.high > highest) highest = candle.high;
    });
    return highest;
  };

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin');
        const data = await res.json();
        setAth(data.market_data.ath.usd);
        setAtl(data.market_data.atl.usd);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMarketData();
  }, []);

  const athNum = parseFloat(ath);
  const atlNum = parseFloat(atl);
  const emaNum = parseFloat(ema70);
  const isValid = !isNaN(emaNum) && emaNum > 0;

  const atlWeeklyNum = findValidATL(weeklyCandles);
  const athWeeklyNum = findValidATH(weeklyCandles);
  const isValidAtl = atlWeeklyNum !== null;
  const isValidAth = athWeeklyNum !== null;

  const athGap = isValid && isValidAth ? ((athNum - emaNum) / emaNum) * 100 : 0;
  const atlGap = isValid && isValidAtl ? ((emaNum - atlWeeklyNum) / atlWeeklyNum) * 100 : 0;

  const getAthSignal = () => (athGap > 100 ? 'Bullish Continuation' : 'Possible Reversal');
  const getAtlSignal = () => (atlGap > 100 ? 'Bearish Continuation' : 'Possible Reversal');


const computeBullishLevels = () => {
        const ema = parseFloat(ema70);
        const athNum = parseFloat(ath);
        if (isNaN(ema) || isNaN(athNum)) return {};
        return {
            entry: ema * 1.02,
            stopLoss: ema * 0.97,
            takeProfit1: athNum * 0.98,
            takeProfit2: athNum * 1.05,
        };
    };

    const computeBearishLevels = () => {
        const ema = parseFloat(ema70);
        const atlNum = parseFloat(atl);
        if (isNaN(ema) || isNaN(atlNum)) return {};
        return {
            entry: ema * 0.98,
            stopLoss: ema * 1.03,
            takeProfit1: atlNum * 1.02,
            takeProfit2: atlNum * 0.95,
        };
    };
    const computeBullishReversalFromAtl = () => {
        const atlNum = parseFloat(atl);
        const ema = parseFloat(ema70);
        if (isNaN(atlNum) || isNaN(ema)) return {};
        return {
            entry: atlNum * 1.02,       // Entry just above ATL
            stopLoss: atlNum * 0.97,    // SL below ATL
            takeProfit1: atlNum * 1.10, // TP1: 10% above ATL
            takeProfit2: atlNum * 1.20, // TP2: 20% above ATL
        };
    };


    const computeBearishReversalFromAth = () => {
        const athNum = parseFloat(ath);
        const ema = parseFloat(ema70);
        if (isNaN(athNum) || isNaN(ema)) return {};
        return {
            entry: athNum * 0.98,         // Entry just below ATH
            stopLoss: athNum * 1.03,      // SL above ATH
            takeProfit1: athNum * 0.90,   // TP1 10% below ATH
            takeProfit2: athNum * 0.80,   // TP2 20% below ATH
        };
    };


    const bullishReversal = computeBullishReversalFromAtl();
    const bearishReversal = computeBearishReversalFromAth();

    const bullish = computeBullishLevels();
    const bearish = computeBearishLevels();

return ( <div className="p-6 space-y-6"> <h1 className="text-3xl font-bold text-center text-gray-900">Bitcoin Signal Analyzer</h1> <p className="text-gray-700 text-center"> Analyze the Bitcoin market using ATH, ATL, and the 70 EMA on the 1W timeframe. </p>

<div className="space-y-6 bg-gray-950 p-6 rounded-xl text-white">
    <div className="bg-gray-900 p-4 rounded-lg border border-blue-600">
      <h2 className="text-lg font-semibold text-blue-400 mb-2">Mock EMA70 Input</h2>
      <input
        type="number"
        placeholder="EMA70 (Manual Input)"
        className="bg-gray-800 text-white placeholder-gray-500 border border-blue-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        value={ema70}
        onChange={e => setEma70(e.target.value)}
      />
    </div>
  </div>

  {loading && <p className="text-center text-gray-500">Fetching market data...</p>}

  {!loading && isValid && (
    <>
      {/* ATH Analysis */}
{athWeeklyNum === null ? (
  <div className="text-yellow-600 bg-yellow-100 p-4 rounded-lg border border-yellow-300">
    <h2 className="font-semibold text-lg mb-1">ATH Signal Unavailable</h2>
    <p>
      Not enough valid weekly candles to compute ATH. This requires 100 consecutive candles where
      <span className="font-semibold"> EMA14 &gt; EMA70</span>.
    </p>
  </div>
) : (
  <div className="space-y-2 text-gray-800">
    <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
    <p>ATH: ${athNum.toFixed(2)}</p>
    <p>Gap: {athGap.toFixed(2)}%</p>
    <p>
      Market Zone:{' '}
      <span className={getAthSignal() === 'Bullish Continuation' ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
        {getAthSignal() === 'Bullish Continuation' ? '🔥 Still in the Buy Zone' : '⚠️ Caution: Sell Zone'}
      </span>
    </p>

    {getAthSignal() === 'Bullish Continuation' ? (
      <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
        <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
        <p>Entry: ${bullish.entry.toFixed(2)}</p>
        <p>SL: ${bullish.stopLoss.toFixed(2)}</p>
        <p>TP: ${bullish.takeProfit1.toFixed(2)} to ${bullish.takeProfit2.toFixed(2)}</p>
      </div>
    ) : (
      <div className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1">
        <p className="font-semibold text-yellow-800">Trade Setup (Sell Zone):</p>
        <p>Entry: ${bearishReversal.entry.toFixed(2)}</p>
        <p>SL: ${bearishReversal.stopLoss.toFixed(2)}</p>
        <p>TP: ${bearishReversal.takeProfit2.toFixed(2)} to ${bearishReversal.takeProfit1.toFixed(2)}</p>
      </div>
    )}
  </div>
)}

{/* ATL Analysis */}
{atlWeeklyNum === null ? (
  <div className="text-yellow-600 bg-yellow-100 p-4 rounded-lg border border-yellow-300">
    <h2 className="font-semibold text-lg mb-1">ATL Signal Unavailable</h2>
    <p>
      Not enough valid weekly candles to compute ATL. This requires 100 consecutive candles where
      <span className="font-semibold"> EMA14 &lt; EMA70</span>.
    </p>
  </div>
) : (
  <div className="space-y-2 text-gray-800">
    <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
    <p>ATL: ${atlNum.toFixed(2)}</p>
    <p>Gap: {atlGap.toFixed(2)}%</p>
    <p>
      Market Zone:{' '}
      <span className={getAtlSignal() === 'Bearish Continuation' ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
        {getAtlSignal() === 'Bearish Continuation' ? '🔻 Still in the Sell Zone' : '🟢 Opportunity: Buy Zone'}
      </span>
    </p>

    {getAtlSignal() === 'Bearish Continuation' ? (
      <div className="text-sm bg-red-50 p-3 rounded-lg border border-red-200 space-y-1">
        <p className="font-semibold text-red-800">Trade Setup (Sell Zone):</p>
        <p>Entry: ${bearish.entry.toFixed(2)}</p>
        <p>SL: ${bearish.stopLoss.toFixed(2)}</p>
        <p>TP: ${bearish.takeProfit2.toFixed(2)} to ${bearish.takeProfit1.toFixed(2)}</p>
      </div>
    ) : (
      <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
        <p className="font-semibold text-green-800">Trade Setup (Buy Zone):</p>
        <p>Entry: ${bullishReversal.entry.toFixed(2)}</p>
        <p>SL: ${bullishReversal.stopLoss.toFixed(2)}</p>
        <p>TP: ${bullishReversal.takeProfit1.toFixed(2)} to ${bullishReversal.takeProfit2.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}
    </>
  )}
</div>

); }

                
