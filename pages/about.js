import Link from "next/link"

export default function About() {
    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">How to Use This Tool:</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Use the 1W (Weekly) chart timeframe</strong> to maintain consistency with EMA70 calculations.</li>

                <li>
                    When entering the <strong>All-Time High (ATH)</strong> value, make sure you also enter the corresponding
                    <strong> EMA70 value that was active on the exact weekly candle</strong> when the ATH occurred.
                </li>

                <li>
                    Similarly, for <strong>All-Time Low (ATL)</strong> analysis, use the <strong>EMA70 value from the same weekly candle</strong> where the ATL occurred.
                </li>

                <li>
                    The app calculates the vertical distance (gap) between ATH/ATL and EMA70 as a percentage.
                    <ul className="list-disc list-inside ml-6 space-y-1">
                        <li>If ATH is more than <strong>+100% above EMA70</strong>, it suggests a <strong>Bullish Continuation</strong>.</li>
                        <li>If ATL is more than <strong>-100% below EMA70</strong>, it suggests a <strong>Bearish Continuation</strong>.</li>
                        <li>Smaller gaps imply potential reversal zones or consolidation.</li>
                    </ul>
                </li>

                <li>
                    The system generates trade levels (entry, stop loss, take profits) based on whether price is continuing or reversing from macro zones.
                </li>

                <li>
                    Optionally, you may enter the <strong>current BTC price</strong> to track how price is behaving relative to historical extremes and EMA70.
                </li>

                <li>
                    Use the live BTC chart below to explore historical price behavior and visually identify the weekly candle of the ATH/ATL.
                </li>
            </ul>
            <div style={{ marginTop: '3rem' }}>
                <Link href="/">
                    <a style={{ color: '#4fc3f7', textDecoration: 'underline', textAlign: 'center', justifyContent: 'center',
                                alignItems: 'center',
                     }}>Home</a>
                </Link>
            </div>
        </div>
    )
}