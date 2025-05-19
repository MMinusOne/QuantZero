import type { OHLCV } from "ccxt";
import type { TradeOptions } from "../types";

export default class Trade {
  public entry?: number;
  public exit?: number;
  public entryDate?: number;
  public exitDate?: number;
  public side?: "long" | "short";
  public contracts: number = 1;
  public closed?: boolean = false;
  public pnl?: number;
  public unrealizedPnL: number = 0;
  public leverage: number = 1;
  public tp?: number;
  public sl?: number;
  private currentCandle?: OHLCV;
  private liquidated: boolean = false;

  constructor(options?: TradeOptions) {}

  public getProperties() {
    return {
      entry: this.entry,
      exit: this.exit,
      entryDate: this.entryDate,
      exitDate: this.exitDate,
      side: this.side,
      contracts: this.contracts,
      closed: this.closed,
      pnl: this.pnl,
      unrealizedPnL: this.unrealizedPnL,
      leverage: this.leverage,
      tp: this.tp,
      sl: this.sl,
      currentCandle: this.currentCandle,
      liquidated: this.liquidated,
    };
  }

  public setSide(side: "long" | "short") {
    this.side = side;
    return this;
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
    this.currentCandle = candle;
    if (!this.entry) this.entry = this.currentCandle[4]!;
    if (!this.entryDate) this.entryDate = this.currentCandle[0];

    const [timestamp, open, high, low, close] = this.currentCandle;

    const currentPnl = this.calculatePnL();
    this.unrealizedPnL = currentPnl;

    if (currentPnl <= -100) {
      this.liquidated = true;
      return this.close();
    }

    if (this.sl !== undefined) {
      if (this.side === "long" && low! <= this.sl) {
        return this.close();
      } else if (this.side === "short" && high! >= this.sl) {
        return this.close();
      }
    }

    if (this.tp !== undefined) {
      if (this.side === "long" && high! >= this.tp) {
        return this.close();
      } else if (this.side === "short" && low! <= this.tp) {
        return this.close();
      }
    }

    return this;
  }

  private calculatePnL(): number {
    if (!this.currentCandle) return 0;
    const exit = this.currentCandle[4]!;

    const basePnL =
      this.side === "long"
        ? 100 * (exit / this.entry!) - 100
        : 100 - 100 * (exit / this.entry!);

    const leveragedPnL = basePnL * this.leverage * this.contracts;

    return leveragedPnL;
  }

  public close() {
    this.closed = true;
    if (!this.exit && this.currentCandle) {
      const close = this.currentCandle[4]!;
      this.exit = close;
      if (this.tp) {
        if (this.tp <= close) {
          this.exit = this.tp;
        }
      } else if (this.sl) {
        if (this.sl >= close) {
          this.exit = this.sl;
        }
      }
    }
    if (!this.exitDate && this.currentCandle)
      this.exitDate = this.currentCandle[0]!;
    this.pnl = this.calculatePnL();
    this.unrealizedPnL = 0;
    return this;
  }
}
