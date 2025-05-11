import type { OHLCV } from "ccxt";
import type { TradeOptions } from "../types";

export default class Trade {
  public readonly entry: number;
  public exit?: number;
  public readonly side: "long" | "short";
  public contracts: number = 1;
  public closed?: boolean = false;
  public pnl?: number;
  public leverage: number = 1;
  public tp?: number;
  public sl?: number;

  constructor(options: TradeOptions) {
    this.entry = options.entry;
    this.side = options.side;
  }

  public setLeverage(leverage: number = 1) {
    if (!this.closed) this.leverage = leverage;
    return this;
  }

  public setContracts(contracts: number = 1) {
    if (!this.closed) this.contracts = contracts;
    return this;
  }

  public setTP(tp: number = 1) {
    if (!this.closed) this.tp = tp;
    return this;
  }

  public setSL(sl: number = 1) {
    if (!this.closed) this.sl = sl;
    return this;
  }

  public update(candle: OHLCV) {
    if (this.closed) return this;
    
    const [timestamp, open, high, low, close] = candle;
    
    const currentPnl = this.calculatePnL(close!);
    
    if (currentPnl <= -100) {
      return this.close({ exit: this.side === "long" ? 0 : Number.MAX_SAFE_INTEGER });
    }
    
    if (this.sl !== undefined) {
      if (this.side === "long" && low! <= this.sl) {
        return this.close({ exit: this.sl });
      } else if (this.side === "short" && high! >= this.sl) {
        return this.close({ exit: this.sl });
      }
    }
    
    if (this.tp !== undefined) {
      if (this.side === "long" && high! >= this.tp) {
        return this.close({ exit: this.tp });
      } else if (this.side === "short" && low! <= this.tp) {
        return this.close({ exit: this.tp });
      }
    }
    
    return this;
  }

  private calculatePnL(currentPrice: number): number {
    return (this.side === "long"
      ? 100 * (currentPrice / this.entry) - 100
      : 100 * (this.entry / currentPrice) - 100) *
    this.leverage;
  }

  public close({ exit }: { exit: number }) {
    this.closed = true;
    this.exit = exit;
    this.pnl =
      (this.side === "long"
        ? 100 * (this.exit / this.entry) - 100
        : 100 * (this.entry / this.exit) - 100) *
      this.leverage *
      this.contracts;
    return this;
  }
}