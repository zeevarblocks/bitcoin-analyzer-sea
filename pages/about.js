export default function About() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center text-yellow-400">About Bitcoin Signal Analyzer</h1>
        
        <div className="bg-gray-800 rounded-2xl p-8 shadow-lg space-y-6">
          <p className="text-lg leading-relaxed text-gray-200">
            <span className="font-semibold text-white">Bitcoin Signal Analyzer</span> is a smart trading companion designed to help you make data-driven decisions in the Bitcoin market. This app fetches real-time Bitcoin weekly candle data and analyzes key market metrics including:
          </p>

          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li><span className="font-semibold text-white">All-Time High (ATH)</span></li>
            <li><span className="font-semibold text-white">All-Time Low (ATL)</span></li>
            <li><span className="font-semibold text-white">Exponential Moving Averages (EMA70 & EMA14)</span></li>
          </ul>

          <p className="text-lg leading-relaxed text-gray-200">
            Based on these indicators, the analyzer determines whether the market is in a <span className="text-green-400 font-semibold">bullish</span> or <span className="text-red-400 font-semibold">bearish</span> trend and provides <span className="text-yellow-300 font-semibold">clear trading signals</span> — complete with:
          </p>

          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Recommended Entry Points</li>
            <li>Stop-Loss Suggestions</li>
            <li>Take-Profit Targets</li>
          </ul>

          <p className="text-lg leading-relaxed text-gray-200">
            Whether you're a seasoned trader or just starting out, <span className="text-white font-semibold">Bitcoin Signal Analyzer</span> empowers you with the tools and insights you need to navigate the market confidently.
          </p>
        </div>
      </div>
    </div>
  );
      }
