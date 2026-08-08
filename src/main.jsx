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
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", color: "#0a0a0a", fontFamily: "Georgia, 'Times New Roman', serif", padding: 24 }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Something went wrong</div>
            <div style={{ fontSize: 14, color: "#595959", marginBottom: 16, lineHeight: 1.6 }}>
              The app hit an error while loading. This is usually a Firebase config or network issue.
            </div>
            <pre style={{ background: "#f5f5f5", border: "1px solid #0a0a0a", padding: 16, borderRadius: 0, fontSize: 12, overflow: "auto", color: "#b32020", whiteSpace: "pre-wrap", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 0, background: "#0a0a0a", color: "#ffffff", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "ui-monospace, Menlo, Consolas, monospace", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 12 }}>
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
