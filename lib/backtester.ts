import {
  ConcurrencyMode,
  OptimizationTarget,
  type BacktestOptions,
  type BacktestResults,
  type BestBacktestResults,
  type OHLCV,
} from "../types";
import { Worker } from "node:worker_threads";
import os from "os";

const cpus = os.cpus().length;

const defaultOptions: BacktestOptions = {
  concurrency: ConcurrencyMode.Full,
  fees: 0,
  targets: {
    [OptimizationTarget.Sharpe]: 40,
    [OptimizationTarget.WinRate]: 30,
    [OptimizationTarget.ProfitFactor]: 30,
  },
};

export default function backtest(
  data: OHLCV[],
  strategyPath: string,
  parameters: any,
  options: BacktestOptions = defaultOptions
): Promise<BestBacktestResults> {
  return new Promise((resolve, reject) => {
    let totalTargetScore = 0;

    Object.keys(options.targets).forEach((targetKey) => {
      const targetValue = options.targets[targetKey] || 0;
      totalTargetScore += targetValue;
    });

    if (totalTargetScore !== 100) {
      throw `Total score does not equal 100, its ${totalTargetScore}`;
    }

    const parametersMap = new Map();
    const store = new Map();
    store.set("initialCapital", options.initialCapital);
    store.set("trades", []);

    Object.keys(parameters).forEach((parameterKey) => {
      const parameterValue = parameters[parameterKey];
      parametersMap.set(parameterKey, parameterValue);
    });

    const backtests: BacktestResults[] = [];

    let concurrencyCount = 1;

    if (options.concurrency === ConcurrencyMode.Half) {
      concurrencyCount = Math.ceil(cpus / 2);
    } else if (options.concurrency === ConcurrencyMode.Full) {
      concurrencyCount = cpus;
    }

    const workers: Worker[] = [];

    for (let i = 0; i < concurrencyCount; i++) {
      const worker = new Worker("./workers/backtesting.ts");
      workers.push(worker);
    }

    let currentWorker = 0;

    parametersMap.forEach((value, key) => {
      if (!workers.at(currentWorker)) currentWorker = 0;
      const worker = workers.at(currentWorker);
      worker?.postMessage({
        data,
        parameters: value,
        threadNumber: currentWorker,
        strategyPath,
        optimizationRules: options,
      });
      currentWorker += 1;
    });

    for (const worker of workers) {
      worker.on("message", (backtestResults: BacktestResults) => {
        backtests.push(backtestResults);
        const percentageRatio: number = backtests.length / parametersMap.size;
        const percentageDone = parseFloat(percentageRatio.toFixed(2)) * 100;
        console.log(`Backtested ${percentageDone}%`);

        if (percentageRatio === 1) {
          const parametersByScore = rankBestParameters(
            backtests,
            options.targets
          );

          const bestParameterSet = parametersByScore.at(-1);

          if (!bestParameterSet) return;

          const {
            backtestId,
            executionTime,
            cumulativeReturns,
            winRate,
            profitFactor,
            sharpe,
            alpha,
            beta,
            totalReturns,
            stdDev,
            parameterSet,
            score,
          } = bestParameterSet;

          resolve({
            backtestId,
            executionTime,
            cumulativeReturns,
            winRate,
            profitFactor,
            sharpe,
            alpha,
            beta,
            totalReturns,
            stdDev,
            parameterSet,
            score,
          });
        }
      });
    }
  });
}

function rankBestParameters(
  backtests: BacktestResults[],
  targets: {
    [factor: string]: number;
  }
): BestBacktestResults[] {
  const backtestResults: BestBacktestResults[] = [];

  for (const backtest of backtests) {
    let score =
      backtest.sharpe * (targets[OptimizationTarget.Sharpe] || 0) +
      backtest.alpha * (targets[OptimizationTarget.Alpha] || 0) +
      backtest.beta * (targets[OptimizationTarget.Beta] || 0) +
      backtest.stdDev * (targets[OptimizationTarget.StdDev] || 0) +
      backtest.totalReturns * (targets[OptimizationTarget.TotalPL] || 0) +
      backtest.winRate * (targets[OptimizationTarget.WinRate] || 0) +
      backtest.profitFactor * (targets[OptimizationTarget.ProfitFactor] || 0);

    backtestResults.push({
      ...backtest,
      score,
    });
  }

  const bestBacktestResults = backtestResults.sort((a, b) => a.score - b.score);

  return bestBacktestResults;
}

//TODO: normilization, some parameters are better when lower, optimization and return correct values
