import { CreateTradeOptions, TRADE_KEY } from '@/types'
import { Trade } from '@/lib/Trade'
import { Strategy } from '@/lib/Strategy'
import { OHLCV } from 'ccxt'

export class TradeManager {
  private trades = new Map<string, Trade>()
  private strategy: Strategy

  constructor(strategy: Strategy) {
    this.strategy = strategy
  }

  protected getTrade(id: string): Trade | null {
    return this.trades.get(id) || null
  }

  public onUpdate(update: OHLCV, updates: OHLCV[]) {
    for (const trade of this.trades.values()) {
      if (!trade.getData()[TRADE_KEY.isClosed]) continue
      trade.onUpdate(update, updates)
    }
  }

  protected createTrade(options: CreateTradeOptions): Trade {
    const trade = new Trade({
      orderType: options.orderType,
      pair: this.strategy.strategyOptions.pair,
      positionSize: options.size,
      positionType: options.positionType,
      leverage: options.leverage ?? 1,
      open: options.open ?? false,
      SL: options.riskOptions?.SL,
      TP: options.riskOptions?.TP,
      isLive: false,
    })

    this.trades.set(trade.id, trade)
    return trade
  }

  protected closeTrade(tradeId: string) {
    this.getTrade(tradeId)?.close()
  }
}
