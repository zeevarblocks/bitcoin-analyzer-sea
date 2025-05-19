<div className="max-w-4xl mx-auto bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-6">
  <h1 className="text-3xl font-bold text-center text-black">Bitcoin Signal Analyzer</h1>

  <p className="text-gray-800 text-center">
    Analyze the Bitcoin market using the vertical relationship between ATH, ATL, and the 70 EMA on the 1W timeframe...
  </p>

  <div className="bg-gray-100 p-4 rounded-lg">
    <h2 className="text-lg font-semibold text-gray-900 mb-2">Instructions:</h2>
    <ul className="list-disc list-inside text-gray-800 space-y-1">
      <li>Use data from the <strong>1W timeframe</strong> only for consistency.</li>
      ...
    </ul>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <input
      type="number"
      placeholder="All-Time High (ATH)"
      className="p-2 border border-gray-400 text-black placeholder-gray-600 rounded"
      onChange={e => setAth(e.target.value)}
    />
    ...
  </div>

  <div className="space-y-2 text-black">
    <h2 className="text-xl font-semibold">ATH vs EMA70</h2>
    <p>Gap: {computeAthGap().toFixed(2)}%</p>
    <p>
      Signal:{' '}
      <span className={getAthSignal() === 'Bullish' ? 'text-green-700' : 'text-red-700'}>
        {getAthSignal()}
      </span>
    </p>
  </div>

  <div className="space-y-2 text-black">
    <h2 className="text-xl font-semibold">ATL vs EMA70</h2>
    <p>Gap: {computeAtlGap().toFixed(2)}%</p>
    <p>
      Signal:{' '}
      <span className={getAtlSignal() === 'Bullish' ? 'text-green-700' : 'text-red-700'}>
        {getAtlSignal()}
      </span>
    </p>
  </div>

  {chartData && (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-center mb-4 text-black">
        BTC Price Chart (Recent)
      </h2>
      <Line
        data={chartData}
        options={{
          ...,
          scales: {
            x: {
              grid: { color: 'rgba(0, 0, 0, 0.1)' },
              ticks: { color: '#1f2937' }, // dark gray
            },
            y: {
              grid: { color: 'rgba(0, 0, 0, 0.1)' },
              ticks: {
                color: '#1f2937',
                callback: value => `$${value}`,
              },
            },
          },
        }}
      />
    </div>
  )}

  <footer className="text-sm text-center text-gray-700 pt-6 border-t border-gray-300">
    <p>
      <strong>Disclaimer:</strong> This app is for educational and informational purposes only...
    </p>
  </footer>
</div>
