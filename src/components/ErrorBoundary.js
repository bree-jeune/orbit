/**
 * Error Boundary for Orbit
 *
 * Catches render errors and displays a graceful fallback
 * instead of crashing the entire app.
 */

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Orbit Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.icon}>○</div>
          <h2 style={styles.title}>Something went wrong</h2>
          <p style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button style={styles.button} onClick={this.handleRetry}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0a0a0f',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textAlign: 'center',
    padding: '20px',
  },
  icon: {
    fontSize: '48px',
    color: 'rgba(59, 130, 246, 0.5)',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 12px 0',
  },
  message: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.4)',
    margin: '0 0 24px 0',
    maxWidth: '300px',
  },
  button: {
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: 'rgba(59, 130, 246, 0.9)',
    padding: '10px 24px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default ErrorBoundary;
