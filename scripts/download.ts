import ccxt, { type Exchange, type Int, type OHLCV } from "ccxt";
import inquirer from "inquirer";
import os from "os";
import fs from "fs";
import path from "path";
import calculateDateFromTimeframeAndAmount from "../utils/calculateDateFromTimeframeAndAmount";
import ms from "ms";

const cpus = os.cpus();
let exchange: Exchange = new ccxt.pro.binance();

const pageSize = 20;

const results = await inquirer.prompt([
  {
    name: "exchange",
    message: "Which exchange would you like to fetch data from?",
    type: "select",
    pageSize,
    choices: ccxt.exchanges.sort().filter((exchangeName: string) => {
      //@ts-ignore
      return new ccxt[exchangeName]().has["fetchOHLCV"];
    }),
    default: "binance",
  },
  {
    name: "pairs",
    message: "Which pair would you like to install data for?",
    type: "checkbox",
    required: true,
    pageSize,
    choices: async (session) => {
      //@ts-ignore
      exchange = new ccxt[session.exchange]();
      await exchange.loadMarkets();
      const pairs = Object.keys(exchange.markets)
        .filter((p) => p.split("/").at(-1) === "USDT")
        .sort();
      return pairs;
    },
  },
  {
    name: "timeframe",
    message: "Which timeframe would you like?",
    type: "select",
    pageSize,
    choices: () => {
      return Object.keys(exchange.timeframes);
    },
  },
  {
    name: "limit",
    message: "How many candles would you like?",
    type: "number",
    validate: (v) => {
      if (!v) return "No value was provided";
      if (Math.abs(v) === Infinity) return "The value cannot be +/-Infinity";
      if (v < 0 || v > 10_000_000)
        return "Can't install that much data or negative data";
      return true;
    },
  },
]);

export async function download(options: typeof results) {
  let data: { pair: string; data: OHLCV[]; latestTime: Int }[] = [];

  const loadingFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  let loadingIndex = 0;
  let dataDone = 0;
  const allAmountOfCandles = options.pairs.length * options.limit;
  const loadingInterval = setInterval(() => {
    const dataDoneRatio = dataDone / allAmountOfCandles;
    process.stdout.write(
      `\r${
        loadingFrames[loadingIndex]
      } Fetching data... ${dataDone}/${allAmountOfCandles}(${
        dataDoneRatio.toFixed(1) * 100
      }%) candles completed`
    );
    loadingIndex = (loadingIndex + 1) % loadingFrames.length;
  }, 100);

  const BATCH_SIZE = 1_000;

  const downloadPromises: Promise<OHLCV[]>[] = options.pairs.map(
    async (pair: string) => {
      while (true) {
        let pairData = data.find((pairCell) => pairCell.pair === pair);
        if (!pairData) {
          const startDate = calculateDateFromTimeframeAndAmount(
            //@ts-ignore
            ms(options.timeframe),
            options.limit
          );
          console.log(startDate);
          pairData = {
            data: [],
            latestTime: new Date(startDate).getTime(),
            pair,
          };
          data.push(pairData); 
        }
        const candles = await exchange.fetchOHLCV(
          pair,
          options.timeframe,
          pairData?.latestTime,
          BATCH_SIZE
        );
        pairData.data.push(...candles);
        pairData.latestTime = candles.at(-1)!.at(0);
        if (candles.length !== BATCH_SIZE) break;
        dataDone += candles.length;
      }
    }
  );

  await Promise.all(downloadPromises);

  clearInterval(loadingInterval);
  process.stdout.write("\r\x1b[K");

  console.log("✅ Data fetching complete!");
  console.log(`📊 Total candles fetched: ${data.length}`);

  for (const pairData of data) {
    const { pair, data } = pairData;
    const sortedPairData = data.sort((a, b) => a[0]! - b[0]!);

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const formattedPair = pair.replace(/\//g, "_");

    const fileName = `${formattedPair}_${options.timeframe}_${options.limit}.json`;
    const filePath = path.join(dataDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(sortedPairData, null, 2));
    console.log(`💾 Data saved to: ${filePath}`);
  }
}

await download(results);
