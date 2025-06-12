import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react'; // or your preferred icon

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
  | 'bearishBreakout'
  |	'abcSignal'
  |	'crossSignal'
  |	'abcSignal&crossSignal'
  |	'touchedEMA70Today'
  |	'breakout'
  |	'touchedEMA70Today&breakout'
	| 'tradeSignal';

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
      const response = await fetch(
        'https://www.okx.com/api/v5/market/tickers?instType=SPOT'
      );
      const data = await response.json();
      const sortedPairs = data.data
        .sort(
          (a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h)
        )
        .map((item: any) => item.instId);

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
      if (activeFilter === 'bullishContinuation') return data.bullishContinuation;
      if (activeFilter === 'bearishContinuation') return data.bearishContinuation;
      if (activeFilter === 'bullishBreakout') return data.bullishBreakout;
      if (activeFilter === 'bearishBreakout') return data.bearishBreakout;
      if (activeFilter === 'divergence') return data.divergence;
      if (activeFilter === 'nearOrAtEMA70Divergence') return data.nearOrAtEMA70Divergence;
      if (activeFilter === 'divergenceFromLevel') return data.divergenceFromLevel;
      if (activeFilter === 'tradeSignal') return data.ema70Bounce && data.recentCrossings;
      if (activeFilter === 'ema14Bounce') return data.ema14Bounce;
      if (activeFilter === 'ema14&70Bounce') return  data.ema70Bounce && data.ema14Bounce;
      if (activeFilter === 'abcSignal&crossSignal') return data.abcSignal && data.crossSignal;
      if (activeFilter === 'touchedEMA70Today&breakout') return data.touchedEMA70Today && data.breakout;
      return true;  
    });

// ✅ Then: use it here
const filteredCount = filteredDisplaySignals.length;
  

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
  <div className="p-6 space-y-8 rounded-2xl bg-gradient-to-b from-gray-900 to-black min-h-screen">
     {isLoadingPairs && (
      <div className="text-white font-medium animate-pulse">
        Loading trading pairs...        
      </div>
    )}

    <div>
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
    className="bg-gray-600 hover:bg-yellow-700 text-purple px-3 py-1.5 text-sm rounded transition"
  >
    Select All
  </button>

  {/* Reset Toggles */}
  <button
    onClick={() => resetToggles()}
    className="bg-gray-600 hover:bg-orange-700 text-purple px-3 py-1.5 text-sm rounded transition"
  >
    Reset All Toggles
  </button>   
    
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
    <span>divergence</span>
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
  onClick={() => setActiveFilter('tradeSignal')}
  className="bg-gray-800 hover:bg-yellow-600 text-violet-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
>
  <span>📈</span> {/* EMA14 & EMA70 Bounce — trend continuation signal */}
  <span>tradeSignal</span>
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
          <button
    onClick={() => setActiveFilter('bullishContinuation')}
    className="bg-gray-800 hover:bg-green-700 text-green-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
  >
    <span>📈</span>
    <span>bullishContinuation</span>
  </button>

  <button
    onClick={() => setActiveFilter('bearishContinuation')}
    className="bg-gray-800 hover:bg-red-700 text-red-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
  >
    <span>📉</span>
    <span>bearishContinuation</span>
  </button>

          <button
    onClick={() => setActiveFilter('abcSignal&crossSignal')}
    className="bg-gray-800 hover:bg-orange-700 text-blue-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
  >
    <span>📉</span>
    <span>abcdSignal&crossSignal</span>
  </button>

          <button
    onClick={() => setActiveFilter('touchedEMA70Today&breakout')}
    className="bg-gray-800 hover:bg-orange-700 text-blue-300 px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1"
  >
    <span>📉</span>
    <span>touchedEMA70Today&breakout</span>
  </button>
               
</div>
<div>
<h2 className="text-gray-100 text-2xl font-semibold mb-4 flex items-center gap-2">
  <span className="text-blue-400">🔎</span>
  <span>
    Showing <span className="font-bold text-white">{filteredCount}</span> 
    {filteredCount !== 1 ? ' results' : ' result'}
    {activeFilter && (
      <span className="text-sm text-gray-400 ml-1 italic">
        for <span className="text-blue-300">{activeFilter}</span>
      </span>
    )}
  </span>
