import { useAuth } from "../contexts/AuthContext";

export default function Layout({ children, user, onSwitchMode }) {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div>
          <p className="logo">Multi-Asset Trading & Analytics Simulator</p>
          <span className="tag">Educational simulation only</span>
        </div>
        <nav className="nav-actions">
          {user ? (
            <>
              <span className="user-pill">Signed in as {user.email}</span>
              <button type="button" className="ghost" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="ghost"
                onClick={() => onSwitchMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => onSwitchMode("register")}
              >
                Create account
              </button>
            </>
          )}
        </nav>
      </header>
      <main className="main-content">{children}</main>
      <footer className="footer">
        <p>
          Built for learning. All prices are randomly generated and not real
          market data.
        </p>
      </footer>
    </div>
  );
}
