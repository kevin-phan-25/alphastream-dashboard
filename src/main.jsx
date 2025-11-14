import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App apiUrl={apiUrl} />
  </React.StrictMode>,
)
