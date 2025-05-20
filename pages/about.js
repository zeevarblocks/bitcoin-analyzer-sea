export default function About() {
      return (
          <div className="min-h-screen bg-cover bg-center p-6 text-gray-800" style={{ backgroundImage: 'url(/bg.png)' }}>
                <div className="max-w-4xl mx-auto bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-6">
                        <h1 className="text-3xl font-bold text-center text-gray-900">About Bitcoin Signal Analyzer</h1>

                                <p className="text-gray-700 text-center">
                                          This tool analyzes the Bitcoin market using the vertical relationship between All-Time High (ATH), All-Time Low (ATL), and the 70-period Exponential Moving Average (EMA70) on the weekly (1W) timeframe.
                                                  </p>

                                                          <div className="bg-gray-50 p-4 rounded-lg">
                                                                    <h2 className="text-lg font-semibold text-gray-800 mb-2">How to Use This Tool:</h2>
                                                                              <ul className="list-disc list-inside text-gray-700 space-y-2">
                                                                                          <li><strong>Use the 1W (Weekly) chart timeframe</strong> to maintain consistency with EMA70 calculations.</li>
                                                                                                      <li>Enter the <strong>ATH value</strong> and the corresponding <strong>EMA70 value</strong> from the same weekly candle.</li>
                                                                                                                  <li>Similarly, enter the <strong>ATL value</strong> and its corresponding <strong>EMA70 value</strong>.</li>
                                                                                                                              <li>The app calculates the percentage gap between ATH/ATL and EMA70.</li>
                                                                                                                                          <li>If ATH is more than <strong>100% above EMA70</strong>, the signal is a <strong>Bullish Continuation</strong>.</li>
                                                                                                                                                      <li>If ATL is more than <strong>100% below EMA70</strong>, the signal is a <strong>Bearish Continuation</strong>.</li>
                                                                                                                                                                  <li>Smaller gaps imply potential reversals or consolidation.</li>
                                                                                                                                                                              <li>Suggested trade levels (entry, stop loss, take profits) are generated accordingly.</li>
                                                                                                                                                                                          <li>You can optionally enter the <strong>current BTC price</strong> for additional context.</li>
                                                                                                                                                                                                    </ul>
                                                                                                                                                                                                            </div>

                                                                                                                                                                                                                    <footer className="text-sm text-center text-gray-500 pt-6 border-t border-gray-200">
                                                                                                                                                                                                                              <p>
                                                                                                                                                                                                                                          <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
                                                                                                                                                                                                                                                    </p>
                                                                                                                                                                                                                                                            </footer>
                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                                        }
