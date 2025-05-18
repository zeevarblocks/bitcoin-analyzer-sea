import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Navbar from '../components/Navbar';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <div className="pt-20"> {/* push content below navbar */}
        <Component {...pageProps} />
      </div>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default MyApp;
