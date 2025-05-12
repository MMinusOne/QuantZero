import { parentPort } from "worker_threads";
import type { DataInstallationRequest } from "../types";
import ccxt, { Exchange, type OHLCV } from "ccxt";

const signleRequestLimit = 1000;

parentPort?.on(
  "message",
  async (dataInstallationRequestOptions: DataInstallationRequest) => {
    const {
      exchange: exchangeName,
      limit,
      pairs,
      threadNumber,
      since,
      timeframe,
    } = dataInstallationRequestOptions;
    //@ts-ignore
    const exchange: Exchange = new ccxt.pro[exchangeName]({
      defaultType: "futures",
    });
    let amountLeft = limit;
    let workDone = 0;
    const allPairData: { pair: string; data: OHLCV[] }[] = [];

    for (const pair of pairs) {
      const recursiveDownload = async () => {
        const amount = Math.min(signleRequestLimit, Math.max(1, amountLeft));
        const ohlcvCandles = await exchange.fetchOHLCV(
          `${pair}:USDT`,
          timeframe,
          since,
          amount
        );
        allPairData.push({ pair, data: ohlcvCandles });
        amountLeft -= amount;

        if (amountLeft === 0) {
          workDone += 1;
          console.log(workDone);
          if (workDone === pairs.length) {
            parentPort?.postMessage(allPairData);
          }
          return;
        } else {
          recursiveDownload();
        }
      };

      recursiveDownload();
    }
  }
);