</h2>
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
            </div>
           
              <div className="space-y-1">
        <h2 className="text-2xl font-bold text-yellow-400">📡 {symbol} Signal Overview</h2>
  
          <p>
            💰 <span className="font-medium text-white/70">Current Price:</span>{' '}
            <span className="text-blue-400">
  {typeof data.currentPrice === 'number'
    ? `$${data.currentPrice.toFixed(9)}`
    : 'N/A'}
</span>
          </p>
          <p>
            📊 <span className="font-medium text-white/70">{data.levelType?.toUpperCase() ?? 'N/A'} Level:</span>{' '}
            <span className="text-yellow-300">
  {typeof data.level === 'number' ? data.level.toFixed(9) : 'N/A'}
</span>
          </p>
          <p>
            🧭 <span className="font-medium text-white/70">
              Inferred {data.inferredLevelType === 'support' ? 'Support' : 'Resistance'}:
            </span>{' '}
            <span className="text-purple-300">
  {typeof data.inferredLevel === 'number'
    ? data.inferredLevel.toFixed(9)
    : 'N/A'}
</span>
          </p>
                {data.differenceVsEMA70 !== null && (
  <p>
    📉 <span className="font-medium text-white/70">
      Ema70 & Inferred - Gap %:
    </span>{' '}
    <span className="text-yellow-300">
  {typeof data.differenceVsEMA70?.percent === 'number'
    ? `${data.differenceVsEMA70.percent.toFixed(2)}% (${data.differenceVsEMA70.direction})`
    : 'N/A'}
</span>
  </p>
  )}              
          <p>
            📈 <span className="font-medium text-white/70">Trend:</span>{' '}
            <span className="font-semibold text-cyan-300">{data.trend ?? 'N/A'}</span>
          </p>
        </div>

          <p>
        🚀 Daily Breakout:{' '}
        <span className={data.breakout ? 'text-green-400' : 'text-red-400'}>
          {data.breakout ? 'Yes' : 'No'}
        </span>
      </p>

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

{/* ─────────────────────────────────────────────  
    📊 1) TREND-CONTINUATION SUMMARY  
───────────────────────────────────────────── */}  
<div className="pt-4 border-t border-white/10 space-y-4">  
  <h3 className="text-lg font-semibold text-white">  
    📊 Signal Summary: Trend Continuation  
  </h3>  
  
  {data.continuationEnded ? (  
    <div className="text-yellow-400 space-y-2">  
      ⚠️ <span className="font-semibold">Continuation Ended</span>  
      <p className="text-sm text-white/70 ml-4 mt-1">  
        • Price action failed to maintain structure<br />  
        • Trend-continuation conditions no longer valid  
        {data.continuationReason && (  
          <>  
            <br />• <span className="italic">Reason:</span> {data.continuationReason}  
          </>  
        )}  
      </p>  
    </div>  
  ) : data.bullishContinuation ? (  
    <div className="text-green-400 space-y-2">  
      🔺 <span className="font-semibold">Bullish Continuation</span>  
      <p className="text-sm text-white/70 ml-4 mt-1">  
        • EMA trend is upward<br />  
        • Higher-lows or RSI structure confirmed  
        {data.continuationReason && (  
          <>  
            <br />• <span className="italic">Why confirmed:</span> {data.continuationReason}  
          </>  
        )}  
      </p>  
    </div>  
  ) : data.bearishContinuation ? (  
    <div className="text-red-400 space-y-2">  
      🔻 <span className="font-semibold">Bearish Continuation</span>  
      <p className="text-sm text-white/70 ml-4 mt-1">  
        • EMA trend is downward<br />  
        • Lower-highs or RSI confirmation detected  
        {data.continuationReason && (  
          <>  
            <br />• <span className="italic">Why confirmed:</span> {data.continuationReason}  
          </>  
        )}  
      </p>  
    </div>  
  ) : (  
    <div className="text-white/60 space-y-2">  
      ℹ️ <span className="font-semibold">No Continuation Signal</span>  
      <p className="text-sm text-white/70 ml-4 mt-1">  
        • Trend-continuation pattern not confirmed<br />  
        • Waiting for valid structure or RSI alignment  
        <br />• <span className="italic">Reason:</span>{" "}  
        {data.continuationReason ||  
          "No significant trend pattern or indicator alignment detected"}  
      </p>  
    </div>  
  )}  
