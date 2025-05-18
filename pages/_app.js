import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Link from 'next/link';

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Header */}
      <nav className="bg-gray-900 text-white px-6 py-4 shadow-md flex items-center justify-between">
        <div className="text-xl font-bold tracking-wide">
          Bitcoin Signal Analyzer
        </div>
        <div className="space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-yellow-400 transition">
            Home
          </Link>
          <Link href="/rewards" className="hover:text-yellow-400 transition">
            Rewards
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen bg-white text-gray-900 px-4 py-6">
        <Component {...pageProps} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-4 mt-10 text-center text-sm">
        <p>
          © {new Date().getFullYear()} Bitcoin Signal Analyzer. All rights reserved.
          <Link href="/rewards" className="ml-2 underline hover:text-yellow-400 transition">
            Claim Rewards
          </Link>
        </p>
      </footer>

      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default MyApp;
