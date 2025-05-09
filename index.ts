import backtest from "./lib/backtester";
import optimizer from "./lib/optimizer";
import Trade from "./lib/Trade";
import {
  ConcurrencyMode,
  OptimizationTarget,
  OptimizedParameterType,
  type OHLCV,
} from "./types";
import ta from "technicalindicators";
import ccxt from "ccxt";

const binance = new ccxt.pro.binance();

const optimizedParameters = optimizer(
  [
    {
      name: "shortMa",
      start: 0,
      end: 100,
      step: 1,
      type: OptimizedParameterType.Numerical,
    },
    {
      name: "longMa",
      start: 100,
      end: 200,
      step: 1,
      type: OptimizedParameterType.Numerical,
    },
    {
      name: "maType",
      modes: ["exponential", "simple"],
      type: OptimizedParameterType.Mode,
    },
  ],
  {
    targets: {
      [OptimizationTarget.Sharpe]: 40,
      [OptimizationTarget.WinRate]: 30,
      [OptimizationTarget.ProfitFactor]: 30,
    },
  }
);



const data: OHLCV[] = await binance.fetchOHLCV(
  "ETH/USDT",
  "1m",
  undefined,
  10_000,
  { paginate: true }
)!;

const maCrossOverPath = "./strategy/ma-crossover.ts"

const backtestResults = backtest(data, maCrossOverPath, optimizedParameters, {
  concurrency: ConcurrencyMode.Full,
});

// const { winRate, profitFactor, sharpe, alpha, beta, totalReturns, cumulativeReturns } = backtestResults;
