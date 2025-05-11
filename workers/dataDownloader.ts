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
      pair,
      threadNumber,
      since,
      timeframe,
    } = dataInstallationRequestOptions;
    let amountLeft = limit;
    //@ts-ignore
    const exchange: Exchange = new ccxt.pro[exchangeName]({
      defaultType: "futures"
    });
    const data: OHLCV[] = [];
  
    const recursiveDownload = async () => {
      const amount = Math.min(signleRequestLimit, Math.max(1, amountLeft));
      const ohlcvCandles = await exchange.fetchOHLCV(
        `${pair}:USDT`,
        timeframe,
        since,
        amount
      );
      data.push(...ohlcvCandles);
      amountLeft -= amount;

      if (amountLeft === 0) {
        parentPort?.postMessage(data);
      } else {
        recursiveDownload();
      }
    };

    recursiveDownload();
  }
);
