export default function BreakoutPage() {
  const [marketData, setMarketData] = useState({ currentPrice: null, ema70: null });

  useEffect(() => {
    async function getData() {
      const data = await fetchMarketData();
      setMarketData(data);
    }
    getData();
  }, []);

  const athResult = computeAthBreakoutSignal({
    currentPrice: marketData.currentPrice || 73000,
    previousAth: 69000,
    ema70: marketData.ema70 || 71000,
    athBreakoutDate: '2024-03-11',
    previousAthDate: '2021-11-08'
  });

  const atlResult = computeAtlBreakoutSignal({
    currentPrice: marketData.currentPrice || 15000,
    previousAtl: 17000,
    ema70: marketData.ema70 || 19000,
    atlBreakoutDate: '2023-12-01',
    previousAtlDate: '2022-11-08'
  });

  function formatNumber(num) {
    return typeof num === 'number' ? `$${num.toLocaleString()}` : 'Loading...';
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Bitcoin Market Data</h2>
          <p className="text-lg text-gray-700">Current Price: <span className="font-semibold">{formatNumber(marketData.currentPrice)}</span></p>
          <p className="text-lg text-gray-700">EMA 70: <span className="font-semibold">{formatNumber(marketData.ema70)}</span></p>
        </div>

        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">ATH Breakout Signal</h2>
          <p className="text-lg text-gray-700">Signal: <span className="font-semibold">{athResult.signal}</span></p>
          <p className="text-lg text-gray-700">Weeks Since Previous ATH: <span className="font-semibold">{athResult.weeksSincePreviousAth}</span></p>
          <p className="text-lg text-gray-700">Exceeds 100 Weeks: <span className="font-semibold">{athResult.exceeds100Weeks ? 'Yes' : 'No'}</span></p>
        </div>

        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-red-700 mb-4">ATL Breakout Signal</h2>
          <p className="text-lg text-gray-700">Signal: <span className="font-semibold">{atlResult.signal}</span></p>
          <p className="text-lg text-gray-700">Weeks Since Previous ATL: <span className="font-semibold">{atlResult.weeksSincePreviousAtl}</span></p>
          <p className="text-lg text-gray-700">Exceeds 100 Weeks: <span className="font-semibold">{atlResult.exceeds100Weeks ? 'Yes' : 'No'}</span></p>
        </div>
      </div>
    </div>
  );
    }
