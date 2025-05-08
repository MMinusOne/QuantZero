import optimizer from "./lib/optimizer";
import { OptimizationTarget, OptimizedParameterType } from "./types";

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

// const strategy = createStrategy((candles, parameters, store) => {
//   const closes = candles.map((candle) => candle[4]);
//   const ma = parameters.get("maType") === "exponential" ? ta.ema : ta.sma;
//   const shortMa = ma({ values: closes, period: parameters.get("shortMa") });
//   const longMa = ma({ values: closes, period: parameters.get("longMa") });
//   const latestClose = closes.at(-1);

//   if (shortMa > longMa) {
//     return new StrategyOrder({
//       side: "long",
//       size: store.get("capital") * 0.1,
//     });
//   } else if (shortMa < longMa) {
//     return new StrategyOrder({
//       side: "short",
//       size: store.get("capital") * 0.1,
//     });
//   }
// });

// const backtestResults = backtest(DataView, strategy, optimizedParameters, { 
//     concurrency: Concurrency.Full
// })

// const { winRate, profitFactor, sharpe, alpha, beta, totalReturns, cumulativeReturns } = backtestResults;