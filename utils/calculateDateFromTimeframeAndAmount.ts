export default function calculateDateFromTimeframeAndAmount(
  timeframeInMs: number,
  amount: number
) {
  const totalDurationMs = amount * timeframeInMs;
  const now = Date.now();
  const pastTimestamp = now - totalDurationMs;
  const pastDate = new Date(pastTimestamp);

  const year = pastDate.getFullYear();
  const month = String(pastDate.getMonth() + 1).padStart(2, "0");
  const day = String(pastDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function calculateCandles(timeframeMs: number, years: number) {
  const millisecondsInYear = 365.25 * 24 * 60 * 60 * 1000; 
  const totalMilliseconds = years * millisecondsInYear;
  const numberOfCandles = totalMilliseconds / timeframeMs;
  return Math.ceil(numberOfCandles); 
}