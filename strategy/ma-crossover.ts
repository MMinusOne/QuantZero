import Trade from "../lib/Trade";
import type { OHLCV } from "../types";
import { sma, ema } from "technicalindicators";

export default function strategy(
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) {
  const closes = candles.map((candle) => candle[4]);
  const ma = parameters.get("maType") === "exponential" ? ema : sma;
  const shortMa = ma({ values: closes, period: parameters.get("shortMa") }).at(
    -1
  );
  const longMa = ma({ values: closes, period: parameters.get("longMa") }).at(
    -1
  );
  const latestClose: number = closes.at(-1)!;
  const latestTrade: Trade | null = store.get("trades")?.at(-1);
  if (!shortMa || !longMa) return;
  const side = shortMa > longMa ? "long" : "short";
  const oppositeSide = side === "short" ? "long" : "short";

  if (latestTrade?.side !== side && !latestTrade?.closed) {
    latestTrade?.close({ exit: latestClose });
    return null;
  }

  const trade = new Trade({ entry: latestClose, side })
    .setContracts(1)
    .setLeverage(1);

  return trade;
}
