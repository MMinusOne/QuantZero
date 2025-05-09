import {
  ConcurrencyMode,
  OptimizationTarget,
  type BacktestOptions,
  type BacktestResults,
  type BestBacktestResults,
  type OHLCV,
} from "../types";
import type StrategyOrder from "./classes/StrategyOrder";
import { Worker } from "node:worker_threads";
import type Trade from "./Trade";
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
): BestBacktestResults {
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
  const cumalitiveReturns: number[] = [];
  let parameterSet: Map<string, any> = new Map();
  let winRate = 0;
  let profitFactor = 0;
  let sharpe = 0;
  let alpha = 0;
  let beta = 0;
  let totalReturns = 0;
  let stdDev = 0;
  let concurrencyCount = 1;
  let score = 0;

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
      const percentage = backtests.length / parametersMap.size;
      console.log(`Backtested ${percentage * 100}%`);

      if (percentage === 1) {
        const parametersByScore = rankBestParameters(
          backtests,
          options.targets
        );
        const bestParameterSet = parametersByScore.at(0);

        if(!bestParameterSet) return;

        cumalitiveReturns.push(...bestParameterSet.cumalitiveReturns);
        winRate = bestParameterSet.winRate;
        profitFactor = bestParameterSet.profitFactor;
        sharpe = bestParameterSet.sharpe;
        alpha = bestParameterSet.alpha;
        beta = bestParameterSet.beta;
        totalReturns = bestParameterSet.totalReturns;
        stdDev = bestParameterSet.stdDev;
        parameterSet = bestParameterSet.parameterSet;
        score = bestParameterSet.score;
      }
    });
  }

  return {
    winRate,
    alpha,
    beta,
    cumalitiveReturns,
    profitFactor,
    sharpe,
    totalReturns,
    stdDev,
    parameterSet,
    score,
  };
}

function rankBestParameters(
  backtests: BacktestResults[],
  targets: {
    [factor: string]: number;
  }
): BestBacktestResults[] {
  const backtestResults: BestBacktestResults[] = [];
  
  for(const backtest of backtests) {

  }

  return backtestResults;
}
