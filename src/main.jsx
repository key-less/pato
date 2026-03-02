import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './presentation/App'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'
import './presentation/styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
