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
import calculateDateFromTimeframeAndAmount, {
  calculateCandles,
} from "./utils/calculateDateFromTimeframeAndAmount";
import ms from "ms";
import { download } from "./scripts/download";

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
    name: "fastPeriod",
    start: 1,
    end: 150,
    step: 10,
    type: OptimizedParameterType.Numerical,
  },
  {
    name: "slowPeriod",
    start: 1,
    end: 200,
    step: 10,
    type: OptimizedParameterType.Numerical,
  },
  // {
  //   name: "period",
  //   start: 1,
  //   end: 50,
  //   step: 20,
  //   type: OptimizedParameterType.Numerical,
  // },
  // {
  //   name: "lowThreshold",
  //   start: 10,
  //   end: 40,
  //   step: 10,
  //   type: OptimizedParameterType.Numerical,
  // },
  // {
  //   name: "highThreshold",
  //   start: 60,
  //   end: 90,
  //   step: 10,
  //   type: OptimizedParameterType.Numerical,
  // },
]);
// todo: mean reversion, dynamic ma mean reversion, trend following & mean reversion combination
// explain ADF, CADF, C = Aa + Bb + Cc + Dd for making assets whose properties are more favorable
// explain spread, stationary assets
// TODO: graph RSI, see whats wrong with returns
// expand data 

const assets = [
  {
    pair: "BNB/USDT",
    path: "./data/BNB_USDT_4h_30000.json",
  },
  {
    pair: "BTC/USDT",
    path: "./data/BTC_USDT_4h_30000.json",
  },
  {
    pair: "ETH/USDT",
    path: "./data/ETH_USDT_4h_30000.json",
  },
  {
    pair: "SOL/USDT",
    path: "./data/SOL_USDT_4h_30000.json",
  },
  {
    pair: "LTC/USDT",
    path: "./data/LTC_USDT_4h_30000.json",
  },
  {
    pair: "LINK/USDT",
    path: "./data/LINK_USDT_4h_30000.json",
  },
  {
    pair: "ATOM/USDT",
    path: "./data/ATOM_USDT_4h_30000.json",
  },
  {
    pair: "AUDIO/USDT",
    path: "./data/AUDIO_USDT_4h_30000.json",
  },
  {
    pair: "ALGO/USDT",
    path: "./data/ALGO_USDT_4h_30000.json",
  },
  // {
  //   pair: "SUSHI/USDT",
  //   path: "./data/SUSHI_USDT_1h_19987.json",
  // },
];
//@ts-ignore

const strat = path.join(__dirname, "strategy", "double-ma.ts");

const backtestingPromises = assets.map(async (asset) => {
  const backtestGroupId = uuidv4();
  const { default: data } = await import(asset.path, {
    with: { type: "json" },
  });

  console.log(`Backtesting ${asset.pair} with ${data.length} data points`);

  const backtestResults = await backtest(
    data,
    strat,
    optimizedParameters,
    {
      asset: asset.pair,
      concurrency: ConcurrencyMode.Full,
      targets: {
        [OptimizationTarget.Sharpe]: 100,
        // [OptimizationTarget.WinRate]: 30,
        // [OptimizationTarget.ProfitFactor]: 30,
      },
    }
  );

  const backtestGroupPath = `./backtests/${backtestGroupId}`;

  fs.mkdirSync(backtestGroupPath);

  for (const backtestResult of backtestResults) {
    fs.writeFileSync(
      `./${backtestGroupPath}/${backtestResult.backtestId}.json`,
      JSON.stringify(backtestResult)
    );
  }
});

await Promise.all(backtestingPromises);
