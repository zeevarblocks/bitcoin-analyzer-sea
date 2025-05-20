// components/ChartComponent.jsx

import { useRef, useEffect } from 'react';
import { createChart } from 'lightweight-charts';

export default function ChartComponent({ data }) {
  const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;

            const chart = createChart(chartRef.current, {
                  width: chartRef.current.clientWidth,
                        height: 400,
                              layout: {
                                      background: { color: '#ffffff' },
                                              textColor: '#000000',
                                                    },
                                                          grid: {
                                                                  vertLines: { visible: false },
                                                                          horzLines: { visible: false },
                                                                                },
                                                                                    });

                                                                                        const candleSeries = chart.addCandlestickSeries();
                                                                                            candleSeries.setData(data);

                                                                                                return () => chart.remove();
                                                                                                  }, [data]);

                                                                                                    return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
                                                                                                    }