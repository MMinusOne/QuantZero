import { bollingerbands } from "technicalindicators";
import Trade from "../lib/Trade";
import type { OHLCV } from "../types";

const OVER_HEAD = 10;

export default function strategy(
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) {
  const period = parameters.get("period");
  const stdDev = parameters.get("stddev");

  const closes = candles.slice(-period - OVER_HEAD).map((candle) => candle[4]);

  const bb = bollingerbands({
    values: closes,
    period: period,
    stdDev,
  }).at(-1);

  const latestClose: number = closes.at(-1)!;
  const latestTrade: Trade | null = store.get("trades")?.at(-1);

  if (!bb) return;

  let side: "long" | "short" | null = null;

  if (latestClose >= bb.upper) {
    side = "short";
  } else if (latestClose <= bb.lower) {
    side = "long";
  }

  if (!side) {
    return null;
  }

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
