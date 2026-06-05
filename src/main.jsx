import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider, useAuth } from '@/hooks/useAuth.jsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoginPage } from '@/pages/LoginPage'
import { SetPasswordPage } from '@/pages/SetPasswordPage'

function AuthGate() {
  const { user, loading, needsPassword, completePasswordSetup } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-navy-200 border-t-navy-800 animate-spin" />
      </div>
    )
  }

  // Luồng invite/recovery: đã có session tạm từ link → cho đặt mật khẩu
  if (user && needsPassword) {
    return <SetPasswordPage onDone={completePasswordSetup} />
  }

  if (!user) {
    return <LoginPage />
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
