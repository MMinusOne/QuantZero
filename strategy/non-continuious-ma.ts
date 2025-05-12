import Trade from "../lib/Trade";
import type { OHLCV } from "../types";
import { sma } from "technicalindicators";

export default function strategy(
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) {
  const closes = candles.map((candle) => candle[4]);
  const maPeriod = parameters.get("period");
  const ma = sma({ values: closes, period: maPeriod }).at(-1);
  const latestClose: number = closes.at(-1)!;
  const latestTrade: Trade | null = store.get("trades")?.at(-1);
  if (!ma) return;

  const side = latestClose > ma ? "long" : "short";

  if (!latestTrade) {
    new Trade({ entry: latestClose, side })
      .setLeverage(5)
      .setContracts(1)
      .setSL(1)
      .setTP(1);
    return;
  }

  if (!latestTrade.closed) return;

  return new Trade({ entry: latestClose, side })
    .setLeverage(5)
    .setContracts(1)
    .setSL(1)
    .setTP(1);
}

// export const preload = (candles: OHLCV[], store: Map<string, any>) => {

// }
