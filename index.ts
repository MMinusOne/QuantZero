import createStrategy from "./lib/createStrategy";
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

const strategy = createStrategy((candles, parameters, manager, store) => {
  const closes = candles.map((candle) => candle[4]);
  const ma = parameters.get("maType") === "exponential" ? ta.ema : ta.sma;
  const shortMa = ma({ values: closes, period: parameters.get("shortMa") });
  const longMa = ma({ values: closes, period: parameters.get("longMa") });
  const latestClose = closes.at(-1);
  const latestTrade = manager.positions.at(-1)
  const side = shortMa > longMa ? "long": "short";
  const oppositeSide = side === "short" ? "long": "short";

  if(latestTrade.side === oppositeSide && !latestTrade.closed) latestTrade.close();

  // entry and exit is captured by manager
  manager.createPosition({ side })
});

// const backtestResults = backtest(data, strategy, optimizedParameters, { 
//     concurrency: Concurrency.Full
// })

// const { winRate, profitFactor, sharpe, alpha, beta, totalReturns, cumulativeReturns } = backtestResults;