export const computeAthBreakoutSignal = ({ currentPrice, previousAth, ema70, athBreakoutDate, previousAthDate }) => {
    const price = parseFloat(currentPrice);
    const ath = parseFloat(previousAth);
    const ema = parseFloat(ema70);
    const breakoutDate = new Date(athBreakoutDate);
    const oldAthDate = new Date(previousAthDate);

    if (isNaN(price) || isNaN(ath) || isNaN(ema)) return { error: "Invalid ATH input" };

    const diffInWeeks = (breakoutDate - oldAthDate) / (1000 * 60 * 60 * 24 * 7);
    const isBreakout = price > ath && price > ema;
    const exceeds100Weeks = diffInWeeks > 100;

    return {
        isBreakout,
        weeksSincePreviousAth: Math.floor(diffInWeeks),
        exceeds100Weeks,
        signal: isBreakout && exceeds100Weeks
            ? "Long-Term Bullish Breakout"
            : isBreakout
                ? "Short-Term Breakout"
                : "No Clear Breakout"
    };
};

export const computeAtlBreakoutSignal = ({ currentPrice, previousAtl, ema70, atlBreakoutDate, previousAtlDate }) => {
    const price = parseFloat(currentPrice);
    const atl = parseFloat(previousAtl);
    const ema = parseFloat(ema70);
    const breakoutDate = new Date(atlBreakoutDate);
    const oldAtlDate = new Date(previousAtlDate);

    if (isNaN(price) || isNaN(atl) || isNaN(ema)) return { error: "Invalid ATL input" };

    const diffInWeeks = (breakoutDate - oldAtlDate) / (1000 * 60 * 60 * 24 * 7);
    const isBreakout = price > atl && price > ema;
    const exceeds100Weeks = diffInWeeks > 100;

    return {
        isBreakout,
        weeksSincePreviousAtl: Math.floor(diffInWeeks),
        exceeds100Weeks,
        signal: isBreakout && exceeds100Weeks
            ? "Long-Term Bullish Breakout (from ATL)"
            : isBreakout
                ? "Short-Term Breakout (from ATL)"
                : "No Clear Breakout"
    };
};
