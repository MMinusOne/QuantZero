import {
  OptimizationTarget,
  OptimizedParameterType,
  type OptimizerConfig,
  type ParameterOptimizationType,
} from "../types";

const defaultConfig: OptimizerConfig = {
  targets: {
    [OptimizationTarget.Sharpe]: 40,
    [OptimizationTarget.WinRate]: 30,
    [OptimizationTarget.ProfitFactor]: 30,
  },
};

export default function optimizer(
  parameters: ParameterOptimizationType[],
  config: OptimizerConfig = defaultConfig
) {
  const combinations: any[] = [];
  const compiledParameters: { name: string; values: any[] }[] = [];

  for (const parameter of parameters) {
    const values: any[] = [];

    if (parameter.type === OptimizedParameterType.Numerical) {
      const iterations = (parameter.end - parameter.start) / parameter.step;
      let currentValue = parameter.start;

      for (let i = 0; i < iterations; i++) {
        values.push(currentValue + parameter.step);
        currentValue += parameter.step;
      }
    }

    if (parameter.type === OptimizedParameterType.Mode) {
      for (const mode of parameter.modes) {
        values.push(mode);
      }
    }

    compiledParameters.push({ name: parameter.name, values });
  }

  console.log(compiledParameters)
}
