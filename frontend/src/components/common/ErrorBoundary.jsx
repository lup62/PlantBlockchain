import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', backgroundColor: '#111', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h1 style={{ color: '#ef4444' }}>Something went wrong.</h1>
                    <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#1f1f1f', borderRadius: '8px' }}>
                        <h3 style={{ color: '#f87171' }}>{this.state.error && this.state.error.toString()}</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#9ca3af', fontSize: '12px' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
