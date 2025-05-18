import Trade from "../lib/Trade";
import type { OHLCV } from "../types";
import { sma, ema, wma } from "technicalindicators";

const OVER_HEAD = 10;

export default function strategy(
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) {
  const maPeriod = parameters.get("period");
  const closes = candles
    .slice(-maPeriod - OVER_HEAD)
    .map((candle) => candle[4]);
  const ma = sma({ period: maPeriod, values: closes }).at(-1);
  const latestClose: number = closes.at(-1)!;
  const latestTrade: Trade | null = store.get("trades")?.at(-1);
  if (!ma) return;

  const side = latestClose > ma ? "long" : "short";

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
