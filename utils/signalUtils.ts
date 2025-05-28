export function findRelevantLevel(prices: number[], type: 'support' | 'resistance'): number {
  if (type === 'support') {
    return Math.min(...prices);
  } else {
    return Math.max(...prices);
  }
}
