import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { setupAxiosAuthInterceptor } from './utils/axiosAuthInterceptor.js'

setupAxiosAuthInterceptor()

createRoot(document.getElementById('root')).render(
  <App />
)
