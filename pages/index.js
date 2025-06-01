import React from 'react';
import { SignalChecker, getServerSideProps } from './signalchecker';



export async function getServerSideProps() {
  try {
    const { symbols, signals } = await SignalChecker;
    return {
      props: {
        symbols,
        signals,
      },
    };
  } catch (error) {
    console.error('SSR Error:', error);
    return {
      props: {
        symbols: [],
        signals: [],
        error: 'Failed to fetch signals.',
      },
    };
  }
}

export default function HomePage({ symbols, signals, error }) {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Ad-Safe Placement */}
      <div className="bg-neutral-800 p-4 rounded-xl shadow-md text-center text-gray-300">
        [ Advertisement Space ]
      </div>

      {error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <SignalChecker symbols={symbols} signals={signals} />
        
      )}

      <footer className="text-sm text-center text-gray-500 pt-6 border-t border-neutral-700 mt-10 px-4">
        <p>
          <strong className="text-gray-300">Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
        </p>
      </footer>
    </div>
  );
        }
