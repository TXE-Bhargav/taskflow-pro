import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// QueryClient — manages all API call caching
// staleTime: data is fresh for 1 min before refetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          60 * 1000,
      retry:              1,
      refetchOnWindowFocus: false
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* Toaster shows popup notifications anywhere in the app */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px'
            }
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
);