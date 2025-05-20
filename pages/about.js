import Link from "next/link"

export default function About() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4 py-10">
            <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-3xl w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">How to Use This Tool</h2>

                <ul className="list-disc list-inside text-gray-700 space-y-4 text-base leading-relaxed">
                    <li>
                        <strong>Use the 1W (Weekly) chart timeframe</strong> to maintain consistency with EMA70 calculations.
                    </li>
                    <li>
                        When entering the <strong>All-Time High (ATH)</strong> value, include the <strong>EMA70 value from the same weekly candle</strong> as the ATH.
                    </li>
                    <li>
                        Likewise, for <strong>All-Time Low (ATL)</strong>, include the <strong>EMA70 value from the same weekly candle</strong>.
                    </li>
                    <li>
                        The tool calculates the vertical distance (gap) between ATH/ATL and EMA70 as a percentage:
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-sm text-gray-600">
                            <li><strong>+100% above EMA70</strong>: Bullish Continuation</li>
                            <li><strong>-100% below EMA70</strong>: Bearish Continuation</li>
                            <li>Smaller gaps: Possible reversal or consolidation zones</li>
                        </ul>
                    </li>
                    <li>
                        Trade levels (entry, stop loss, take profits) are generated based on macro continuation or reversal analysis.
                    </li>
                    <li>
                        Optionally input the <strong>current BTC price</strong> to monitor current position versus historical levels.
                    </li>
                    <li>
                        Use the live BTC chart below to visually inspect the weekly candles for ATH/ATL events.
                    </li>
                </ul>

                <div className="mt-10 flex justify-center">
                    <Link href="/">
                        <a className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition">
                            Go Back Home
                        </a>
                    </Link>
                </div>
            </div>
        </div>
    );
}