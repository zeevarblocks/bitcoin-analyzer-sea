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
        <div className="container w-full max-w-4xl rounded-2xl shadow-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 text-white p-6">
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
