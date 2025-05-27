import '../styles/globals.css';
import Navbar from '../components/Navbar';
import FloatingButton from '../components/FloatingButton';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl p-6">
          <Component {...pageProps} />
        </div>
      </main>

      <FloatingButton />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default MyApp;