</div>  

{/* ─────────────────────────────────────────────  
    📉 2) RSI DIVERGENCE EVIDENCE  
───────────────────────────────────────────── */}  
{(data.nearOrAtEMA70Divergence || data.divergenceFromLevel) && (  
  <div className="pt-4 border-t border-white/10 space-y-4">  
    <h3 className="text-lg font-semibold text-white">  
      📉 RSI Divergence: Supporting Evidence  
    </h3>  

    {data.nearOrAtEMA70Divergence && (  
      <div className="text-indigo-400 space-y-2">  
        🧭 <span className="font-semibold">EMA70 RSI Divergence</span>  
        <p className="text-sm text-white/70 ml-4 mt-1">  
          • Divergence detected near the 70-EMA<br />  
          • Confluence with dynamic S/R enhances reliability<br />  
          • Often marks bounce zones or continuation setups  
        </p>  
      </div>  
    )}  

    {data.divergenceFromLevel && (  
      <div className="text-pink-400 space-y-2">  
        🔍 <span className="font-semibold">Divergence vs Key Level</span>  
        <p className="text-sm text-white/70 ml-4 mt-1">  
          • Type:&nbsp;  
          <span className="capitalize text-white">  
            {data.divergenceFromLevelType === "bullish"  
              ? "Bullish continuation (buy)"  
              : data.divergenceFromLevelType === "bearish"  
              ? "Bearish continuation (sell)"  
              : "Confirmed"}  
          </span>  
          <br />  
          • RSI divergence at key {data.levelType || "support/resistance"} zone<br />  
          • Suggests a potential trend continuation  
        </p>  
      </div>  
    )}  
  </div>  
)}  

{/* ─────────────────────────────────────────────  
    📊 3) CROSS + ABC PATTERN  
───────────────────────────────────────────── */}  
{data.crossSignal && data.abcSignal && (
  <div className="pt-4 border-t border-white/10 space-y-4">
    <h3 className="text-lg font-semibold text-white">
      📊 EMA Cross&nbsp;+&nbsp;RSI Confirmation
    </h3>

    {data.crossSignal === "buy" ? (
      <div className="text-green-400 space-y-2">
        ✅ <span className="font-semibold">Buy Continuation Signal</span>
        <p className="text-sm text-white/70 ml-4 mt-1">
          • EMA14 crossed above EMA70 – bullish crossover<br />
          • RSI is now lower than at the cross (pullback)<br />
          • Momentum may resume upward – watch support for entries
        </p>
      </div>
    ) : (
      <div className="text-red-400 space-y-2">
        ⚠️ <span className="font-semibold">Sell Continuation Signal</span>
        <p className="text-sm text-white/70 ml-4 mt-1">
          • EMA14 crossed below EMA70 – bearish crossover<br />
          • RSI is now higher than at the cross (bounce)<br />
          • Momentum may resume downward – watch resistance for entries
        </p>
      </div>
    )}

    <div>
      <h3 className="text-lg font-semibold text-white">🔄 A-B-C Continuation Pattern</h3>
      {data.abcSignal === "buy" ? (
        <div className="text-green-400 space-y-2">
          ✅ <span className="font-semibold">Bullish Continuation Signal</span>
          <p className="text-sm text-white/70 ml-4 mt-1">
            • <strong>A</strong> index {data.abcPattern.aIdx}<br />
            • <strong>B</strong> index {data.abcPattern.bIdx}<br />
            • <strong>C</strong> broke A → structure continuation/ index {data.abcPattern.cIdx}<br />
            • <strong>D</strong> failure to make lower low + RSI rise/ index {data.abcPattern.dIdx}
          </p>
        </div>
      ) : (
        <div className="text-red-400 space-y-2">
          ⚠️ <span className="font-semibold">Bearish Continuation Signal</span>
          <p className="text-sm text-white/70 ml-4 mt-1">
            • <strong>A</strong> index {data.abcPattern.aIdx}<br />
            • <strong>B</strong> index {data.abcPattern.bIdx}<br />
            • <strong>C</strong> broke A → structure continuation/ index {data.abcPattern.cIdx}<br />
            • <strong>D</strong> failure to make higher high + RSI drop/ index {data.abcPattern.dIdx}
          </p>
        </div>
      )}
    </div>
  </div>
)}

