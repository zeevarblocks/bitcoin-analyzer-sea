import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const BitcoinSignalAnalyzer = () => {
    const [chartData, setChartData] = useState(null);
    const [signal, setSignal] = useState(null);
    const [suggestions, setSuggestions] = useState(null);

    const analyzeData = (data) => {
        const prices = data.prices.map(p => p[1]);

        const ath = Math.max(...prices);
        const atl = Math.min(...prices);
        const ema70 = prices.slice(-70).reduce((a, b) => a + b, 0) / 70;
        const currentPrice = prices[prices.length - 1];

        let signalType = 'Neutral';
        let suggestion = {
            entry: currentPrice,
            stopLoss: null,
            takeProfit: null,
        };

        if (currentPrice > ema70 && currentPrice < ath * 0.95) {
            signalType = 'Bullish';
            suggestion.stopLoss = currentPrice * 0.96;
            suggestion.takeProfit = currentPrice * 1.1;
        } else if (currentPrice < ema70 && currentPrice > atl * 1.05) {
            signalType = 'Bearish';
            suggestion.stopLoss = currentPrice * 1.04;
            suggestion.takeProfit = currentPrice * 0.9;
        }

        setSignal(signalType);
        setSuggestions(suggestion);
    };

    const fetchBTCData = async () => {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30');
            const data = await response.json();

            const labels = data.prices.map(price => {
                const date = new Date(price[0]);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            });

            const prices = data.prices.map(price => price[1]);

            const formattedData = {
                labels,
                datasets: [
                    {
                        label: 'BTC Price (USD)',
                        data: prices,
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.2)',
                        tension: 0.3,
                    },
                ],
                prices: data.prices, // for raw numerical analysis
            };

            setChartData(formattedData);
            analyzeData(data);
        } catch (err) {
            console.error('Failed to fetch BTC data', err);
        }
    };

    useEffect(() => {
        fetchBTCData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-4">Bitcoin Signal Analyzer</h1>

            {chartData ? (
                <div className="bg-white rounded-xl p-4 text-black shadow-xl mb-4">
                    <Line data={chartData} />
                </div>
            ) : (
                <p>Loading chart...</p>
            )}

            {signal && suggestions && (
                <div className={`p-6 rounded-lg shadow-md ${signal === 'Bullish' ? 'bg-green-700' :
                        signal === 'Bearish' ? 'bg-red-700' : 'bg-gray-700'
                    }`}>
                    <h2 className="text-xl font-bold mb-2">{signal} Signal</h2>
                    <p><strong>Entry Price:</strong> ${suggestions.entry.toFixed(2)}</p>
                    <p><strong>Stop Loss:</strong> ${suggestions.stopLoss?.toFixed(2)}</p>
                    <p><strong>Take Profit:</strong> ${suggestions.takeProfit?.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};

export default BitcoinSignalAnalyzer;