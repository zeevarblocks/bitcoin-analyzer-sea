import '../styles/globals.css';
import Navbar from '../components/Navbar';
import FloatingButton from '../components/FloatingButton';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import BTCChart from '../components/BTCChart';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <main className="p-6 min-h-screen">
        <Component {...pageProps} />
    h1>Bitcoin Analyzer</h1> 
      <BTCChart />
      </main>
      <FloatingButton />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default MyApp;
