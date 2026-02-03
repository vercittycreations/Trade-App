import { useEffect, useMemo, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../contexts/AuthContext";

const assetUniverse = [
  { symbol: "AAPL", name: "Apple", type: "Stocks", color: "#2563eb" },
  { symbol: "MSFT", name: "Microsoft", type: "Stocks", color: "#1d4ed8" },
  { symbol: "TLT", name: "Treasury Bond", type: "Bonds", color: "#16a34a" },
  { symbol: "LQD", name: "Corporate Bond", type: "Bonds", color: "#15803d" },
  { symbol: "BTC", name: "Bitcoin", type: "Crypto", color: "#f97316" },
  { symbol: "ETH", name: "Ethereum", type: "Crypto", color: "#ea580c" },
];

const randomBetween = (min, max) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const buildInitialPrices = () =>
  assetUniverse.reduce((acc, asset) => {
    const base =
      asset.type === "Crypto"
        ? randomBetween(18000, 32000)
        : asset.type === "Bonds"
          ? randomBetween(85, 120)
          : randomBetween(140, 260);
    return { ...acc, [asset.symbol]: base };
  }, {});

const nextPrices = (current) =>
  assetUniverse.reduce((acc, asset) => {
    const drift =
      asset.type === "Crypto"
        ? randomBetween(-600, 600)
        : asset.type === "Bonds"
          ? randomBetween(-1.2, 1.2)
          : randomBetween(-4, 4);
    const next = Math.max(1, current[asset.symbol] + drift);
    return { ...acc, [asset.symbol]: Math.round(next * 100) / 100 };
  }, {});

const formatCurrency = (value) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PortfolioSimulator() {
  const { userData, updatePortfolio } = useAuth();
  const [prices, setPrices] = useState(buildInitialPrices);
  const [selectedSymbol, setSelectedSymbol] = useState(assetUniverse[0].symbol);
  const [quantity, setQuantity] = useState(10);
  const [side, setSide] = useState("buy");

  const holdings = userData?.portfolioHoldings || [];
  const tradeHistory = userData?.tradeHistory || [];
  const realizedPL = userData?.realizedPL ?? 0;
  const cashBalance = userData?.cashBalance ?? 100000;
  const transactionCostPct = userData?.transactionCostPct ?? 0.2;

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => nextPrices(prev));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const currentPrice = prices[selectedSymbol] || 0;

  const totalUnrealized = holdings.reduce((acc, holding) => {
    const market = prices[holding.symbol] || 0;
    return acc + (market - holding.avgCost) * holding.quantity;
  }, 0);

  const portfolioValue = holdings.reduce((acc, holding) => {
    const market = prices[holding.symbol] || 0;
    return acc + market * holding.quantity;
  }, 0);

  const allocationData = useMemo(() => {
    return holdings
      .map((holding) => {
        const asset = assetUniverse.find((item) => item.symbol === holding.symbol);
        const marketValue = (prices[holding.symbol] || 0) * holding.quantity;
        return {
          name: holding.symbol,
          value: marketValue,
          fill: asset?.color || "#94a3b8",
        };
      })
      .filter((entry) => entry.value > 0);
  }, [holdings, prices]);

  const handleTrade = (event) => {
    event.preventDefault();
    if (quantity <= 0 || !currentPrice) return;

    const fee = (currentPrice * quantity * transactionCostPct) / 100;
    const timestamp = new Date().toISOString();
    const existing = holdings.find((holding) => holding.symbol === selectedSymbol);

    if (side === "buy") {
      const totalCost = currentPrice * quantity + fee;
      if (totalCost > cashBalance) return;

      const newQuantity = (existing?.quantity || 0) + quantity;
      const newCostBasis =
        ((existing?.avgCost || 0) * (existing?.quantity || 0) +
          currentPrice * quantity) /
        newQuantity;

      const updatedHoldings = existing
        ? holdings.map((holding) =>
            holding.symbol === selectedSymbol
              ? { ...holding, quantity: newQuantity, avgCost: newCostBasis }
              : holding
          )
        : [
            ...holdings,
            {
              symbol: selectedSymbol,
              quantity: newQuantity,
              avgCost: newCostBasis,
            },
          ];

      updatePortfolio({
        portfolioHoldings: updatedHoldings,
        tradeHistory: [
          {
            id: crypto.randomUUID(),
            symbol: selectedSymbol,
            side,
            quantity,
            price: currentPrice,
            fee,
            total: totalCost,
            timestamp,
          },
          ...tradeHistory,
        ],
        cashBalance: cashBalance - totalCost,
        realizedPL,
      });
    }

    if (side === "sell") {
      if (!existing || existing.quantity < quantity) return;

      const totalProceeds = currentPrice * quantity - fee;
      const remainingQty = existing.quantity - quantity;
      const realized = (currentPrice - existing.avgCost) * quantity - fee;

      const updatedHoldings = remainingQty
        ? holdings.map((holding) =>
            holding.symbol === selectedSymbol
              ? { ...holding, quantity: remainingQty }
              : holding
          )
        : holdings.filter((holding) => holding.symbol !== selectedSymbol);

      updatePortfolio({
        portfolioHoldings: updatedHoldings,
        tradeHistory: [
          {
            id: crypto.randomUUID(),
            symbol: selectedSymbol,
            side,
            quantity,
            price: currentPrice,
            fee,
            total: totalProceeds,
            timestamp,
          },
          ...tradeHistory,
        ],
        cashBalance: cashBalance + totalProceeds,
        realizedPL: realizedPL + realized,
      });
    }
  };

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h3>Portfolio Simulator</h3>
          <p className="muted">
            Practice buying and selling assets with simulated market prices.
          </p>
        </div>
        <span className="pill">Transaction cost {transactionCostPct}%</span>
      </div>

      <div className="portfolio-grid">
        <form className="trade-form" onSubmit={handleTrade}>
          <label>
            Asset
            <select
              value={selectedSymbol}
              onChange={(event) => setSelectedSymbol(event.target.value)}
            >
              {assetUniverse.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} · {asset.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trade side
            <div className="segmented">
              <button
                type="button"
                className={side === "buy" ? "primary" : "ghost"}
                onClick={() => setSide("buy")}
              >
                Buy
              </button>
              <button
                type="button"
                className={side === "sell" ? "primary" : "ghost"}
                onClick={() => setSide("sell")}
              >
                Sell
              </button>
            </div>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <div className="trade-price">
            <div>
              <p className="muted">Market price</p>
              <p>${formatCurrency(currentPrice)}</p>
            </div>
            <div>
              <p className="muted">Cash balance</p>
              <p>${formatCurrency(cashBalance)}</p>
            </div>
          </div>
          <button className="primary" type="submit">
            Place simulated trade
          </button>
        </form>

        <div className="card inset">
          <h4>Profit &amp; Loss Summary</h4>
          <div className="pl-grid">
            <div>
              <p className="muted">Unrealized P/L</p>
              <p className={totalUnrealized >= 0 ? "positive" : "negative"}>
                {totalUnrealized >= 0 ? "+" : ""}
                ${formatCurrency(totalUnrealized)}
              </p>
            </div>
            <div>
              <p className="muted">Realized P/L</p>
              <p className={realizedPL >= 0 ? "positive" : "negative"}>
                {realizedPL >= 0 ? "+" : ""}
                ${formatCurrency(realizedPL)}
              </p>
            </div>
            <div>
              <p className="muted">Portfolio value</p>
              <p>${formatCurrency(portfolioValue)}</p>
            </div>
          </div>
          <div className="allocation">
            <p className="muted">Asset allocation</p>
            <div className="chart-container tall">
              {allocationData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                    />
                    <Tooltip formatter={(value) => `$${formatCurrency(value)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">No holdings yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="holdings-grid">
        <div className="card inset">
          <h4>Holdings</h4>
          <div className="table">
            <div className="table-row header">
              <span>Asset</span>
              <span>Quantity</span>
              <span>Avg Cost</span>
              <span>Market Value</span>
            </div>
            {holdings.length ? (
              holdings.map((holding) => (
                <div key={holding.symbol} className="table-row">
                  <span>{holding.symbol}</span>
                  <span>{holding.quantity}</span>
                  <span>${formatCurrency(holding.avgCost)}</span>
                  <span>
                    ${
                      formatCurrency(
                        (prices[holding.symbol] || 0) * holding.quantity
                      )
                    }
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No holdings yet.</p>
            )}
          </div>
        </div>

        <div className="card inset">
          <h4>Trade history</h4>
          <div className="table">
            <div className="table-row header">
              <span>Time</span>
              <span>Side</span>
              <span>Qty</span>
              <span>Price</span>
            </div>
            {tradeHistory.length ? (
              tradeHistory.slice(0, 6).map((trade) => (
                <div key={trade.id} className="table-row">
                  <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                  <span className={trade.side === "buy" ? "positive" : "negative"}>
                    {trade.side}
                  </span>
                  <span>{trade.quantity}</span>
                  <span>${formatCurrency(trade.price)}</span>
                </div>
              ))
            ) : (
              <p className="muted">No trades yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
