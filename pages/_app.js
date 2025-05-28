import '../styles/globals.css';
import Navbar from '../components/Navbar';
import FloatingButton from '../components/FloatingButton';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';


function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen p-6 flex justify-center items-start">
        <div className="container bg-black/60 backdrop-blur-md text-gray-100 rounded-2xl shadow-lg w-full max-w-4xl">
          <Component {...pageProps} />
        </div>
      </main>
      <FloatingButton />
      <Analytics />
      <SpeedInsights />
    
    </>
  );
}

export default MyApp;
