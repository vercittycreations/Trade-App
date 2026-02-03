import { useState } from "react";
import Layout from "./components/Layout";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import { useAuth } from "./contexts/AuthContext";
import "./styles/global.css";

export default function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState("login");

  if (loading) {
    return (
      <div className="page-center">
        <div className="card">
          <h2>Loading simulator...</h2>
          <p>Connecting to Firebase Authentication.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onSwitchMode={setAuthMode}>
      {user ? (
        <Dashboard />
      ) : (
        <AuthForm
          mode={authMode}
          onModeChange={setAuthMode}
        />
      )}
    </Layout>
  );
}
