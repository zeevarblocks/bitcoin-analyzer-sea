// [SIMPLIFIED] Correct breakout logic from your previous code

const dailyCandles = await fetchCandles(symbol, '1d');
const prevDay = dailyCandles.at(-2);
const currDay = dailyCandles.at(-1);

const prevDayHigh = prevDay?.high ?? 0;
const prevDayLow = prevDay?.low ?? 0;

const prevCandle = candles.at(-2);
const currentCandle = candles.at(-1);

let bullishBreakout = false;
let bearishBreakout = false;
let breakout = false;

if (prevCandle && currentCandle) {
  bullishBreakout = prevCandle.high <= prevDayHigh && currentCandle.high > prevDayHigh;
  bearishBreakout = prevCandle.low >= prevDayLow && currentCandle.low < prevDayLow;
  breakout = bullishBreakout || bearishBreakout;
}

// rest of logic unchanged