import '../styles/globals.css';
import Navbar from '../components/Navbar';
import FloatingButton from '../components/FloatingButton';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <Navbar />

      <main>
        <div className="bg-neutral-800 rounded-2xl shadow-xl p-6 md:p-10">
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
