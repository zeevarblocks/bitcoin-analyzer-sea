import React, { useState, useEffect } from 'react';

export default function Home() {
    const [ath, setAth] = useState('');
    const [atl, setAtl] = useState('');
    const [ema70, setEma70] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');


    useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;

    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          width: '100%',
          height: 500,
          symbol: 'OKX:BTCUSDT',
          interval: '60',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1e1e1e',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_okxbtc'
        });
      }
    };

    document.body.appendChild(script);
  }, []);


    const computeAthGap = () => {
        const athNum = parseFloat(ath);
        const emaNum = parseFloat(ema70);
        if (isNaN(athNum) || isNaN(emaNum) || emaNum === 0) return 0;
        return ((athNum - emaNum) / emaNum) * 100;
    };

    const computeAtlGap = () => {
        const atlNum = parseFloat(atl);
        const emaNum = parseFloat(ema70);
        if (isNaN(atlNum) || isNaN(emaNum) || atlNum === 0) return 0;
        return ((emaNum - atlNum) / atlNum) * 100;
    };

    const getAthSignal = () => (computeAthGap() > 100 ? 'Bullish Continuation' : 'Possible Reversal');
    const getAtlSignal = () => (computeAtlGap() > 100 ? 'Bearish Continuation' : 'Possible Reversal');

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

    return (

        <div className="max-w-4xl mx-auto bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-6">
            <h1 className="text-3xl font-bold text-center text-gray-900">Bitcoin Signal Analyzer</h1>

            <p className="text-gray-700 text-center">
                Analyze the Bitcoin market using the vertical relationship between ATH, ATL, and the 70 EMA on the 1W timeframe. This tool generates a signal—either bullish continuation or possible reversal—based on macro price behavior.
            </p>
    
      {/* Ad-Safe Placement */}
      <div style={{ margin: '2rem 0', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px' }}>
        {/* Example ad placeholder — replace with real ad component */}
        <p style={{ textAlign: 'center', color: '#888' }}>[ Advertisement Space ]</p>
      </div>

            {/* Grouped Input Sections (Dark Mode) */}
            <div className="space-y-6 bg-gray-950 p-6 rounded-xl text-white">

                {/* ATH (Bullish) Inputs */}
                <div className="bg-gray-900 p-4 rounded-lg border border-green-600">
                    <h2 className="text-lg font-semibold text-green-400 mb-2">
                        Bullish Analysis (ATH vs EMA70)
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            placeholder="All-Time High (ATH)"
                            className="bg-gray-800 text-white placeholder-gray-500 border border-green-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            onChange={e => setAth(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="EMA70"
                            className="bg-gray-800 text-white placeholder-gray-500 border border-green-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            onChange={e => setEma70(e.target.value)}
                        />
                    </div>
                </div>

                {/* ATL (Bearish) Inputs */}
                <div className="bg-gray-900 p-4 rounded-lg border border-red-600">
                    <h2 className="text-lg font-semibold text-red-400 mb-2">
                        Bearish Analysis (ATL vs EMA70)
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            placeholder="All-Time Low (ATL)"
                            className="bg-gray-800 text-white placeholder-gray-500 border border-red-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            onChange={e => setAtl(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="EMA70"
                            className="bg-gray-800 text-white placeholder-gray-500 border border-red-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            onChange={e => setEma70(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ATH Signal Block */}
            <div className="space-y-2 text-gray-800">
                <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
                <p>Gap: {computeAthGap().toFixed(2)}%</p>
                <p>
                    Signal:{' '}
                    <span className={getAthSignal() === 'Bullish Continuation' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {getAthSignal()}
                    </span>
                </p>
                <p className="text-sm text-gray-700">
                    {getAthSignal() === 'Bullish Continuation'
                        ? 'Price is trending above long-term resistance. Momentum is strong; consider watching for breakout confirmations.'
                        : 'Price may be weakening. A pullback or trend reversal could be developing. Monitor weekly candles closely.'}
                </p>
                {getAthSignal() === 'Bullish Continuation' && bullish.entry && (
                    <div className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-1">
                        <p className="font-semibold text-blue-800">Suggested Trade Levels (Bullish):</p>
                        <p>Entry Point: <span className="font-medium text-gray-800">${bullish.entry.toFixed(2)}</span></p>
                        <p>Stop Loss: <span className="font-medium text-gray-800">${bullish.stopLoss.toFixed(2)}</span></p>
                        <p>Take Profit: <span className="font-medium text-gray-800">${bullish.takeProfit1.toFixed(2)} to ${bullish.takeProfit2.toFixed(2)}</span></p>
                    </div>
                )}

                {getAthSignal() === 'Possible Reversal' && bearishReversal.entry && (
                    <div className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-1">
                        <p className="font-semibold text-yellow-800">Suggested Trade Levels (Bearish - Based on ATH Reversal):</p>
                        <p>Entry Point: <span className="font-medium text-gray-800">${bearishReversal.entry.toFixed(2)}</span></p>
                        <p>Stop Loss: <span className="font-medium text-gray-800">${bearishReversal.stopLoss.toFixed(2)}</span></p>
                        <p>Take Profit: <span className="font-medium text-gray-800">${bearishReversal.takeProfit2.toFixed(2)} to ${bearishReversal.takeProfit1.toFixed(2)}</span></p>
                    </div>
                )}
            </div>

            {/* ATL Signal Block */}
            <div className="space-y-2 text-gray-800">
                <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
                <p>Gap: {computeAtlGap().toFixed(2)}%</p>
                <p>
                    Signal:{' '}
                    <span className={getAtlSignal() === 'Bearish Continuation' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                        {getAtlSignal()}
                    </span>
                </p>
                <p className="text-sm text-gray-700">
                    {getAtlSignal() === 'Bearish Continuation'
                        ? 'Price remains under long-term pressure. Trend continuation likely unless strong reversal patterns emerge.'
                        : 'Price may be rebounding from historic lows. Watch for a higher low structure and rising EMA support.'}
                </p>
                {getAtlSignal() === 'Bearish Continuation' && bearish.entry && (
                    <div className="text-sm bg-red-50 p-3 rounded-lg border border-red-200 space-y-1">
                        <p className="font-semibold text-red-800">Suggested Trade Levels (Bearish):</p>
                        <p>Entry Point: <span className="font-medium text-gray-800">${bearish.entry.toFixed(2)}</span></p>
                        <p>Stop Loss: <span className="font-medium text-gray-800">${bearish.stopLoss.toFixed(2)}</span></p>
                        <p>Take Profit: <span className="font-medium text-gray-800">${bearish.takeProfit2.toFixed(2)} to ${bearish.takeProfit1.toFixed(2)}</span></p>
                    </div>
                )}

                {getAtlSignal() === 'Possible Reversal' && bullishReversal.entry && (
                    <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
                        <p className="font-semibold text-green-800">Suggested Trade Levels (Bullish - Based on ATL Reversal):</p>
                        <p>Entry Point: <span className="font-medium text-gray-800">${bullishReversal.entry.toFixed(2)}</span></p>
                        <p>Stop Loss: <span className="font-medium text-gray-800">${bullishReversal.stopLoss.toFixed(2)}</span></p>
                        <p>Take Profit: <span className="font-medium text-gray-800">${bullishReversal.takeProfit1.toFixed(2)} to ${bullishReversal.takeProfit2.toFixed(2)}</span></p>
                    </div>
                )}
{/* TradingView Widget */}
      <div style={{ marginTop: '3rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Live BTC/USDT Chart (OKX)
        </h2>
        <div id="tradingview_okxbtc" style={{ borderRadius: '8px', overflow: 'hidden' }} />
        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
          <em>Chart powered by TradingView. For informational purposes only. Not financial advice.</em>
        </p>
      </div>
            </div>
            <footer className="text-sm text-center text-gray-500 pt-6 border-t border-gray-200">
                <p>
                    <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
                </p>
            </footer>
        </div>
    );
}       