{/* ─────────────────────────────────────────────  
    🔄 4) MOMENTUM-STALL  
───────────────────────────────────────────── */}  
{(data.divergence || data.momentumSlowing || data.stallReversal) && (  
  <div className="pt-4 border-t border-white/10 space-y-6">  
    <div className="space-y-4">  
      {data.divergence && (  
        <div className="text-purple-400 space-y-2">  
          ⚠️ <span className="font-semibold">  
            Momentum Slowing – {data.divergenceType === "bullish" ? "Bullish" : "Bearish"} RSI Divergence  
          </span>  
          <p className="text-sm text-white/70 ml-4 mt-1">  
            • RSI moving opposite price direction<br />  
            • Testing {data.levelType} at{" "}  
            <span className="text-white">
  ${typeof data.level === 'number' ? data.level.toFixed(9) : 'N/A'}
</span> 
          </p>  
        </div>  
      )}  

      {data.momentumSlowing && (  
        <div className="text-amber-400 space-y-2">  
          🐢 <span className="font-semibold">  
            {data.momentumSlowing === "bullish" ? "Bullish" : "Bearish"} Momentum Slowing  
          </span>  
          <p className="text-sm text-white/70 ml-4 mt-1">  
            • Histogram contracting – energy waning<br />  
            • RSI hovering near 50 – indecision  
          </p>  
        </div>  
      )}  

      {data.stallReversal && !data.crossSignal && (  
        <div  
          className={`space-y-2 ${  
            data.stallReversal === "sell" ? "text-red-400" : "text-green-400"  
          }`}  
        >  
          🔄 <span className="font-semibold">  
            {data.stallReversal === "sell"  
              ? "Watch for Exhaustion (RSI-Stall after High)"  
              : "Watch for Exhaustion (RSI-Stall after Low)"}  
          </span>  
          <p className="text-sm text-white/70 ml-4 mt-1">  
            • {data.stallReversal === "sell" ? "Higher high" : "Lower low"} failed to follow through<br />  
            • RSI did not confirm – stalling momentum  
          </p>  
        </div>  
      )}  
    </div>  
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

		<p>
  🧲 Touched EMA70 Today:{' '}
  <span className={data.touchedEMA70Today ? 'text-green-400' : 'text-red-400'}>
    {data.touchedEMA70Today ? 'Yes' : 'No'}
  </span>
</p>

		
<p>
  🚀 RSI14 Breakout Above Swing Low:{' '}
  <span className={data.rsi14BreakoutAboveSwingLow ? 'text-green-400' : 'text-red-400'}>
    {data.rsi14BreakoutAboveSwingLow ? 'Yes' : 'No'} 
  </span>
</p>


<p>
  📉 RSI14 Breakdown Below Swing High:{' '}
  <span className={data.rsi14BreakdownBelowSwingHigh ? 'text-green-400' : 'text-red-400'}>
    {data.rsi14BreakdownBelowSwingHigh ? 'Yes' : 'No'} 
  </span>
</p>



		

          

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
            @ ${typeof cross.price === 'number' ? cross.price.toFixed(9) : 'N/A'}
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

    {showScrollButton && (
  <button
    onClick={scrollToTop}
    className="fixed bottom-5 right-5 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur shadow-lg transition duration-300"
    aria-label="Scroll to top"
  >
    <ArrowUp size={20} />
  </button>
)}

    {/* Footer */}
    <footer className="text-sm text-center text-gray-500 pt-6 border-t border-neutral-700 mt-10 px-4">
      <p>
        <strong className="text-gray-300">Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Always conduct your own research before making trading decisions.
      </p>
    </footer>
  </div>
);

}
