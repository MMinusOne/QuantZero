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
import { v4 as uuidv4 } from "uuid";

// const binance = new ccxt.pro.binance();

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
    end: 200,
    step: 1,
    type: OptimizedParameterType.Numerical,
  },
]);
//@ts-ignore
import data from "./data/BNB_USDT_15m_10000.json";

const maStrategy = path.join(__dirname, "strategy", "ma.ts");

const backtestGroupId = uuidv4();

const backtestResults = await backtest(
  data!,
  maStrategy,
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

console.log(backtestResults.at(0))

const backtestGroupPath = `./backtests/${backtestGroupId}`;

fs.mkdirSync(backtestGroupPath);

for (const backtestResult of backtestResults) {
  fs.writeFileSync(
    `./${backtestGroupPath}/${backtestResult.backtestId}.json`,
    JSON.stringify(backtestResult)
  );
}
