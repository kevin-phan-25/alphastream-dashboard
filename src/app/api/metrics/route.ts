export const runtime = "edge";

export async function GET() {
  return Response.json({
    equity: 0,
    drawdown: 0,
    winRate: 0,
    totalTrades: 0,
    mlExperiences: 0,
  });
}
