module.exports = function calculatePriority(rr) {
    if (rr.callPreference === "do_not_call") return "NO_CALL";
  
    const today = new Date();
  
    const daysSinceBuy = rr.lastBuyDate
      ? Math.floor((today - rr.lastBuyDate) / 86400000)
      : 999;
  
    const daysSinceCall = rr.lastCallDate
      ? Math.floor((today - rr.lastCallDate) / 86400000)
      : 999;
  
    if (daysSinceBuy >= rr.avgBuyGapDays && daysSinceCall >= 7) {
      return "HIGH";
    }
  
    if (daysSinceBuy >= rr.avgBuyGapDays * 0.7) {
      return "MEDIUM";
    }
  
    return "LOW";
  };
  