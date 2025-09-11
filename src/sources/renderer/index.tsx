/**
 * Minimal React entry point for hot reload testing
 * This is a placeholder until the full renderer implementation in task 3.0
 */

import React from "react";
import { createRoot } from "react-dom/client";

// Simple test component for hot reload verification
const TestApp: React.FC = () => {
    const [count, setCount] = React.useState(0);

    return (
        <div style={{
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            padding: '20px',
            textAlign: 'center',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5'
        }}>
            <h1 style={{ color: '#0078d4', marginBottom: '20px' }}>
                Support Pilot - Hot Reload Test ✅
            </h1>
            <p style={{ marginBottom: '20px', fontSize: '16px' }}>
                Hot reload is working! This text was updated without restarting the server.
            </p>
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => setCount(count + 1)}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#0078d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Count: {count}
                </button>
            </div>
            <p style={{ fontSize: '14px', color: '#666' }}>
                Try modifying this file - changes should appear instantly!
            </p>
        </div>
    );
};

// Initialize React app
const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(<TestApp />);
} else {
    throw new Error("Root element not found");
}
