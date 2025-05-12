import Trade from "../lib/Trade";
import type { OHLCV } from "../types";
import { sma, ema } from "technicalindicators";

export default function strategy(
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) {
  const closes = candles.map((candle) => candle[4]);
  const maPeriod = parameters.get("period");
  const leverage = parameters.get("leverage");
  const ma = sma({ values: closes, period: maPeriod }).at(-1);
  const latestClose: number = closes.at(-1)!;
  const latestTrade: Trade | null = store.get("trades")?.at(-1);
  if (!ma) return;

  const side = latestClose > ma ? "long" : "short";

  if (latestTrade) {
    if (latestTrade.side !== side && !latestTrade.closed) {
      latestTrade?.close({ exit: latestClose });
      const trade = new Trade({ entry: latestClose, side })
        .setContracts(1)
        .setLeverage(leverage);
      return trade;
    }
  } else {
    const trade = new Trade({ entry: latestClose, side })
      .setContracts(1)
      .setLeverage(leverage);
    return trade;
  }
}

// export const preload = (candles: OHLCV[], store: Map<string, any>) => {
  
// }