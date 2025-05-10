export interface TradeOptions {
  entry: number;
  side: "long" | "short";
}

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
