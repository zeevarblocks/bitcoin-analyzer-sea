import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-black bg-opacity-80 text-white fixed top-0 w-full z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">Bitcoin Signal Analyzer</Link>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className={`md:flex space-x-6 ${open ? 'block' : 'hidden'} md:block`}>
          <Link href="/" className="block py-2 md:inline-block hover:text-yellow-400">Home</Link>
          <Link href="/rewards" className="block py-2 md:inline-block hover:text-yellow-400">Rewards</Link>
        </div>
      </div>
    </nav>
  );
    }
