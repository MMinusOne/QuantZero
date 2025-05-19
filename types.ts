import type { Int } from "ccxt";
import Trade from "./lib/Trade";

export enum OptimizedParameterType {
  Numerical,
  Mode,
}

export enum OptimizationTarget {
  Sharpe,
  WinRate,
  ProfitFactor,
  TotalPL,
  Alpha,
  Beta,
  StdDev,
}

export type NumericalParameterOptimizationType = {
  name: string;
  start: number;
  end: number;
  step: number;
  type: OptimizedParameterType.Numerical;
};

export type ModeParameterOptimizationType = {
  name: string;
  modes: string[];
  type: OptimizedParameterType.Mode;
};

export type ParameterOptimizationType =
  | ModeParameterOptimizationType
  | NumericalParameterOptimizationType;

export type OHLCV = [number, number, number, number, number, number];

export interface BacktestOptions {
  asset?: string;
  concurrency?: ConcurrencyMode;
  initialCapital?: number;
  fees?: number;
  slippage?: number;
  endOnTotalLiquidation?: boolean;
  targets: { [factor: string]: number };
}

export interface BacktestResults {
  asset?: string;
  backtestId: string;
  executionTime: number;
  winRate: number;
  profitFactor: number;
  sharpe: number;
  alpha: number;
  beta: number;
  totalReturns: number;
  cumulativeReturns: number[];
  stdDev: number;
  parameterSet: Map<string, any> | any;
  trades: any[];
  tradeCount: number;
  dataStartDate: number;
}

export interface BestBacktestResults extends BacktestResults {
  backtestId: string;
  executionTime: number;
  score: number;
}

export interface TradeOptions {
  entry: number;
  side: "long" | "short";
}

export type Strategy = (
  candles: OHLCV[],
  parameters: Map<string, any>,
  store: Map<string, any>
) => Trade | Trade[] | null;

export interface BacktestingDataRequest {
  asset: string;
  data: OHLCV[];
  parameters: any;
  threadNumber: number;
  strategyPath: string;
  options: {
    fees: number;
    slippage: number;
    endOnTotalLiquidation: number;
  };
}

export interface DataInstallationRequest {
  exchange: string;
  pairs: string;
  timeframe: string;
  limit: number;
  since: Int;
  threadNumber: number;
}

export enum ConcurrencyMode {
  Full,
  Half,
  Single,
}
