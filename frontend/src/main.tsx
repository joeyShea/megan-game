import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// No StrictMode — it causes Phaser to initialize twice in dev
createRoot(document.getElementById('root')!).render(<App />)
