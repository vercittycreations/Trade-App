export default function PortfolioSummary({ metrics }) {
  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h3>Portfolio Health</h3>
          <p className="muted">
            High-level analytics based on your simulated positions.
          </p>
        </div>
        <span className="pill">Auto-generated</span>
      </div>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-card">
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">
              {metric.value}
              {metric.unit}
            </p>
            <p className="muted">{metric.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
