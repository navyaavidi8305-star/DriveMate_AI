import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { isSupabaseConfigured } from './lib/supabase'
import AppLayout from './components/layout/AppLayout'
import LoadingSpinner from './components/common/LoadingSpinner/LoadingSpinner'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import VehiclesPage from './pages/Vehicles/VehiclesPage'
import VehicleDetail from './pages/Vehicles/VehicleDetail'
import MileagePage from './pages/Mileage/MileagePage'
import MaintenancePage from './pages/Maintenance/MaintenancePage'
import FASTagPage from './pages/FASTag/FASTagPage'
import InsurancePage from './pages/Insurance/InsurancePage'
import LicensePage from './pages/License/LicensePage'
import PUCPage from './pages/PUC/PUCPage'
import FitnessPage from './pages/Fitness/FitnessPage'
import ExpensePage from './pages/Expense/ExpensePage'
import DashboardPage from './pages/Dashboard/DashboardPage'

function SetupScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F1F5F9',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '40px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#EFF6FF',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '28px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17h14M5 17a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v7a2 2 0 01-2 2M5 17l-1 3h1m14-3l1 3h-1" />
            <circle cx="7.5" cy="17" r="1.5" />
            <circle cx="16.5" cy="17" r="1.5" />
          </svg>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
          Welcome to DriveMate
        </h1>
        <p style={{ color: '#64748B', marginBottom: '24px', lineHeight: 1.6 }}>
          Supabase is not configured yet. Follow these steps to set up:
        </p>
        <div style={{
          textAlign: 'left',
          background: '#F8FAFC',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '12px', color: '#0F172A' }}>Setup Steps:</p>
          <ol style={{ paddingLeft: '20px', color: '#334155', lineHeight: 2 }}>
            <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>supabase.com</a></li>
            <li>Go to <strong>SQL Editor</strong> and run the provided SQL schema</li>
            <li>Go to <strong>Authentication &gt; Providers</strong> and enable Email</li>
            <li>Copy your <strong>Project URL</strong> and <strong>Anon Key</strong></li>
            <li>Edit the <code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>.env</code> file in your project root</li>
            <li>Restart the dev server (<code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>npm run dev</code>)</li>
          </ol>
        </div>
        <div style={{
          background: '#FEFCE8',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '13px',
          color: '#92400E',
        }}>
          Edit your <strong>.env</strong> file and replace the placeholder values with your actual Supabase credentials.
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout />
}

function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Coming soon</p>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()

  if (!isSupabaseConfigured) {
    return <SetupScreen />
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LoadingSpinner size="lg" message="Loading DriveMate..." />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/mileage" element={<MileagePage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/fastag" element={<FASTagPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/license" element={<LicensePage />} />
        <Route path="/puc" element={<PUCPage />} />
        <Route path="/fitness" element={<FitnessPage />} />
        <Route path="/expenses" element={<ExpensePage />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
