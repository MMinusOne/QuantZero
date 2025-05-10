import backtest from "./lib/backtester";
import optimizer from "./lib/optimizer";
import fs from "fs";
import {
  ConcurrencyMode,
  OptimizationTarget,
  OptimizedParameterType,
  type OHLCV,
} from "./types";
import path from "path";
import ccxt from "ccxt";

const binance = new ccxt.pro.binance();

// const optimizedParameters = optimizer([
//   {
//     name: "shortMa",
//     start: 0,
//     end: 100,
//     step: 1,
//     type: OptimizedParameterType.Numerical,
//   },
//   {
//     name: "longMa",
//     start: 100,
//     end: 200,
//     step: 1,
//     type: OptimizedParameterType.Numerical,
//   },
//   {
//     name: "maType",
//     modes: ["exponential", "simple"],
//     type: OptimizedParameterType.Mode,
//   },
// ]);

const optimizedParameters = optimizer([
  {
    name: "period",
    start: 10,
    end: 101,
    step: 1,
    type: OptimizedParameterType.Numerical,
  },
]);

//@ts-ignore
const data: OHLCV[] = await binance.fetchOHLCV(
  "ETH/USDT",
  "15m",
  undefined,
  300,
  { paginate: true }
);

const maCrossOverPath = path.join(__dirname, "strategy", "ma.ts");

const backtestResults = await backtest(
  data,
  maCrossOverPath,
  optimizedParameters,
  {
    concurrency: ConcurrencyMode.Full,
    targets: {
      [OptimizationTarget.Sharpe]: 100,
      // [OptimizationTarget.WinRate]: 30,
      // [OptimizationTarget.ProfitFactor]: 30,
    },
  }
);

console.log(backtestResults);

fs.writeFileSync("./backtest.json", JSON.stringify(backtestResults));

// const { winRate, profitFactor, sharpe, alpha, beta, totalReturns, cumulativeReturns } = backtestResults;
