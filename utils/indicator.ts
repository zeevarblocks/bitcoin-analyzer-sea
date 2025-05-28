export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  let emaArray: number[] = [];
  let ema = data.slice(0, period).reduce((a, b) => a + b) / period;
  emaArray[period - 1] = ema;

  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    emaArray.push(ema);
  }

  return emaArray;
}

export function calculateRSI(data: number[], period = 14): number[] {
  let gains = 0;
  let losses = 0;
  let rsiArray: number[] = [];

  for (let i = 1; i <= period; i++) {
    const delta = data[i] - data[i - 1];
    if (delta > 0) gains += delta;
    else losses -= delta;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsiArray[period] = 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < data.length; i++) {
    const delta = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(delta, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-delta, 0)) / period;
    rsiArray.push(100 - 100 / (1 + avgGain / avgLoss));
  }

  return rsiArray;
}
