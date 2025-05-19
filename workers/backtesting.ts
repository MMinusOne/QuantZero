import { parentPort } from "node:worker_threads";
import type { BacktestingDataRequest, OHLCV, Strategy } from "../types";
import type Trade from "../lib/Trade";
import { v4 as uuidv4 } from "uuid";
import { performance } from "perf_hooks";
import {
  calculateAlpha,
  calculateBeta,
  calculateCumulativeReturns,
  calculateMean,
  calculateProfitFactor,
  calculateSharpeRatio,
  calculateStandardDeviation,
  calculateWinRate,
} from "../utils/performanceCalculations";

let strategy: Strategy;

parentPort?.on("message", async (data: BacktestingDataRequest) => {
  const backtestId = uuidv4();
  const startTime = performance.now();
  //@ts-ignore
  if (!strategy) {
    const { default: strategyFn } = (await import(data.strategyPath)) as {
      default: Strategy;
    };
    strategy = strategyFn;
  }
  const parametersMap = createMapFromParameters(data.parameters);
  const store: Map<string, any> = new Map();
  const backtestResults = await backtest(
    data.asset,
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
    dataStartDate: data.data.at(0)![0],
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
  asset: string,
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
    let responseTrades: Trade | Trade[] | null = await strategy(
      candlesWindow,
      parameters,
      store
    );

    if (responseTrades) {
      if (!Array.isArray(responseTrades)) responseTrades = [responseTrades];

      if (responseTrades && responseTrades?.length > 0) {
        trades.push(...responseTrades);
        store.set("trades", trades);
      }
    }

    for (const trade of trades) {
      trade.update(candle!);
      // TODO: add unrealized PNL check if trade hits total liquidation
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

  const winRate = calculateWinRate(winCount, trades.length);
  const profitFactor = calculateProfitFactor(grossProfit, grossLoss);

  const avgReturn = calculateMean(returnsArray);
  const stdDev = calculateStandardDeviation(returnsArray, avgReturn);
  const sharpe = calculateSharpeRatio(avgReturn, stdDev, riskFreeRate);

  const marketMean = calculateMean(marketReturns);
  const beta = calculateBeta(
    returnsArray,
    marketReturns,
    avgReturn,
    marketMean
  );

  const marketTotalReturn = marketReturns.reduce((sum, ret) => sum + ret, 0);
  const alpha = calculateAlpha(
    totalReturns,
    riskFreeRate,
    returnsArray.length,
    beta,
    marketTotalReturn
  );

  const cumulativeReturns = calculateCumulativeReturns(returnsArray);

  const backtestResults = {
    asset: asset,
    winRate,
    profitFactor,
    sharpe,
    alpha,
    beta,
    totalReturns,
    cumulativeReturns,
    trades: trades.map((trade) => trade.getProperties()),
    tradeCount: trades.length,
    avgReturn,
    stdDev,
    parameterSet: parameters,
  };
  return backtestResults;
}
