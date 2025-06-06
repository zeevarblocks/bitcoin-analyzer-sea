// In the component SignalChecker, just render the two new fields like this:
import { useState, useEffect, useRef, useCallback } from 'react';


type FilterType =
  | null
  | 'bullishContinuation'
  | 'bearishContinuation'
  | 'ema14Bounce'
  | 'ema70Bounce'
  | 'ema14&70Bounce' // Combined EMA14 & EMA70 bounce filter
  | 'divergence'
  | 'nearOrAtEMA70Divergence'
  | 'divergenceFromLevel'
  | 'recentCrossings'
  | 'bullishBreakout'
  | 'bearishBreakout';

export default function SignalChecker({
  signals,
  defaultSignals,
}: {
  signals: Record<string, SignalData>;
  defaultSignals: SignalData[];
}) {
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isLoadingPairs, setIsLoadingPairs] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const resetToggles = () => {
  setSelectedPairs([]);
  setFavorites([]);
  setActiveFilter(null);
  localStorage.removeItem('selectedPairs');
  localStorage.removeItem('favoritePairs');
};
  

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  
  // Filter pairs by search term
  const filteredPairs = pairs.filter((pair) =>
    pair.toLowerCase().includes(searchTerm.toLowerCase())                                   
  );


useEffect(() => {
  const handleScroll = () => {
    setShowScrollButton(window.scrollY > 200);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  // Fetch pairs with stable callback reference
  const fetchPairs = useCallback(async () => {
    setIsLoadingPairs(true);
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();
      console.log('Fetched Binance data:', data);

      const sortedPairs = data
        .filter((item: any) => item.symbol.endsWith('USDT'))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .map((item: any) => item.symbol);

      setPairs(sortedPairs);

      const savedPairs = JSON.parse(localStorage.getItem('selectedPairs') || '[]');
      const validSaved = savedPairs.filter(
        (pair: string) => signals?.[pair]?.currentPrice !== undefined
      );

      if (validSaved.length > 0) {
        setSelectedPairs(validSaved);
      } else {
        const topValidPairs = sortedPairs
          .filter((pair) => signals?.[pair]?.currentPrice !== undefined)
          .slice(0, 100);
        setSelectedPairs(topValidPairs);
      }
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
    } finally {
      setIsLoadingPairs(false);
    }
  }, [signals]);

  useEffect(() => {
    if (Object.keys(signals).length > 0) {
      fetchPairs();
    }
  }, [signals]);

  const handleRefresh = async () => {
  setIsRefreshing(true);
  await Promise.all([fetchPairs()]);
  setIsRefreshing(false);
};

  // Fetch pairs on mount and every 5 minutes
  useEffect(() => {
    fetchPairs();
    const intervalId = setInterval(fetchPairs, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchPairs]);

  // Persist selected pairs in localStorage
  useEffect(() => {
    if (selectedPairs.length > 0) {
      localStorage.setItem('selectedPairs', JSON.stringify(selectedPairs));
    }
  }, [selectedPairs]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const fav = JSON.parse(localStorage.getItem('favoritePairs') || '[]');
    setFavorites(fav);
  }, []);

  // Persist favorites in localStorage
  useEffect(() => {
    localStorage.setItem('favoritePairs', JSON.stringify(favorites));
  }, [favorites]);

  // Toggle favorite state for a symbol
  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  // Filter signals for display
  const filteredDisplaySignals = Object.entries(signals || {})
    .filter(([symbol]) => selectedPairs.includes(symbol))
    .filter(([symbol]) => (showOnlyFavorites ? favorites.includes(symbol) : true))
    .filter(([_, data]) => {
      if (activeFilter === 'bullishBreakout') return data.bullishBreakout;
      if (activeFilter === 'bearishBreakout') return data.bearishBreakout;
      if (activeFilter === 'divergence') return data.divergence;
      if (activeFilter === 'nearOrAtEMA70Divergence') return data.nearOrAtEMA70Divergence;
      if (activeFilter === 'divergenceFromLevel') return data.divergenceFromLevel;
      if (activeFilter === 'ema70Bounce') return data.ema70Bounce;
      if (activeFilter === 'ema14Bounce') return data.ema14Bounce;
      if (activeFilter === 'ema14&70Bounce') return  data.ema70Bounce && data.ema14Bounce;
      return true;  
    });
  		

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
return (
  <div className="p-6 space-y-8 bg-gradient-to-b from-gray-900 to-black min-h-screen">
     {isLoadingPairs && (
      <div className="text-white font-medium animate-pulse">
        Loading trading pairs...
      </div>
    )}
    {/* Dropdown for Trading Pairs */}
      {/* Searchable input */}
  <div className="flex gap-2 flex-wrap mt-4">
  {/* Select All */}
  <button
    onClick={() =>
      setSelectedPairs(
        pairs.filter((pair) => signals?.[pair]?.currentPrice !== undefined)
      )
    }
    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-sm rounded transition"
  >
    Select All
  </button>

  {/* Reset Toggles */}
  <button
    onClick={() => resetToggles()}
    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 text-sm rounded transition"
  >
    Reset All Toggles
  </button>
    
</div>
    
  <div
  ref={containerRef}
  className="relative w-full md:w-auto flex flex-col md:flex-row gap-4"
>
  <div className="relative w-full md:w-64">
    <input
  ref={searchInputRef}
  type="text"
  placeholder="Search trading pair..."
  value={searchTerm}
  onChange={(e) => {
    setSearchTerm(e.target.value);
    setDropdownVisible(true);
  }}
  onFocus={() => {
    setDropdownVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 🔼 Scrolls to top
  }}
  className="w-full p-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
/>

    {/* Clear button */}
    {searchTerm && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSearchTerm('');
        }}
        className="absolute right-2 top-2 text-gray-400 hover:text-white text-sm"
      >
        ✕
      </button>
    )}

    {/* Dropdown */}
    {dropdownVisible && filteredPairs.length > 0 && (
      <ul className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {filteredPairs.map((pair) => (
          <li
            key={pair}
            onClick={(e) => {
              e.stopPropagation();
              if (!selectedPairs.includes(pair)) {
                setSelectedPairs([...selectedPairs, pair]);
              }
              setSearchTerm('');
              setDropdownVisible(false);
              searchInputRef.current?.blur(); // optional: blur after selection
            }}
            className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer transition-colors"
          >
            {pair}
          </li>
        ))}
      </ul>
    )}
  </div>
  </div>

    
      <div className="flex items-center space-x-4">
        <label className="text-white font-medium">
          <input
            type="checkbox"
            checked={showOnlyFavorites}
            onChange={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className="mr-2"
          />
          Show only favorites
        </label>
      </div>
        <div className="flex gap-2 flex-wrap">

<button
  onClick={() => setActiveFilter('bullishBreakout')}
  className="bg-gray-800 hover:bg-emerald-600 text-green-400 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>🚀</span>
  <span>bullishBreakout</span>
</button>

<button
  onClick={() => setActiveFilter('bearishBreakout')}
  className="bg-gray-800 hover:bg-rose-600 text-red-400 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>⚠️</span>
  <span>bearishBreakout</span>
</button>

  <button
    onClick={() => setActiveFilter('divergence')}
    className="bg-gray-800 hover:bg-yellow-600 text-yellow-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
  >
    <span>🧱</span>
    <span>trendPullback</span>
  </button>
          
<button
  onClick={() => setActiveFilter('nearOrAtEMA70Divergence')}
  className="bg-gray-800 hover:bg-indigo-700 text-indigo-400 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📐</span> {/* EMA proximity + divergence */}
  <span>nearOrAtEMA70Divergence</span>
</button>

<button
  onClick={() => setActiveFilter('divergenceFromLevel')}
  className="bg-gray-800 hover:bg-pink-700 text-pink-400 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📉</span> {/* Level-based divergence — potential trap signal */}
  <span>divergenceFromLevel</span>
</button>
          <button
  onClick={() => setActiveFilter('ema70Bounce')}
  className="bg-gray-800 hover:bg-yellow-600 text-violet-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📈</span> {/* EMA14 & EMA70 Bounce — trend continuation signal */}
  <span>ema70Bounce</span>
</button>
          <button
  onClick={() => setActiveFilter('ema14Bounce')}
  className="bg-gray-800 hover:bg-purple-600 text-indigo-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📈</span> {/* EMA14 & EMA70 Bounce — trend continuation signal */}
  <span>ema14Bounce</span>
</button>
          <button
  onClick={() => setActiveFilter('ema14&70Bounce')}
  className="bg-gray-800 hover:bg-orange-600 text-cyan-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📈</span> {/* EMA14 & EMA70 Bounce — trend continuation signal */}
  <span>ema14&70Bounce</span>
</button>
               
</div>

      {filteredDisplaySignals.map(([symbol, data]) => (
        <div
          key={symbol}
          className="bg-black/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10 text-white space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{symbol}</h3>
            <button
              onClick={() => toggleFavorite(symbol)}
              className={`text-xl ${favorites.includes(symbol) ? 'text-yellow-400' : 'text-white'}`}
            >
              {favorites.includes(symbol) ? '★' : '☆'}
            </button>
             <button
          onClick={() => setSelectedPairs((prev) => prev.filter((p) => p !== symbol))}
          className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
        >
          Unselect
        </button>
                       <button
  onClick={() => {
    fetchPairs();
  }}
  disabled={isLoadingPairs}
  className="px-4 py-2 rounded-2xl bg-gray-800 text-gray-100 hover:bg-gray-700 disabled:bg-gray-600 transition-all duration-200 shadow-md disabled:cursor-not-allowed"
>
  {isLoadingPairs ? '🔄 Refreshing...' : '🔄 Refresh'}
</button>
            </div>
           
              <div className="space-y-1">
        <h2 className="text-2xl font-bold text-yellow-400">📡 {symbol} Signal Overview</h2>
  
          <p>
            💰 <span className="font-medium text-white/70">Current Price:</span>{' '}
            <span className="text-blue-400">
              {data.currentPrice !== undefined ? `$${data.currentPrice.toFixed(9)}` : 'N/A'}
            </span>
          </p>
          <p>
            📊 <span className="font-medium text-white/70">{data.levelType?.toUpperCase() ?? 'N/A'} Level:</span>{' '}
            <span className="text-yellow-300">
              {data.level !== undefined ? data.level.toFixed(9) : 'N/A'}
            </span>
          </p>
          <p>
            🧭 <span className="font-medium text-white/70">
              Inferred {data.inferredLevelType === 'support' ? 'Support' : 'Resistance'}:
            </span>{' '}
            <span className="text-purple-300">
              {data.inferredLevel !== undefined ? data.inferredLevel.toFixed(9) : 'N/A'}
            </span>
          </p>
                {data.differenceVsEMA70 !== null && (
  <p>
    📉 <span className="font-medium text-white/70">
      Ema70 & Inferred - Gap %:
    </span>{' '}
    <span className="text-yellow-300">
  {data.differenceVsEMA70.percent.toFixed(2)}% ({data.differenceVsEMA70.direction})
</span>
  </p>
  )}              
          <p>
            📈 <span className="font-medium text-white/70">Trend:</span>{' '}
            <span className="font-semibold text-cyan-300">{data.trend ?? 'N/A'}</span>
          </p>
        </div>

          {(data.bullishBreakout || data.bearishBreakout) && (
          <div className="pt-4 border-t border-white/10 space-y-2">
            <h3 className="text-lg font-semibold text-white">📊 Breakout Signals</h3>
            {data.bullishBreakout && (
              <p className="text-green-400">🟢 Bullish Breakout: <span className="font-semibold">Yes</span></p>
            )}
            {data.bearishBreakout && (
              <p className="text-red-400">🔴 Bearish Breakout: <span className="font-semibold">Yes</span></p>
            )}
          </div>
        )}

          <div className="pt-4 border-t border-white/10 space-y-3">
  <h3 className="text-lg font-semibold text-white">📊 Signal Summary</h3>

  {data.continuationEnded ? (
    <div className="text-yellow-400">
      ⚠️ <span className="font-semibold">Continuation Ended</span>: The clean trend structure was broken.
      <p className="text-sm text-white/70 ml-4 mt-1">
        • Price action failed to maintain structure<br />
        • Trend continuation conditions no longer valid
        {data.continuationReason && (
          <>
            <br />• <span className="italic">Reason:</span> {data.continuationReason}
          </>
        )}
      </p>
    </div>
  ) : data.bullishContinuation ? (
    <div className="text-green-400">
      🔺 <span className="font-semibold">Bullish Continuation</span>: Confirmed
      <p className="text-sm text-white/70 ml-4 mt-1">
        • EMA trend is upward<br />
        • Higher lows or RSI structure confirmed<br />
        {data.continuationReason && (
          <>
            <br />• <span className="italic">Why confirmed:</span> {data.continuationReason}
          </>
        )}
      </p>
    </div>
  ) : data.bearishContinuation ? (
    <div className="text-red-400">
      🔻 <span className="font-semibold">Bearish Continuation</span>: Confirmed
      <p className="text-sm text-white/70 ml-4 mt-1">
        • EMA trend is downward<br />
        • Lower highs or RSI confirmation detected<br />
        {data.continuationReason && (
          <>
            <br />• <span className="italic">Why confirmed:</span> {data.continuationReason}
          </>
        )}
      </p>
    </div>
  ) : (
    <div className="text-white/60">
      ℹ️ <span className="font-semibold">No Continuation Signal</span>
      <p className="text-sm ml-4 mt-1">
        • Trend continuation pattern not confirmed<br />
        • Waiting for valid structure or RSI alignment
        {data.continuationReason ? (
          <>
            <br />• <span className="italic">Reason:</span> {data.continuationReason}
          </>
        ) : (
          <>
            <br />• <span className="italic">Reason:</span> No significant trend pattern or indicator alignment detected
          </>
        )}
      </p>
    </div>
  )}
</div>
          
{/* 📉 RSI Divergence Evidence */}
{data.nearOrAtEMA70Divergence && (
  <div className="pt-4 border-t border-white/10 space-y-4">
    <h3 className="text-lg font-semibold text-white">📉 RSI Divergence: Supporting Evidence for Trend Continuation</h3>

    {data.nearOrAtEMA70Divergence && (
      <div className="text-indigo-400 space-y-2">
        🧭 <span className="font-semibold">EMA70 RSI Divergence</span>
        <p className="text-sm text-white/70 ml-4 mt-1">
          • Divergence detected near the 70 EMA<br />
          • Confluence with dynamic support/resistance enhances signal reliability<br />
          • Often marks bounce zones or momentum continuation setups
        </p>
      </div>
    )}
  </div>
)}

{/* 🔍 Momentum Shift (RSI) */}
{(data.divergence || data.divergenceFromLevel) && (
  <div className="pt-4 border-t border-white/10 space-y-4">
    <h3 className="text-lg font-semibold text-white">🔍 Trend Pullback</h3>
    <div className="text-purple-400 space-y-2">
      ⚠️ <span className="font-semibold">Momentum Shift {data.divergenceType === 'bullish' ? 'Bullish' : 'Bearish'} Signal (RSI)</span>
      <p className="text-sm text-white/70 ml-4 mt-1">
        • RSI is moving opposite to price direction<br />
        • Indicates possible {data.divergenceType === 'bullish' ? 'bullish momentum despite lower lows' : 'bearish momentum despite higher highs'}<br />
        • Watch for volume spikes, candlestick confirmation, or trendline breaks
      </p>
    </div>
    
{data.divergenceFromLevel && (
      <div className="text-pink-400 space-y-2">
        🔍 <span className="font-semibold">Divergence vs Key Level</span>
        <p className="text-sm text-white/70 ml-4 mt-1">
          • Type:{" "}
          <span className="capitalize text-white">
            {data.divergenceFromLevelType === "bullish"
              ? "Reversal warning (sell)"
              : data.divergenceFromLevelType === "bearish"
              ? "Reversal warning (buy)"
              : "Confirmed"}
          </span><br />
          • RSI divergence identified at a key {data.levelType || "support/resistance"} zone<br />
          • Suggests a potential trend continuation or a fakeout trap
        </p>
      </div>
    )}
    </div>
)}
          
          

{(data.ema14Bounce || data.ema70Bounce) && (
  <div className="pt-4 border-t border-white/10 space-y-4">  
    <h3 className="text-lg font-semibold text-white">📊 EMA Bounce Signals (Consolidation)</h3>  
    <p className="text-sm text-white/80">  
      Recent candles have bounced above the 14 and/or 70 EMA. This often indicates a consolidation zone where price is stabilizing between short- and medium-term averages.  
    </p>  
    <div className="space-y-1">  
  {data?.ema14Bounce && (  
    <p className="text-green-400 text-lg font-semibold">🔁 EMA14: Yes</p>  
  )}  
  {data?.ema70Bounce && (  
    <p className="text-green-400 text-lg font-semibold">🟡 EMA70: Yes</p>  
  )}  
</div>
    </div>
)}

{/* 🔄 Recent EMA Crossings */}
{data.recentCrossings?.length > 0 && (
  <div className="bg-gray-800 p-3 rounded-lg shadow mt-4">
    <p className="text-sm font-medium text-blue-300 mb-2">
      🔄 Recent EMA Crossings
    </p>
    <ul className="space-y-1">
      {data.recentCrossings.map((cross, idx) => (
        <li
          key={idx}
          className={`flex items-center gap-3 px-2 py-1 rounded-md ${
            cross.type === 'bullish'
              ? 'bg-green-800 text-green-200'
              : 'bg-red-800 text-red-200'
          }`}
        >
          <span className="text-sm">
            {cross.type === 'bullish' ? '🟢 Bullish Cross' : '🔴 Bearish Cross'}
          </span>
          <span className="ml-auto font-mono text-xs">
            @ ${cross.price.toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
  </div>
)}


          
          
        {/* Trade Link */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => window.open(data.url ?? '#', '_blank')}
            className="transition-transform transform hover:-translate-y-1 hover:shadow-lg bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
            title={`Access the best ${symbol} trading signals`}
          >
            🚀 Trade Now — Access the Best Signals Here!
          </button>
        </div>
      </div>
    ))}



    {/* Footer */}
    <footer className="text-sm text-center text-gray-500 pt-6 border-t border-neutral-700 mt-10 px-4">
      <p>
        <strong className="text-gray-300">Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
      </p>
    </footer>
  </div>
);

        }
