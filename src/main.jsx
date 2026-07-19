import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CrowdProvider } from './context/CrowdContext'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CrowdProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </CrowdProvider>
  </StrictMode>,
)
