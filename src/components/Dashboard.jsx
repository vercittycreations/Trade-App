import { useMemo, useState } from "react";
import MarketOverview from "./MarketOverview";
import PortfolioSummary from "./PortfolioSummary";
import TradeIdeas from "./TradeIdeas";
import TrendChart from "./TrendChart";
import MultiAssetChart from "./MultiAssetChart";
import PortfolioSimulator from "./PortfolioSimulator";
import StrategyEngine from "./StrategyEngine";
import AnalyticsDashboard from "./AnalyticsDashboard";
import {
  generateMarketSnapshot,
  generateRiskMetrics,
  generateTradeIdeas,
} from "../utils/simulator";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const snapshot = useMemo(() => generateMarketSnapshot(), []);
  const metrics = useMemo(() => generateRiskMetrics(), []);
  const ideas = useMemo(() => generateTradeIdeas(), []);
  const [selectedAsset, setSelectedAsset] = useState(snapshot[0]);
  const {
    userData,
    dataLoading,
    addWatchlistSymbol,
    removeWatchlistSymbol,
    addIndicator,
    updatePreferences,
  } = useAuth();

  const watchlist = userData?.watchlist || [];
  const hasInWatchlist = watchlist.includes(selectedAsset.symbol);

  return (
    <div className="dashboard">
      <section className="hero">
        <div>
          <h1>Simulated Trading Command Center</h1>
          <p>
            Explore multi-asset trends, test strategies, and review portfolio
            health with mock data generated for learning.
          </p>
          <div className="hero-stats">
            <div>
              <p className="muted">Watchlist assets</p>
              <p className="stat-value">
                {dataLoading ? "Loading..." : watchlist.length}
              </p>
            </div>
            <div>
              <p className="muted">Base currency</p>
              <p className="stat-value">
                {userData?.preferences?.baseCurrency || "USD"}
              </p>
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary">
            Start paper trade
          </button>
          <button type="button" className="ghost">
            View analytics log
          </button>
        </div>
      </section>

      <div className="grid-two">
        <div className="card">
          <div className="section-header">
            <div>
              <h3>{selectedAsset.name} trend</h3>
              <p className="muted">
                {selectedAsset.symbol} • {selectedAsset.category}
              </p>
            </div>
            <span className="pill">Last 8 sessions</span>
          </div>
          <TrendChart data={selectedAsset.trend} />
          <div className="trend-footer">
            <div>
              <p className="muted">Latest price</p>
              <p className="trend-price">
                ${selectedAsset.price.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="muted">Session change</p>
              <p className={selectedAsset.change >= 0 ? "positive" : "negative"}>
                {selectedAsset.change >= 0 ? "+" : ""}
                {selectedAsset.change}%
              </p>
            </div>
          </div>
          <div className="action-row">
            <button
              type="button"
              className={hasInWatchlist ? "ghost" : "primary"}
              onClick={() =>
                hasInWatchlist
                  ? removeWatchlistSymbol(selectedAsset.symbol)
                  : addWatchlistSymbol(selectedAsset.symbol)
              }
            >
              {hasInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() =>
                addIndicator({
                  name: "RSI",
                  asset: selectedAsset.symbol,
                })
              }
            >
              Apply RSI indicator
            </button>
          </div>
        </div>
        <div className="card">
          <div className="section-header">
            <div>
              <h3>Simulation checklist</h3>
              <p className="muted">Keep your practice session structured.</p>
            </div>
            <span className="pill">Daily routine</span>
          </div>
          <ul className="checklist">
            <li>Review volatility across all asset classes.</li>
            <li>Set a risk limit for each trade idea.</li>
            <li>Log hypothetical entries and exits.</li>
            <li>Evaluate performance impact on portfolio risk.</li>
          </ul>
          <div className="highlight">
            <p>
              Your virtual balance starts at <strong>$100,000</strong>. Track
              your risk exposure using the analytics widgets below.
            </p>
            <button
              type="button"
              className="link"
              onClick={() =>
                updatePreferences({
                  ...(userData?.preferences || {}),
                  baseCurrency:
                    userData?.preferences?.baseCurrency === "USD"
                      ? "EUR"
                      : "USD",
                })
              }
            >
              Toggle base currency
            </button>
          </div>
        </div>
      </div>

      <MarketOverview
        assets={snapshot}
        selected={selectedAsset}
        onSelect={setSelectedAsset}
      />

      <MultiAssetChart />

      <PortfolioSimulator />

      <StrategyEngine />

      <AnalyticsDashboard />

      <div className="grid-two">
        <PortfolioSummary metrics={metrics} />
        <TradeIdeas ideas={ideas} />
      </div>
    </div>
  );
}
