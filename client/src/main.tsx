import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { SocketProvider } from './context/SocketContext.tsx'
import AppRouter from './router/AppRouter.tsx'

/**
 * App Entry point
 * Provider order matters
 *    AuthProvider -> must wrap everything
 *    SocketProvider -> needs to be inside AuthProvider
 *    AppRouter -> routes rendered inside both providers
 */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <AppRouter />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)
