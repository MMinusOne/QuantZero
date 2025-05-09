// (
//     candles: OHLCV[],
//     parameters: Map<string, any>,
//     store: Map<string, any>
//   ) => Trade | null

interface BacktestingRequest {

}

import { parentPort } from 'node:worker_threads';

parentPort?.on('message', (data) => {
    console.log('data', data);
})