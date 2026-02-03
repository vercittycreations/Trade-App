export const assetUniverse = [
  { symbol: "AAPL", name: "Apple", category: "Equities" },
  { symbol: "TSLA", name: "Tesla", category: "Equities" },
  { symbol: "BTC", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH", name: "Ethereum", category: "Crypto" },
  { symbol: "EURUSD", name: "Euro / US Dollar", category: "FX" },
  { symbol: "XAU", name: "Gold", category: "Commodities" },
];

const randomBetween = (min, max) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

export function generatePriceSeries(seedPrice = 100, points = 12) {
  const series = [];
  let current = seedPrice;

  for (let index = 0; index < points; index += 1) {
    const drift = randomBetween(-3, 3);
    current = Math.max(1, current + drift);
    series.push({
      name: `T-${points - index}`,
      price: Math.round(current * 100) / 100,
    });
  }

  return series.reverse();
}

export function generateMarketSnapshot() {
  return assetUniverse.map((asset) => {
    const price = randomBetween(45, 3200);
    return {
      ...asset,
      price,
      change: randomBetween(-4.5, 4.5),
      volume: Math.round(randomBetween(12000, 850000)),
      trend: generatePriceSeries(price, 8),
    };
  });
}

export function generateRiskMetrics() {
  return [
    {
      label: "Portfolio Risk",
      value: randomBetween(1.2, 3.8),
      unit: "%",
      detail: "Volatility based on last 30 sessions.",
    },
    {
      label: "Cash Utilization",
      value: randomBetween(35, 88),
      unit: "%",
      detail: "Capital deployed in active positions.",
    },
    {
      label: "Open Positions",
      value: Math.round(randomBetween(3, 12)),
      unit: "",
      detail: "Simulated trades currently active.",
    },
  ];
}

export function generateTradeIdeas() {
  return [
    {
      title: "Momentum Swing",
      description: "Focus on assets with 3+ consecutive higher closes.",
      action: "Scan for breakout patterns.",
    },
    {
      title: "Mean Reversion",
      description: "Identify oversold assets across multiple sectors.",
      action: "Set alerts at support levels.",
    },
    {
      title: "Macro Hedge",
      description: "Balance equity exposure with FX or commodity plays.",
      action: "Simulate hedged portfolio weights.",
    },
  ];
}
