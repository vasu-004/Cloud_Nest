// src/main.jsx - React app entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* Global toast notification container */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                maxWidth: '400px',
              },
              success: { 
                iconTheme: { primary: '#06b6d4', secondary: '#0f172a' },
                style: {
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }
              },
              error: { 
                iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }
              },
            }}
          />
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
