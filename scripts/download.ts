import { Worker } from "worker_threads";
import ccxt, { type Exchange, type OHLCV } from "ccxt";
import inquirer from "inquirer";
import os from "os";
import fs from "fs";
import path from "path";
import splitDateWork from "../utils/splitDateWork";
import type { DataInstallationRequest } from "../types";

const cpus = os.cpus();
let exchange: Exchange;

const results = await inquirer.prompt([
  {
    name: "exchange",
    message: "Which exchange would you like to fetch data from?",
    type: "select",
    pageSize: 100,
    choices: ccxt.exchanges.sort().filter((exchangeName: string) => {
      //@ts-ignore
      return new ccxt[exchangeName]().has["fetchOHLCV"];
    }),
    default: "binance",
  },
  {
    name: "pair",
    message: "Which pair would you like to install data for?",
    type: "checkbox",
    required: true,
    pageSize: 100,
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
    pageSize: 100,
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
  {
    name: "concurrency",
    message: "Should we use concurrency to fetch the data?",
    type: "select",
    choices: ["None", "Medium", "Full"],
  },
]);

let concurrency = 1;
if (results.concurrency === "Full") {
  concurrency = Math.max(1, cpus.length);
} else if (results.concurrency === "Medium") {
  concurrency = Math.max(1, Math.ceil(cpus.length / 2));
}

const workers: Worker[] = [];
let data: OHLCV[] = [];
const workerPath = "./workers/dataDownloader.ts";

const dateWork = splitDateWork(results.limit, concurrency, results.timeframe);

for (let i = 0; i < concurrency; i++) {
  const worker = new Worker(workerPath);
  workers.push(worker);
}

let completedWorkers = 0;

const loadingFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let loadingIndex = 0;
const loadingInterval = setInterval(() => {
  process.stdout.write(
    `\r${loadingFrames[loadingIndex]} Fetching data... ${completedWorkers}/${concurrency} workers completed`
  );
  loadingIndex = (loadingIndex + 1) % loadingFrames.length;
}, 100);

const workerPromises = workers.map((worker, workerIndex) => {
  return new Promise<void>((resolve) => {
    const work = dateWork[workerIndex];

    if (!work) {
      worker.terminate();
      completedWorkers++;
      resolve();
      return;
    }

    const workerData: DataInstallationRequest = {
      exchange: results.exchange,
      pair: results.pair,
      timeframe: results.timeframe,
      limit: work.amount,
      since: work.since,
      threadNumber: workerIndex,
    };

    worker.postMessage(workerData);

    worker.on("message", (workerOHLCVData: OHLCV[]) => {
      data.push(...workerOHLCVData);
      worker.terminate();
      completedWorkers++;
      resolve();
    });

    worker.on("error", (error) => {
      console.error(`Worker ${workerIndex} error:`, error);
      worker.terminate();
      completedWorkers++;
      resolve();
    });
  });
});

await Promise.all(workerPromises);

clearInterval(loadingInterval);
process.stdout.write("\r\x1b[K");

console.log("✅ Data fetching complete!");
console.log(`📊 Total candles fetched: ${data.length}`);

data = data.sort((a, b) => a[0]! - b[0]!);

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const formattedPairs = Array.isArray(results.pair)
  ? results.pair.join("_").replace(/\//g, "_")
  : results.pair.replace(/\//g, "_");

const fileName = `${formattedPairs}_${results.timeframe}_${results.limit}.json`;
const filePath = path.join(dataDir, fileName);

console.log(dateWork)

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log(`💾 Data saved to: ${filePath}`);
