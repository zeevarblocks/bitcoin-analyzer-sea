export const computeAthBreakoutSignal = ({ currentPrice, previousAth, ema70, athBreakoutDate, previousAthDate }) => {
    const price = parseFloat(currentPrice);
    const ath = parseFloat(previousAth);
    const ema = parseFloat(ema70);
    const breakoutDate = new Date(athBreakoutDate);
    const oldAthDate = new Date(previousAthDate);

    if (isNaN(price) || isNaN(ath) || isNaN(ema)) {
        return { error: "Invalid input" };
    }

    const diffInMs = breakoutDate - oldAthDate;
    const diffInWeeks = diffInMs / (1000 * 60 * 60 * 24 * 7);

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
