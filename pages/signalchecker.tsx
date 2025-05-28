import { useState, useEffect } from 'react'; 

interface SignalData { trend: string; breakout: boolean; divergence: boolean; ema14Bounce: boolean; ema70Bounce: boolean; currentPrice: number; level: number | null; levelType: 'support' | 'resistance' | null; inferredLevel: number; inferredLevelType: 'support' | 'resistance'; nearOrAtEMA70Divergence: boolean; inferredLevelWithinRange: boolean; }

export default function SignalDashboard() { const [symbol, setSymbol] = useState('BTC-USDT-SWAP'); const [loading, setLoading] = useState(false); const [signal, setSignal] = useState<SignalData | null>(null);

const fetchSignal = async () => { setLoading(true); try { const res = await fetch(/api/signal?symbol=${symbol}); const data = await res.json(); setSignal(data.signal); } catch (err) { console.error('Error fetching signal:', err); } finally { setLoading(false); } };

useEffect(() => { fetchSignal(); }, []);

return ( <div className="p-4 max-w-2xl mx-auto"> <div className="flex gap-2 mb-4"> <Input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Enter symbol" /> <Button onClick={fetchSignal} disabled={loading}> {loading ? 'Loading...' : 'Get Signal'} </Button> </div>

{signal && (
    <Card className="shadow-xl">
      <CardContent className="space-y-4 p-4">
        <h2 className="text-xl font-bold">Signal for {symbol}</h2>
        <div>📈 <strong>Trend:</strong> {signal.trend}</div>
        <div>🚀 <strong>Breakout:</strong> {signal.breakout ? 'Yes' : 'No'}</div>
        <div>📉 <strong>Divergence:</strong> {signal.divergence ? 'Yes' : 'No'}</div>
        <div>🔄 <strong>EMA14 Bounce:</strong> {signal.ema14Bounce ? 'Yes' : 'No'}</div>
        <div>🔄 <strong>EMA70 Bounce:</strong> {signal.ema70Bounce ? 'Yes' : 'No'}</div>
        <div>💰 <strong>Current Price:</strong> ${signal.currentPrice.toFixed(2)}</div>
        <div>📍 <strong>Inferred Level ({signal.inferredLevelType}):</strong> ${signal.inferredLevel.toFixed(2)}</div>
        <div>📊 <strong>Near EMA70 & Divergence:</strong> {signal.nearOrAtEMA70Divergence ? 'Yes' : 'No'}</div>
        <div>📏 <strong>Level Within Range:</strong> {signal.inferredLevelWithinRange ? 'Yes' : 'No'}</div>
      </CardContent>
    </Card>
  )}
</div>

); }

      
