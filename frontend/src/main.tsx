import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import AuthProvider from './features/auth/AuthProvider'
import { queryClient } from './lib/queryClient'
import './index.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-700.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
