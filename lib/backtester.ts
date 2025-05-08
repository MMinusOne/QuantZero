import type { BacktestOptions, BacktestResults, OHLCV, Trade } from "../types";
import type StrategyOrder from "./classes/StrategyOrder";

export default function backtest(
  data: OHLCV[],
  strategy: (
    candles: OHLCV[],
    parameters: Map<string, any>,
    store: Map<string, any>
  ) => Trade | null,
  parameters: any,
  options: BacktestOptions
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

  for (let i = 0; i < data.length; i++) {
    const trade: Trade | null = strategy(
      data.splice(0, i),
      parametersMap,
      store
    );
    const candle = data.at(i);

    if (trade) {
      trades.push(trade);
      store.set("trades", [...store.get("trades"), trade]);
    }
  }

  console.log(trades);

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
