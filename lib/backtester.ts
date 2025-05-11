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

const progressTracker = {
  startTime: Date.now(),
  lastUpdate: Date.now(),
  completionTimes: [] as number[],
};

export default function backtest(
  data: OHLCV[],
  strategyPath: string,
  parameters: any,
  options: BacktestOptions = defaultOptions
): Promise<BestBacktestResults[]> {
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
      concurrencyCount = Math.max(1, Math.ceil(cpus / 2));
    } else if (options.concurrency === ConcurrencyMode.Full) {
      concurrencyCount = Math.max(1, cpus);
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
        const percentageDone = Math.floor(percentageRatio * 100);

        process.stdout.write("\r\x1b[K");

        const barLength = 30;
        const filledLength = Math.floor(barLength * percentageRatio);
        const bar =
          "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

        process.stdout.write(
          `\r[${bar}] ${percentageDone}% | ${backtests.length}/${
            parametersMap.size
          } | ETA: ${calculateETA(
            backtests.length,
            parametersMap.size,
            progressTracker
          )}`
        );

        if (percentageRatio === 1) {
          console.log("\n✅ Backtesting complete!");
          const parametersByScore = rankBestParameters(
            backtests,
            options.targets
          );
          resolve(parametersByScore);
          cleanupWorkers(workers);
        }
      });
    }
  });
}

interface ProgressTracker {
  startTime: number;
  lastUpdate: number;
  completionTimes: number[];
}

function calculateETA(completed: number, total: number, tracker: ProgressTracker): string {
  if (completed === 0) return 'calculating...';
  
  const now = Date.now();
  const elapsed = now - tracker.lastUpdate;
  tracker.lastUpdate = now;
  
  if (completed > 1) {
    tracker.completionTimes.push(elapsed);
    if (tracker.completionTimes.length > 10) {
      tracker.completionTimes.shift();
    }
  }
  
  if (tracker.completionTimes.length === 0) return 'calculating...';
  
  const avgTime = tracker.completionTimes.reduce((a, b) => a + b, 0) / 
                 tracker.completionTimes.length;
  
  const remaining = (total - completed) * avgTime;
  
  if (remaining < 1000) return 'finishing...';
  if (remaining < 60000) return `${Math.ceil(remaining / 1000)}s`;
  if (remaining < 3600000) return `${Math.ceil(remaining / 60000)}m ${Math.ceil((remaining % 60000) / 1000)}s`;
  return `${Math.floor(remaining / 3600000)}h ${Math.ceil((remaining % 3600000) / 60000)}m`;
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
      backtest.stdDev * -(targets[OptimizationTarget.StdDev] || 0) +
      backtest.totalReturns * (targets[OptimizationTarget.TotalPL] || 0) +
      backtest.winRate * (targets[OptimizationTarget.WinRate] || 0) +
      backtest.profitFactor * (targets[OptimizationTarget.ProfitFactor] || 0);

    backtestResults.push({
      ...backtest,
      score,
    });
  }

  const bestBacktestResults = backtestResults.sort((a, b) => b.score - a.score);

  return bestBacktestResults;
}

function cleanupWorkers(workers: Worker[]) {
  for (const worker of workers) {
    worker.removeAllListeners();
    worker.terminate();
  }
}
