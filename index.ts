const optimizedParameters = optimizer([
    {
        name: 'shortMa',
        start: 0,
        end: 100,
        step: 1,
        type: OptimizedParameterType.Numerical
    },
    {
        name: 'shortMa',
        start: 100,
        end: 200,
        step: 1,
        type: OptimizedParameterType.Numerical
    },
    {
        name: 'maType',
        modes: ['ema', 'sma'],
        type: OptimizedParameterType.Mode
    }
], {
    targets: {
        [OptimizationTarget.Sharpe]: 40,
        [OptimizationTarget.WinRate]: 30,
        [OptimizationTarget.ProfitFactor]: 30,
    }
});

