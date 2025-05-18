// components/FloatingButton.js
import Link from 'next/link';

export default function FloatingButton() {
  return (
    <Link
      href="/rewards"
      className="fixed bottom-6 right-6 bg-yellow-400 text-black font-bold px-6 py-3 rounded-full shadow-lg hover:bg-yellow-500 transition z-50"
    >
      Claim Rewards
    </Link>
  );
}
