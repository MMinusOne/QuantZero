import {
  OptimizationTarget,
  OptimizedParameterType,
  type ParameterOptimizationType,
} from "../types";

export default function optimizer(
  parameters: ParameterOptimizationType[],
  rules?: (parameters: any) => boolean
) {
  let combinations: any[] = [{}];
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

  compiledParameters.forEach((param) => {
    const newCombinations: any[] = [];

    combinations.forEach((combo) => {
      param.values.forEach((value) => {
        const newCombo = { ...combo };
        newCombo[param.name] = value;
        newCombinations.push(newCombo);
      });
    });

    combinations = newCombinations;
  });

  if (rules) combinations = combinations.filter((combo) => rules(combo));
  return combinations;
}
