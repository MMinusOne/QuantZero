import {
  ConcurrencyMode,
  type BacktestOptions,
  type BacktestResults,
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
};

export default function backtest(
  data: OHLCV[],
  strategyPath: string,
  parameters: any,
  options: BacktestOptions = defaultOptions
): BacktestResults {
  const parametersMap = new Map();
  const store = new Map();
  store.set("initialCapital", options.initialCapital);
  store.set("trades", []);

  Object.keys(parameters).forEach((parameterKey) => {
    const parameterValue = parameters[parameterKey];
    parametersMap.set(parameterKey, parameterValue);
  });

  const trades: Trade[] = [];
  const cumalitiveReturns: number[] = [];
  let winRate = 0;
  let profitFactor = 0;
  let sharpe = 0;
  let alpha = 0;
  let beta = 0;
  let totalReturns = 0;
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
    worker?.postMessage({ parameters: value , threadNumber: currentWorker, strategyPath });
    currentWorker += 1;
  });

  return {
    winRate,
    alpha,
    beta,
    cumalitiveReturns,
    profitFactor,
    sharpe,
    totalReturns,
  };
}
