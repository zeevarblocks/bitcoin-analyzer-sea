import React, { useEffect } from 'react';

export default function TradingViewWidget() {
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
                    container_id: 'tradingview_okxbtc',
                });
            }
        };

        document.body.appendChild(script);
    }, []);

    return (
        <div style={{ marginTop: '3rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Live BTC/USDT Chart (OKX)
                  </h2>
            <div id="tradingview_okxbtc" style={{ borderRadius: '8px', overflow: 'hidden' }} />
            <p style={{ fontSize: '0.875rem', color:'#6c757d' , marginTop: '0.5rem' }}>
                <em>Chart powered by TradingView. For informational purposes only. Not financial advice.</em>
            </p>
        </div>
    );
}