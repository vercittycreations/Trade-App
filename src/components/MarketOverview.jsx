export default function MarketOverview({ assets, selected, onSelect }) {
  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h3>Live Market Snapshot (Simulated)</h3>
          <p className="muted">
            Click an asset to view its recent trend.
          </p>
        </div>
        <span className="pill">Randomized data</span>
      </div>
      <div className="asset-grid">
        {assets.map((asset) => {
          const isSelected = selected?.symbol === asset.symbol;
          return (
            <button
              key={asset.symbol}
              type="button"
              className={`asset-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelect(asset)}
            >
              <div>
                <p className="asset-symbol">{asset.symbol}</p>
                <p className="asset-name">{asset.name}</p>
              </div>
              <div className="asset-meta">
                <p className="asset-price">${asset.price.toLocaleString()}</p>
                <p className={asset.change >= 0 ? "positive" : "negative"}>
                  {asset.change >= 0 ? "+" : ""}
                  {asset.change}%
                </p>
              </div>
              <div className="asset-footer">
                <span>{asset.category}</span>
                <span>Vol {asset.volume.toLocaleString()}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
