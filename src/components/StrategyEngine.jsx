import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const assets = [
  { symbol: "AAPL", name: "Apple", color: "#2563eb" },
  { symbol: "TLT", name: "Treasury Bond", color: "#16a34a" },
  { symbol: "BTC", name: "Bitcoin", color: "#f97316" },
];

const randomBetween = (min, max) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const seedPrices = () =>
  Array.from({ length: 30 }).map((_, index) => ({
    time: `T-${30 - index}`,
    price: randomBetween(120, 220),
  }));

const calculateMA = (series, period) => {
  if (series.length < period) return null;
  const slice = series.slice(-period);
  const total = slice.reduce((acc, point) => acc + point.price, 0);
  return total / period;
};

const calculateRSI = (series, period) => {
  if (series.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = series.length - period; i < series.length; i += 1) {
    const diff = series[i].price - series[i - 1].price;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
};

const calculateStdDev = (series, period, mean) => {
  if (series.length < period) return null;
  const slice = series.slice(-period);
  const variance =
    slice.reduce((acc, point) => acc + (point.price - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
};

const formatCurrency = (value) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const applyTradeToPortfolio = ({
  side,
  quantity,
  price,
  holdings,
  cashBalance,
  realizedPL,
  tradeHistory,
  transactionCostPct,
  symbol,
}) => {
  const fee = (price * quantity * transactionCostPct) / 100;
  const timestamp = new Date().toISOString();
  const existing = holdings.find((holding) => holding.symbol === symbol);

  if (side === "buy") {
    const totalCost = price * quantity + fee;
    if (totalCost > cashBalance) return null;
    const newQuantity = (existing?.quantity || 0) + quantity;
    const newCostBasis =
      ((existing?.avgCost || 0) * (existing?.quantity || 0) + price * quantity) /
      newQuantity;

    const updatedHoldings = existing
      ? holdings.map((holding) =>
          holding.symbol === symbol
            ? { ...holding, quantity: newQuantity, avgCost: newCostBasis }
            : holding
        )
      : [...holdings, { symbol, quantity: newQuantity, avgCost: newCostBasis }];

    return {
      portfolioHoldings: updatedHoldings,
      tradeHistory: [
        {
          id: crypto.randomUUID(),
          symbol,
          side,
          quantity,
          price,
          fee,
          total: totalCost,
          timestamp,
          source: "strategy",
        },
        ...tradeHistory,
      ],
      cashBalance: cashBalance - totalCost,
      realizedPL,
    };
  }

  if (side === "sell") {
    if (!existing || existing.quantity < quantity) return null;
    const totalProceeds = price * quantity - fee;
    const remainingQty = existing.quantity - quantity;
    const realized = (price - existing.avgCost) * quantity - fee;

    const updatedHoldings = remainingQty
      ? holdings.map((holding) =>
          holding.symbol === symbol
            ? { ...holding, quantity: remainingQty }
            : holding
        )
      : holdings.filter((holding) => holding.symbol !== symbol);

    return {
      portfolioHoldings: updatedHoldings,
      tradeHistory: [
        {
          id: crypto.randomUUID(),
          symbol,
          side,
          quantity,
          price,
          fee,
          total: totalProceeds,
          timestamp,
          source: "strategy",
        },
        ...tradeHistory,
      ],
      cashBalance: cashBalance + totalProceeds,
      realizedPL: realizedPL + realized,
    };
  }

  return null;
};

export default function StrategyEngine() {
  const { userData, updatePortfolio } = useAuth();
  const [series, setSeries] = useState(seedPrices);
  const [selectedSymbol, setSelectedSymbol] = useState(assets[0].symbol);
  const [maPeriod, setMaPeriod] = useState(10);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [bollingerPeriod, setBollingerPeriod] = useState(20);
  const [bollingerStd, setBollingerStd] = useState(2);
  const [tradeQuantity, setTradeQuantity] = useState(5);
  const [enableStrategy, setEnableStrategy] = useState(true);
  const [autoExecute, setAutoExecute] = useState(true);
  const [ruleMaCross, setRuleMaCross] = useState(true);
  const [ruleRsiSell, setRuleRsiSell] = useState(true);
  const [showIndicators, setShowIndicators] = useState({
    ma: true,
    rsi: true,
    bollinger: true,
  });
  const lastSignalRef = useRef(null);

  const holdings = userData?.portfolioHoldings || [];
  const tradeHistory = userData?.tradeHistory || [];
  const cashBalance = userData?.cashBalance ?? 100000;
  const realizedPL = userData?.realizedPL ?? 0;
  const transactionCostPct = userData?.transactionCostPct ?? 0.2;

  useEffect(() => {
    const interval = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        const drift = randomBetween(-4, 4);
        const nextPrice = Math.max(1, last.price + drift);
        const nextPoint = {
          time: `T-${parseInt(last.time.replace("T-", ""), 10) + 1}`,
          price: Math.round(nextPrice * 100) / 100,
        };
        return [...prev.slice(-29), nextPoint];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const latestPrice = series[series.length - 1]?.price ?? 0;
  const previousPrice = series[series.length - 2]?.price ?? latestPrice;

  const maValue = useMemo(() => calculateMA(series, maPeriod), [series, maPeriod]);
  const maPrevValue = useMemo(
    () => calculateMA(series.slice(0, -1), maPeriod),
    [series, maPeriod]
  );
  const rsiValue = useMemo(() => calculateRSI(series, rsiPeriod), [series, rsiPeriod]);

  const bollinger = useMemo(() => {
    const mean = calculateMA(series, bollingerPeriod);
    if (!mean) return null;
    const stdDev = calculateStdDev(series, bollingerPeriod, mean);
    if (!stdDev) return null;
    return {
      mean,
      upper: mean + bollingerStd * stdDev,
      lower: mean - bollingerStd * stdDev,
    };
  }, [series, bollingerPeriod, bollingerStd]);

  const strategyImpact = useMemo(() => {
    const holding = holdings.find((item) => item.symbol === selectedSymbol);
    if (!holding) return 0;
    return (latestPrice - holding.avgCost) * holding.quantity;
  }, [holdings, selectedSymbol, latestPrice]);

  useEffect(() => {
    if (!enableStrategy || !autoExecute) return;
    if (!latestPrice || !maValue) return;

    let signal = null;
    const crossedAbove = previousPrice <= maPrevValue && latestPrice > maValue;
    const crossedBelow = previousPrice >= maPrevValue && latestPrice < maValue;

    if (ruleMaCross && crossedAbove) signal = "buy";
    if (ruleMaCross && crossedBelow) signal = "sell";
    if (ruleRsiSell && rsiValue !== null && rsiValue > 70) signal = "sell";

    if (!signal) return;
    const lastSignal = lastSignalRef.current;
    if (lastSignal?.signal === signal && lastSignal?.time === series.at(-1)?.time) {
      return;
    }

    const portfolioUpdate = applyTradeToPortfolio({
      side: signal,
      quantity: tradeQuantity,
      price: latestPrice,
      holdings,
      cashBalance,
      realizedPL,
      tradeHistory,
      transactionCostPct,
      symbol: selectedSymbol,
    });

    if (portfolioUpdate) {
      updatePortfolio(portfolioUpdate);
      lastSignalRef.current = { signal, time: series.at(-1)?.time };
    }
  }, [
    autoExecute,
    cashBalance,
    enableStrategy,
    holdings,
    latestPrice,
    maPrevValue,
    maValue,
    realizedPL,
    rsiValue,
    ruleMaCross,
    ruleRsiSell,
    selectedSymbol,
    series,
    tradeHistory,
    tradeQuantity,
    transactionCostPct,
    updatePortfolio,
    previousPrice,
  ]);

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h3>Strategy Builder</h3>
          <p className="muted">
            Configure indicators, rules, and auto-executed trades on simulated data.
          </p>
        </div>
        <div className="chart-type-toggle">
          <button
            type="button"
            className={enableStrategy ? "primary" : "ghost"}
            onClick={() => setEnableStrategy((prev) => !prev)}
          >
            {enableStrategy ? "Strategy on" : "Strategy off"}
          </button>
          <button
            type="button"
            className={autoExecute ? "primary" : "ghost"}
            onClick={() => setAutoExecute((prev) => !prev)}
          >
            {autoExecute ? "Auto-trade on" : "Auto-trade off"}
          </button>
        </div>
      </div>

      <div className="strategy-grid">
        <div className="card inset">
          <h4>Indicator settings</h4>
          <label>
            Asset
            <select
              value={selectedSymbol}
              onChange={(event) => setSelectedSymbol(event.target.value)}
            >
              {assets.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} · {asset.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Moving Average period
            <input
              type="number"
              min="3"
              value={maPeriod}
              onChange={(event) => setMaPeriod(Number(event.target.value))}
            />
          </label>
          <label>
            RSI period
            <input
              type="number"
              min="5"
              value={rsiPeriod}
              onChange={(event) => setRsiPeriod(Number(event.target.value))}
            />
          </label>
          <label>
            Bollinger period
            <input
              type="number"
              min="10"
              value={bollingerPeriod}
              onChange={(event) => setBollingerPeriod(Number(event.target.value))}
            />
          </label>
          <label>
            Bollinger standard deviation
            <input
              type="number"
              min="1"
              step="0.1"
              value={bollingerStd}
              onChange={(event) => setBollingerStd(Number(event.target.value))}
            />
          </label>
          <div className="indicator-toggles">
            <button
              type="button"
              className={showIndicators.ma ? "primary" : "ghost"}
              onClick={() =>
                setShowIndicators((prev) => ({ ...prev, ma: !prev.ma }))
              }
            >
              {showIndicators.ma ? "MA on" : "MA off"}
            </button>
            <button
              type="button"
              className={showIndicators.rsi ? "primary" : "ghost"}
              onClick={() =>
                setShowIndicators((prev) => ({ ...prev, rsi: !prev.rsi }))
              }
            >
              {showIndicators.rsi ? "RSI on" : "RSI off"}
            </button>
            <button
              type="button"
              className={showIndicators.bollinger ? "primary" : "ghost"}
              onClick={() =>
                setShowIndicators((prev) => ({
                  ...prev,
                  bollinger: !prev.bollinger,
                }))
              }
            >
              {showIndicators.bollinger ? "Bollinger on" : "Bollinger off"}
            </button>
          </div>
        </div>

        <div className="card inset">
          <h4>Rule builder</h4>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={ruleMaCross}
              onChange={(event) => setRuleMaCross(event.target.checked)}
            />
            Buy when price crosses above MA; sell when it crosses below.
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={ruleRsiSell}
              onChange={(event) => setRuleRsiSell(event.target.checked)}
            />
            Sell when RSI &gt; 70.
          </label>
          <label>
            Auto-trade quantity
            <input
              type="number"
              min="1"
              value={tradeQuantity}
              onChange={(event) => setTradeQuantity(Number(event.target.value))}
            />
          </label>
          <div className="strategy-stats">
            <div>
              <p className="muted">Latest price</p>
              <p>${formatCurrency(latestPrice)}</p>
            </div>
            {showIndicators.ma && (
              <div>
                <p className="muted">Moving Average</p>
                <p>{maValue ? formatCurrency(maValue) : "--"}</p>
              </div>
            )}
            {showIndicators.rsi && (
              <div>
                <p className="muted">RSI</p>
                <p>{rsiValue ? rsiValue.toFixed(1) : "--"}</p>
              </div>
            )}
            {showIndicators.bollinger && bollinger && (
              <div>
                <p className="muted">Bollinger Bands</p>
                <p>
                  {formatCurrency(bollinger.lower)} - {formatCurrency(bollinger.upper)}
                </p>
              </div>
            )}
          </div>
          <div className="strategy-impact">
            <p className="muted">Strategy P/L impact</p>
            <p className={strategyImpact >= 0 ? "positive" : "negative"}>
              {strategyImpact >= 0 ? "+" : ""}${formatCurrency(strategyImpact)}
            </p>
            <p className="muted">Auto trades update your portfolio holdings.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
