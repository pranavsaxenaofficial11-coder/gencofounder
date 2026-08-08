import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Error boundary — shows the actual error instead of a blank white page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#f1f5f9", fontFamily: "system-ui, sans-serif", padding: 24 }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16, lineHeight: 1.6 }}>
              The app hit an error while loading. This is usually a Firebase config or network issue.
            </div>
            <pre style={{ background: "#1e293b", padding: 16, borderRadius: 12, fontSize: 12, overflow: "auto", color: "#fca5a5", whiteSpace: "pre-wrap" }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, background: "#7c3aed", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
