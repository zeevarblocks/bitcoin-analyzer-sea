// utils/fetchMarketData.js

export async function fetchMarketData() {
    try {
        // Fetch current BTC price from CoinGecko
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const priceData = await priceResponse.json();
        const currentPrice = priceData.bitcoin.usd;

        // Fetch EMA70 from TAAPI.IO
        const emaResponse = await fetch('https://api.taapi.io/ema?secret=YOUR_TAAPI_KEY&exchange=binance&symbol=BTC/USDT&interval=1d&optInTimePeriod=70');
        const emaData = await emaResponse.json();
        const ema70 = emaData.value;

        return { currentPrice, ema70 };
    } catch (error) {
        console.error('Error fetching market data:', error);
        return { currentPrice: null, ema70: null };
    }
}