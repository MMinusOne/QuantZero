import { parentPort } from "node:worker_threads";
import type { OHLCV } from "../types";
import type Trade from "../lib/Trade";
import { v4 as uuidv4 } from "uuid";
import { performance } from "perf_hooks";

type Strategy = (
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) => Trade | null;

interface BacktestingDataRequest {
  data: OHLCV[];
  parameters: any;
  threadNumber: number;
  strategyPath: string;
  options: {
    fees: number;
    slippage: number;
  };
}

parentPort?.on("message", async (data: BacktestingDataRequest) => {
  const backtestId = uuidv4();
  const startTime = performance.now();
  //@ts-ignore
  const { default: strategy } = (await import(data.strategyPath)) as Strategy;
  const parametersMap = createMapFromParameters(data.parameters);
  const store: Map<string, any> = new Map();
  const backtestResults = await backtest(
    data.data,
    strategy,
    parametersMap,
    store
  );
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  parentPort?.postMessage({
    backtestId,
    executionTime,
    ...backtestResults,
  });
});

function createMapFromParameters(parameters: any): Map<string, any> {
  const parametersMap: Map<string, any> = new Map();

  for (const key of Object.keys(parameters)) {
    const value = parameters[key];
    parametersMap.set(key, value);
  }
  return parametersMap;
}

async function backtest(
  candles: OHLCV[],
  strategy: Strategy,
  parameters: Map<string, any>,
  store: Map<string, any>
) {
  const trades: Trade[] = [];

  for (const candleI in candles) {
    const candleIndex = Number(candleI);
    const candle = candles.at(candleIndex);
    const candlesWindow = candles.toSpliced(candleIndex, candles.length);
    const trade = await strategy(candlesWindow, parameters, store);

    if (trade) {
      trades.push(trade);
      store.set("trades", trades);
    }

    for(const trade of trades) {
      trade.update(candle!);
    }
  }

  let totalReturns = 0;
  const returnsArray: number[] = [];
  let winCount = 0;
  let lossCount = 0;
  let grossProfit = 0;
  let grossLoss = 0;

  const marketReturns: number[] = [];
  const riskFreeRate = 0.02 / 365;

  for (const trade of trades) {
    if (!trade.closed || trade.pnl === undefined) continue;

    const tradeReturn = trade.pnl;
    returnsArray.push(tradeReturn);
    totalReturns += tradeReturn;

    if (tradeReturn > 0) {
      winCount++;
      grossProfit += tradeReturn;
    } else {
      lossCount++;
      grossLoss += Math.abs(tradeReturn);
    }

    const tradeIndex = candles.findIndex(
      (candle) => candle[0] === (trade.exit ? trade.exit : trade.entry)
    );
    if (tradeIndex > 0 && tradeIndex < candles.length - 1) {
      const marketReturn =
        ((candles[tradeIndex + 1]![4] - candles[tradeIndex]![4]) /
          candles[tradeIndex]![4]) *
        100;
      marketReturns.push(marketReturn);
    } else {
      marketReturns.push(0);
    }
  }

  const winRate = trades.length > 0 ? winCount / trades.length : 0;

  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgReturn =
    returnsArray.length > 0
      ? returnsArray.reduce((sum, ret) => sum + ret, 0) / returnsArray.length
      : 0;

  const stdDev =
    returnsArray.length > 1
      ? Math.sqrt(
          returnsArray.reduce(
            (sum, ret) => sum + Math.pow(ret - avgReturn, 2),
            0
          ) /
            (returnsArray.length - 1)
        )
      : 1;

  const sharpe =
    stdDev > 0
      ? ((avgReturn - riskFreeRate) / stdDev) * Math.sqrt(252) // Annualized
      : 0;

  let beta = 0;
  if (marketReturns.length === returnsArray.length && returnsArray.length > 1) {
    const marketAvg =
      marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
    const covariance =
      returnsArray.reduce(
        (sum, ret, i) =>
          sum + (ret - avgReturn) * (marketReturns[i]! - marketAvg),
        0
      ) /
      (returnsArray.length - 1);

    const marketVariance =
      marketReturns.reduce(
        (sum, ret) => sum + Math.pow(ret - marketAvg, 2),
        0
      ) /
      (marketReturns.length - 1);

    beta = marketVariance > 0 ? covariance / marketVariance : 0;
  }

  const marketTotalReturn = marketReturns.reduce((sum, ret) => sum + ret, 0);
  const alpha =
    totalReturns -
    (riskFreeRate * returnsArray.length + beta * marketTotalReturn);

  const cumulativeReturns = [];
  let cumulative = 0;
  for (const ret of returnsArray) {
    cumulative += ret;
    cumulativeReturns.push(cumulative);
  }

  const backtestResults = {
    winRate,
    profitFactor,
    sharpe,
    alpha,
    beta,
    totalReturns,
    cumulativeReturns,
    trades: trades.length,
    avgReturn,
    stdDev,
    parameterSet: parameters,
  };
  return backtestResults;
}
