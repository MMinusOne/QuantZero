export enum OptimizedParameterType { 
    Numerical,
    Mode
 }
 
 export enum OptimizationTarget { 
     Sharpe,
     WinRate,
     ProfitFactor,
     TotalPL,
     Alpha,
     Beta
 }
 
 export type NumericalParameterOptimizationType = { 
     name: string;
     start: number;
     end: number;
     step: number;
     type: OptimizedParameterType.Numerical
 }
 
 export type ModeParameterOptimizationType = { 
     name: string;
     modes: string[];
     type: OptimizedParameterType.Mode
 }
 
 export type ParameterOptimizationType = ModeParameterOptimizationType | NumericalParameterOptimizationType;
 
 export interface OptimizerConfig { 
     targets: { [factor: string]: number }
 }
 
 export enum ConcurrencyMode { 
     Full, 
     Half,
     Single
 }