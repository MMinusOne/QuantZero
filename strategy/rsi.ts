import Trade from "../lib/Trade";
import type { OHLCV } from "../types";
import { rsi } from "technicalindicators";

const OVER_HEAD = 10;

export default function strategy(
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) {
  const rsiPeriod = parameters.get("period");
  const lowThreshold = parameters.get("lowThreshold");
  const highThreshold = parameters.get("highThreshold");
  const closes = candles
    .slice(-rsiPeriod - OVER_HEAD)
    .map((candle) => candle[4]);
  const latestRsi = rsi({ period: rsiPeriod, values: closes }).at(-1);
  const latestClose: number = closes.at(-1)!;
  const latestTrade: Trade | null = store.get("trades")?.at(-1);

  if (!latestRsi) return;

  const side =
    latestRsi <= lowThreshold
      ? "long"
      : latestRsi >= highThreshold
      ? "short"
      : undefined;

  if (!side) return;

  if (latestTrade) {
    if (latestTrade.side !== side && !latestTrade.closed) {
      latestTrade?.close({ exit: latestClose });
      const trade = new Trade({ entry: latestClose, side })
        .setContracts(1)
        .setLeverage(1);
      return trade;
    }
  } else {
    const trade = new Trade({ entry: latestClose, side })
      .setContracts(1)
      .setLeverage(1);
    return trade;
  }
}
