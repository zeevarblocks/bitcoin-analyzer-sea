import React from 'react';
import { getServerSideProps } from '../signalChecker/logic';
import SignalChecker from '../signalChecker/uidashboard';
import {
  fetchCandles,
  calculateEMA,
  calculateRSI,
  findRelevantLevel,
  detectBearishContinuation,
  detectBullishContinuation,
} from '../signalChecker/functions';

import type { SignalData, Candle } from '../signalChecker/functions';

export default function Home() {
  return (

        <SignalData />
        <getServerSideProps />
        <SignalChecker />
      

      <footer className="text-sm text-center text-gray-500 pt-6 border-t border-neutral-700 mt-10 px-4">
        <p>
          <strong className="text-gray-300">Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
        </p>
      </footer>
    </div>
  );
}
