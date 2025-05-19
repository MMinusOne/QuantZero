import Trade from "../lib/Trade";
import type { OHLCV } from "../types";
import { sma, ema, wma } from "technicalindicators";

const OVER_HEAD = 10;

export default function strategy(
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) {
  const slowPeriod = parameters.get("slowPeriod");
  const fastPeriod = parameters.get("fastPeriod");
  const closes = candles
    .slice(-slowPeriod - OVER_HEAD)
    .map((candle) => candle[4]);
  const slowMa = sma({ period: slowPeriod, values: closes }).at(-1);
  const fastMa = sma({ period: fastPeriod, values: closes }).at(-1);

  const latestClose: number = closes.at(-1)!;
  const latestTrade: Trade | null = store.get("trades")?.at(-1);

  if (!slowMa || !fastMa) return;

  const side = fastMa > slowMa ? "long" : "short";

  if (!latestTrade)
    return new Trade().setSide(side).setContracts(1).setLeverage(1);

  if (latestTrade.side === side) return null;
  if (latestTrade.closed) return new Trade().setSide(side).setContracts(1).setLeverage(1);

  latestTrade?.close();
  return new Trade().setSide(side).setContracts(1).setLeverage(1);
}
