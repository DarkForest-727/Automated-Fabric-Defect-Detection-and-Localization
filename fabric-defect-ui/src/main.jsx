import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter wraps everything so all pages have access to routing */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)