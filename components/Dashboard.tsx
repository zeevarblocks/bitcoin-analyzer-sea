import SignalData from '../pages/signalchecker';

export default function Dashboard({ signals }: { signals: Record<string, SignalData> }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-white/10 shadow-sm p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-yellow-400 tracking-tight">📊 Market Signal Dashboard</h1>
        <div className="text-sm text-gray-300">Updated: {new Date().toLocaleTimeString()}</div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col lg:flex-row">
        {/* Optional Sidebar */}
        <aside className="w-full lg:w-64 p-4 border-r border-white/10 hidden lg:block">
          <h2 className="text-lg font-semibold mb-2 text-white">🔎 Filters & Settings</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="hover:text-yellow-300 cursor-pointer">All Signals</li>
            <li className="hover:text-green-400 cursor-pointer">Bullish Only</li>
            <li className="hover:text-red-400 cursor-pointer">Bearish Only</li>
            <li className="hover:text-blue-400 cursor-pointer">EMA Bounce</li>
          </ul>
        </aside>

        {/* Signal Checker */}
        <section className="flex-1 p-4 overflow-y-auto">
          <SignalChecker signals={signals} />
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-white/30 p-4 border-t border-white/10 mt-6">
        Powered by <span className="text-yellow-400 font-medium">Imbl0cks</span> · All signals are for educational purposes only.
      </footer>
    </div>
  );
}
