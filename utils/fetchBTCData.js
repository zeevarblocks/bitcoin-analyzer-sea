export async function fetchBTCData() {
try {
const res = await fetch(
'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=500'
);

if (!res.ok) {  
  throw new Error('Failed to fetch BTC data');  
}  

const data = await res.json();  

const labels = data.prices.map(price => {  
  const date = new Date(price[0]);  
  return `${date.getMonth() + 1}/${date.getDate()}`;  
});  

const prices = data.prices.map(price => price[1]);  

return {  
  labels,  
  datasets: [  
    {  
      label: 'BTC/USD',  
      data: prices,  
      borderColor: '#3b82f6',  
      backgroundColor: 'rgba(59, 130, 246, 0.1)',  
      fill: true,  
      tension: 0.4,  
    },  
  ],  
};

} catch (error) {
console.error('Error fetching BTC data:', error);
return null;
}
}
