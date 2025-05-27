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
      
          <Component {...pageProps} />
        
      </main>

      <FloatingButton />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default MyApp;
