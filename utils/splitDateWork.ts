import ms from 'ms';

export default function splitDateWork(
  candleAmount: number,
  pieces: number,
  timeframe: string
) {
  const splits: { since: number; amount: number }[] = [];
  const startDate = new Date().getTime() - (ms(timeframe) * candleAmount);
  const totalAmount = candleAmount;
  const amountPerPiece = Math.ceil(totalAmount / pieces);
  
  for (let i = 0; i < pieces; i++) {
    const pieceAmount = Math.min(amountPerPiece, totalAmount - (amountPerPiece * i));
    if (pieceAmount <= 0) break;
    
    const pieceStartTime = startDate + (ms(timeframe) * amountPerPiece * i);
    splits.push({
      since: pieceStartTime,
      amount: pieceAmount
    });
  }
  
  return splits;
}