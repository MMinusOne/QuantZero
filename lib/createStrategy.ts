import type { OHLCV, Trade } from "../types";

export default function createStrategy(
  strategy: (
    candles: OHLCV[],
    parameters: Map<string, any>,
    store: Map<string, any>
  ) => Omit<Omit<Trade, "entry">, "exit"> | null
) {
  return strategy;
}
