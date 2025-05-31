import SignalData from '../components/SignalData';
import SignalChecker from '../components/SignalChecker';

export default function SignalCheckerPage() {
  return (
    <>
      <SignalData />
      <SignalChecker />
    </>
  );
}

// If you're using getServerSideProps, export it below (but don't use it in JSX)
export { getServerSideProps } from '../signalChecker/logic'; // or wherever it's defined
