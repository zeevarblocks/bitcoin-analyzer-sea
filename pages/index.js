'use client';
import { useEffect, useState } from 'react';
import { fetchBTCData } from '../utils/fetchBTCData';
import { BTCChart } from '../components/BTCChart';

export default function Home() {
  const [chartData, setChartData] = useState(null);

    useEffect(() => {
        async function loadData() {
              const data = await fetchBTCData();
                    setChartData(data);
                        }
                            loadData();
                              }, []);

                                return (
                                    <main className="p-4 bg-gray-50 min-h-screen">
                                          <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">Bitcoin Candlestick Chart</h1>
                                                {chartData && (
                                                        <div className="bg-white p-4 rounded-lg shadow-md">
                                                                  <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">BTC Candlestick Chart (w/ EMA70)</h2>
                                                                            <BTCChart data={chartData} />
                                                                                    </div>
                                                                                          )}
                                                                                              </main>
                                                                                                );
                                                                                                }