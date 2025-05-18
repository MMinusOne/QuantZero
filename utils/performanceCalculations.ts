export function calculateWinRate(
  winCount: number,
  totalTrades: number
): number {
  return totalTrades > 0 ? winCount / totalTrades : 0;
}

export function calculateProfitFactor(
  grossProfit: number,
  grossLoss: number
): number {
  return grossLoss > 0
    ? grossProfit / grossLoss
    : grossProfit > 0
    ? Infinity
    : 0;
}

export function calculateMean(array: number[]): number {
  return array.length > 0
    ? array.reduce((sum, val) => sum + val, 0) / array.length
    : 0;
}

export function calculateStandardDeviation(
  array: number[],
  mean: number
): number {
  return array.length > 1
    ? Math.sqrt(
        array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          (array.length - 1)
      )
    : 1;
}

export function calculateSharpeRatio(
  mean: number,
  stdDev: number,
  riskFreeRate: number
): number {
  return stdDev > 0 ? ((mean - riskFreeRate) / stdDev) * Math.sqrt(252) : 0; // Annualized
}

export function calculateCovariance(
  array1: number[],
  array2: number[],
  mean1: number,
  mean2: number
): number {
  return array1.length > 1 && array1.length === array2.length
    ? array1.reduce(
        (sum, val, i) => sum + (val - mean1) * (array2[i]! - mean2),
        0
      ) /
        (array1.length - 1)
    : 0;
}

export function calculateVariance(array: number[], mean: number): number {
  return array.length > 1
    ? array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        (array.length - 1)
    : 0;
}

export function calculateBeta(
  returns: number[],
  marketReturns: number[],
  returnsMean: number,
  marketMean: number
): number {
  const covariance = calculateCovariance(
    returns,
    marketReturns,
    returnsMean,
    marketMean
  );
  const marketVariance = calculateVariance(marketReturns, marketMean);
  return marketVariance > 0 ? covariance / marketVariance : 0;
}

export function calculateAlpha(
  totalReturns: number,
  riskFreeRate: number,
  tradeCount: number,
  beta: number,
  marketTotalReturn: number
): number {
  return totalReturns - (riskFreeRate * tradeCount + beta * marketTotalReturn);
}

export function calculateCumulativeReturns(returnsArray: number[]): number[] {
  const cumulativeReturns = [];
  let cumulative = 0;
  for (const ret of returnsArray) {
    cumulative += ret;
    cumulativeReturns.push(cumulative);
  }
  return cumulativeReturns;
}
