// components/Navbar.js
import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-black text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="text-xl font-bold">Bitcoin Analyzer</div>
        <button className="md:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <ul className={`md:flex gap-6 ${menuOpen ? 'flex flex-col mt-4' : 'hidden'} md:mt-0`}>
          <li><Link href="/" className="hover:underline">About</Link></li>
          <li><Link href="/rewards" className="hover:underline">Rewards</Link></li>
           <Link href="/about">
               <a className="hover:underline">About This Tool</a>
                 </Link>
        </ul>
      </div>
    </nav>
  );
  }
