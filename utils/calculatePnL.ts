export function calculateLongPnL(entry: number, exit: number) {
  return (entry / exit) * 100;
}

export function calculateShortPnL(entry: number, exit: number) {
  return (exit / entry) * 100;
}
