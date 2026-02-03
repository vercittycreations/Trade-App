import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const timeRanges = [
  { label: "15m", points: 15 },
  { label: "1h", points: 30 },
  { label: "4h", points: 60 },
];

const randomBetween = (min, max) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const seedSeries = (points) =>
  Array.from({ length: points }).map((_, index) => ({
    time: `T-${points - index}`,
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

const calculateVolatility = (series, period) => {
  if (series.length < period) return null;
  const slice = series.slice(-period);
  const mean = slice.reduce((acc, point) => acc + point.price, 0) / period;
  const variance =
    slice.reduce((acc, point) => acc + (point.price - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
};

const calculateMomentum = (series, lookback) => {
  if (series.length < lookback + 1) return null;
  const current = series[series.length - 1].price;
  const previous = series[series.length - 1 - lookback].price;
  return ((current - previous) / previous) * 100;
};

const formatCurrency = (value) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AnalyticsDashboard() {
  const [range, setRange] = useState(timeRanges[1]);
  const [series, setSeries] = useState(() => seedSeries(timeRanges[1].points));
  const [indicatorToggles, setIndicatorToggles] = useState({
    ma: true,
    rsi: true,
    volatility: true,
    momentum: true,
  });

  useEffect(() => {
    setSeries(seedSeries(range.points));
  }, [range]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        const nextPrice = Math.max(1, last.price + randomBetween(-4, 4));
        const nextPoint = {
          time: `T-${parseInt(last.time.replace("T-", ""), 10) + 1}`,
          price: Math.round(nextPrice * 100) / 100,
        };
        return [...prev.slice(-range.points + 1), nextPoint];
      });
    }, 1600);

    return () => clearInterval(interval);
  }, [range]);

  const maValue = useMemo(() => calculateMA(series, 10), [series]);
  const rsiValue = useMemo(() => calculateRSI(series, 14), [series]);
  const volatilityValue = useMemo(() => calculateVolatility(series, 12), [series]);
  const momentumValue = useMemo(() => calculateMomentum(series, 6), [series]);

  const chartData = useMemo(
    () =>
      series.map((point) => ({
        ...point,
        ma: indicatorToggles.ma ? maValue : null,
      })),
    [series, maValue, indicatorToggles.ma]
  );

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h3>Analytics Dashboard</h3>
          <p className="muted">
            Simulated indicators and performance metrics with live updates.
          </p>
        </div>
        <div className="chart-type-toggle">
          {timeRanges.map((option) => (
            <button
              key={option.label}
              type="button"
              className={range.label === option.label ? "primary" : "ghost"}
              onClick={() => setRange(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="indicator-panel">
        <div className="indicator-toggles">
          {Object.entries(indicatorToggles).map(([key, value]) => (
            <button
              key={key}
              type="button"
              className={value ? "primary" : "ghost"}
              onClick={() =>
                setIndicatorToggles((prev) => ({ ...prev, [key]: !prev[key] }))
              }
            >
              {key.toUpperCase()} {value ? "on" : "off"}
            </button>
          ))}
        </div>
        <div className="metric-grid">
          {indicatorToggles.ma && (
            <div className="metric-card">
              <p className="metric-label">Moving Average (10)</p>
              <p className="metric-value">
                {maValue ? `$${formatCurrency(maValue)}` : "--"}
              </p>
              <p className="muted">Smoothed price trend.</p>
            </div>
          )}
          {indicatorToggles.volatility && (
            <div className="metric-card">
              <p className="metric-label">Volatility</p>
              <p className="metric-value">
                {volatilityValue ? formatCurrency(volatilityValue) : "--"}
              </p>
              <p className="muted">Standard deviation of price.</p>
            </div>
          )}
          {indicatorToggles.rsi && (
            <div className="metric-card">
              <p className="metric-label">RSI (14)</p>
              <p className="metric-value">
                {rsiValue ? rsiValue.toFixed(1) : "--"}
              </p>
              <p className="muted">Momentum oscillator.</p>
            </div>
          )}
          {indicatorToggles.momentum && (
            <div className="metric-card">
              <p className="metric-label">Price Momentum</p>
              <p className={`metric-value ${momentumValue >= 0 ? "positive" : "negative"}`}>
                {momentumValue !== null
                  ? `${momentumValue >= 0 ? "+" : ""}${momentumValue.toFixed(2)}%`
                  : "--"}
              </p>
              <p className="muted">Change over last 6 points.</p>
            </div>
          )}
        </div>
      </div>

      <div className="chart-container tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e8f0" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip formatter={(value) => `$${formatCurrency(value)}`} />
            <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} dot={false} />
            {indicatorToggles.ma && (
              <Line
                type="monotone"
                dataKey="ma"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
