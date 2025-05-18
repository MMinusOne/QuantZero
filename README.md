# Quant Zero

Hello everyone, this `README.md` will contain everything you need to know about QuantZero

## Introduction

Quant Zero is an open-source backtesting framework made by `MMinusOne`, the purpose of this backtesting framework is to be able to backtest and optimize parameters of algorithmic trading strategies in a robust way

### Advantages

- Quant Zero's multi-threaded implementation allows it to utilize all the CPU threads resulting in way quicker backtests

- Quant Zero is developer friendly and robust, allowing to make all kinds of strategies aslong as you have the data, all you need to do is implement the logic

- Quant Zero is actively maintained by `MMinusOne`, and I offer support to whomever needs it, feel free to contact me

## Features

### Backtester

The backtester works with OHLCV[] data, with the parameters, and can use concurrency to speed up the proccess up to `N` times where `N` is the amount of CPU threads available on the system

Examples of how to use the backtester can be seen in `index.ts` and `strategy/ma.ts` for a simple moving average strategy

### Optimizer

You can specify the parameters that the algotrading system depends on, each parameter is considered a dimension

Example: moving average period, leverage, TP, SL, all those would be a dimension which is a parameter

The way the optimizer works is that it will combine all those dimensions into all possible combinations which will then be tested by the backtest

#### Numerical Parameters

Numerical parameters have unique properties: `start`, `end`, `step` - the numbers would start from `start`, end at `end`, and move in steps of `step`

#### Mode Parameters

Mode parameters have unique property: `modes`, which would be an array of things to switch between

#### Example

```typescript
const optimizedParameters = optimizer([
  {
    name: "period",
    start: 10,
    end: 100,
    step: 10,
    type: OptimizedParameterType.Numerical,
  },
  {
    name: "type",
    modes: ["exponential", "simple"],
    type: OptimizedParameterType.Mode,
  },
]);
```

This would make a combination of all these parameters (dimensions)

### Utility Scripts

- Using `bun run download`, you can choose whatever exchange you want to get whatever data you want with whatever specified timeframe and whatever amount of candles, you can also speed up the proccess by using concurrency

## Current Future Features / Todos

- Built-in backtest and data visualization
- Include fees, slippage, rebates, and all other factors
- Backtester working with more than OHLCV data
- Re-check calculations of things
- Fix multiple pairs download
- Strategy ends with position liquidates due to -100% PnL
- Ratio between strategy / buy-and-hold performance indicator