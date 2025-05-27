import Link from 'next/link';

export default function Rewards() {
  return (
    <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-500 text-white shadow-2xl">
      {/* Binance Reward Section */}
      <h1 className="text-3xl font-bold mb-4">Claim Your Binance Mystery Box</h1>
      <p className="text-lg mb-6">
        Celebrate Pizza Day 2025 with Binance and claim your exclusive reward through our referral link.
      </p>
      <a
        href="https://www.binance.com/referral/mystery-box/2025-pizza-day/claim?ref=GRO_16987_LRM2A"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-yellow-400 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
      >
        Claim Binance Mystery Box
      </a>

      <hr className="my-10 border-t border-white/30" />

      {/* OKX Reward Section */}
      <h2 className="text-2xl font-semibold mb-4">Get Rewards with OKX</h2>
      <p className="text-lg mb-6">
        Join OKX and get crypto rewards by signing up using our referral link.
      </p>
      <a
        href="https://okx.com/join/96631749"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-emerald-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-400 transition"
      >
        Join OKX Now
      </a>

      <div className="mt-10">
        <Link href="/" className="text-blue-300 underline hover:text-blue-200 transition">
          Home
        </Link>
      </div>
    </div>
  );
          }
