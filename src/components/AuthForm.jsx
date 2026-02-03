import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const initialState = {
  displayName: "",
  email: "",
  password: "",
};

export default function AuthForm({ mode, onModeChange }) {
  const [formState, setFormState] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();

  const isRegister = mode === "register";

  const handleChange = (event) => {
    setFormState((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(formState);
      } else {
        await login(formState);
      }
    } catch (err) {
      setError(err.message || "Unable to authenticate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-grid">
      <div className="card">
        <h1>Welcome to the simulator</h1>
        <p>
          Practice multi-asset trading strategies with randomly generated data
          and a safe virtual balance.
        </p>
        <ul className="feature-list">
          <li>Simulated markets across equities, crypto, FX, and commodities.</li>
          <li>Portfolio analytics and performance snapshots.</li>
          <li>Trade ideas built for learning and experimentation.</li>
        </ul>
      </div>
      <div className="card">
        <h2>{isRegister ? "Create your account" : "Sign in"}</h2>
        <p className="muted">
          {isRegister
            ? "Start with a $100,000 virtual balance."
            : "Use your Firebase account to continue."}
        </p>
        <form onSubmit={handleSubmit} className="form-stack">
          {isRegister && (
            <label>
              Display name
              <input
                type="text"
                name="displayName"
                value={formState.displayName}
                onChange={handleChange}
                placeholder="Jordan Lee"
                required
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Submitting..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
        <button
          type="button"
          className="link"
          onClick={() =>
            onModeChange(isRegister ? "login" : "register")
          }
        >
          {isRegister
            ? "Already have an account? Sign in"
            : "Need an account? Register"}
        </button>
      </div>
    </section>
  );
}
