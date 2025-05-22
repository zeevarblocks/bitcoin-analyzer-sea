import React from 'react';
import TradingViewWidget from './tradingviewwidget';
import BitcoinSignalAnalyzer from './bitcoin-signal-analyzer';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                <BitcoinSignalAnalyzer />
                <TradingViewWidget/>
            </div>

            <footer className="text-sm text-center text-gray-500 pt-6 border-t border-gray-200">
                <p>
                    <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
                </p>
            </footer>
        </div>
    );
}