import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Root Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('wednesday_sessions');
      localStorage.removeItem('wednesday_active_session_id');
      localStorage.removeItem('bro_guest_start');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#070a12',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: 'rgba(13, 20, 36, 0.95)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 0 50px rgba(0, 240, 255, 0.15)',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#00f0ff', margin: '0 0 12px 0', fontSize: '20px' }}>Application Reload Assistant</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {this.state.error?.message || "A rendering synchronization event occurred."}
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  background: 'rgba(0, 240, 255, 0.2)',
                  border: '1px solid #00f0ff',
                  color: '#00f0ff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Reload View
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Reset Session & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
