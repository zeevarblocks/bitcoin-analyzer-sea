import React, { useState, useEffect } from "react"; import { Line } from "react-chartjs-2"; import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BitcoinSignalAnalyzer = () => {
  const [priceData, setPriceData] = useState([]); const [ath, setAth] = useState(0); const [ema70Ath, setEma70Ath] = useState(0); const [atl, setAtl] = useState(0); const [ema70Atl, setEma70Atl] = useState(0);

  useEffect(() => { fetchBTCData(); }, []);

  const fetchBTCData = async () => { const response = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365"); const data = await response.json(); const prices = data.prices.map(price => ({ time: new Date(price[0]).toLocaleDateString(), value: price[1], })); setPriceData(prices); };

  const calculateVerticalGap = (level, ema) => { return level && ema ? (((level - ema) / ema) * 100).toFixed(2) : 0; };

  const chartData = { labels: priceData.map(data => data.time), datasets: [{ label: "BTC Price", data: priceData.map(data => data.value), borderColor: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.5)", },], };

  const chartOptions = { responsive: true, plugins: { legend: { position: "top", }, title: { display: true, text: "BTC Price with EMA70 Analyzer", }, }, };

  return (<div className="p-4 max-w-4xl mx-auto"> <h1 className="text-3xl font-bold mb-6">BTC Signal Analyzer</h1>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block mb-1">ATH Price ($)</label>
        <input type="number" value={ath} onChange={e => setAth(e.target.value)} className="w-full border p-2 rounded" />
      </div>
      <div>
        <label className="block mb-1">EMA70 at ATH ($)</label>
        <input type="number" value={ema70Ath} onChange={e => setEma70Ath(e.target.value)} className="w-full border p-2 rounded" />
      </div>
      <div>
        <label className="block mb-1">ATL Price ($)</label>
        <input type="number" value={atl} onChange={e => setAtl(e.target.value)} className="w-full border p-2 rounded" />
      </div>
      <div>
        <label className="block mb-1">EMA70 at ATL ($)</label>
        <input type="number" value={ema70Atl} onChange={e => setEma70Atl(e.target.value)} className="w-full border p-2 rounded" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-blue-100 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">ATH Signal</h2>
        <p>ATH: ${ath}</p>
        <p>EMA70: ${ema70Ath}</p>
        <p>Vertical Gap: {calculateVerticalGap(ath, ema70Ath)}%</p>
        <p>
          Signal: {calculateVerticalGap(ath, ema70Ath) >= 100 ? "Potential Bullish Breakout" : "No Signal"}
        </p>
      </div>

      <div className="bg-yellow-100 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">ATL Signal</h2>
        <p>ATL: ${atl}</p>
        <p>EMA70: ${ema70Atl}</p>
        <p>Vertical Gap: {calculateVerticalGap(ema70Atl, atl)}%</p>
        <p>
          Signal: {calculateVerticalGap(ema70Atl, atl) >= 100 ? "Potential Bearish Breakdown" : "No Signal"}
        </p>
      </div>
    </div>

    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">BTC Price Chart</h2>
      <Line options={chartOptions} data={chartData} />
    </div>
  </div>

  );
};

export default BitcoinSignalAnalyzer;

