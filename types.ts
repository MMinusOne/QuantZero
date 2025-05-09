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
  concurrency?: ConcurrencyMode;
  initialCapital?: number;
  fees?: number;
  slippage?: number;
  targets: { [factor: string]: number };
}

export interface BacktestResults {
  winRate: number;
  profitFactor: number;
  sharpe: number;
  alpha: number;
  beta: number;
  totalReturns: number;
  cumalitiveReturns: number[];
  stdDev: number;
}

export interface BestBacktestResults extends BacktestResults { 
    parameterSet: Map<string, any>;
    score: number;
}

export enum ConcurrencyMode {
  Full,
  Half,
  Single,
}
