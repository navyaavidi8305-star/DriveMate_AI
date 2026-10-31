import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Car,
  Route,
  Wallet,
  AlertTriangle,
  Receipt,
  Gauge,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { dashboardService } from '../../services/dashboardService'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import StatCard from '../../components/common/StatCard/StatCard'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import { formatCurrency, formatDate, daysUntil } from '../../utils/statusHelpers'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const dashboardData = await dashboardService.getDashboardData()
      setData(dashboardData)
    } catch (err) {
      toast.error('Failed to load dashboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const firstName = (user?.user_metadata?.full_name || user?.name || '').split(' ')[0] || 'there'

  if (loading && !data) {
    return <div className="dashboard-loading">Loading dashboard...</div>
  }

  if (!data || data.stats.vehicleCount === 0) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="Dashboard"
          description={`Welcome, ${firstName}! Here's an overview of your vehicles`}
        />
        <div className="dashboard-empty">
          <Sparkles size={48} color="var(--text-muted)" />
          <h2>No vehicles yet</h2>
          <p>
            Add your first vehicle to unlock mileage tracking, maintenance reminders,
            document renewal alerts and expense insights.
          </p>
          <Link to="/vehicles" className="btn btn-primary">Go to Vehicles</Link>
        </div>
      </div>
    )
  }

  const { stats, alerts, recentExpenses, recentMileage } = data

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}! Here's what's happening with your vehicles`}
      />

      <div className="stat-cards stat-cards--4">
        <StatCard title="Vehicles" value={stats.vehicleCount} icon={Car} color="primary" />
        <StatCard title="Total Distance" value={`${stats.totalDistance.toLocaleString()} km`} icon={Route} color="success" />
        <StatCard title="Total Spent" value={formatCurrency(stats.totalSpent)} icon={Wallet} color="danger" />
        <StatCard title="Renewals Due" value={stats.expiringCount} icon={AlertTriangle} color="warning" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Renewals & Alerts</h3>
            {alerts.length > 0 && <Link to="/insurance" className="dashboard-link">View all <ChevronRight size={14} /></Link>}
          </div>
          {alerts.length === 0 ? (
            <div className="dashboard-panel-empty">No expiring documents or maintenance due. All clear!</div>
          ) : (
            <ul className="dashboard-alerts">
              {alerts.slice(0, 12).map((a) => (
                <li key={a.id} className="dashboard-alert-item">
                  <Link to={a.path} className="dashboard-alert-link">
                    <div className="dashboard-alert-info">
                      <div className="dashboard-alert-title">
                        {a.type} <span className="dashboard-alert-label">{a.label}</span>
                      </div>
                      <div className="dashboard-alert-sub">
                        {a.vehicle && <span>{a.vehicle} · </span>}
                        {a.date ? formatDate(a.date) : 'No date set'}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Recent Expenses</h3>
            <Link to="/expenses" className="dashboard-link">View all <ChevronRight size={14} /></Link>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="dashboard-panel-empty">No expenses recorded yet.</div>
          ) : (
            <ul className="dashboard-alerts">
              {recentExpenses.map((e) => {
                const v = e.vehicles
                return (
                  <li key={e.id} className="dashboard-expense-item">
                    <span className="dashboard-expense-cat">{e.category}</span>
                    <div className="dashboard-expense-info">
                      <div className="dashboard-alert-title">
                        {v ? v.name : 'Vehicle'}
                        <span className="dashboard-alert-label">{e.note || formatDate(e.expense_date)}</span>
                      </div>
                      <div className="dashboard-alert-sub">{formatDate(e.expense_date)}</div>
                    </div>
                    <span className="dashboard-expense-amount">{formatCurrency(e.amount)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="dashboard-grid dashboard-grid--2">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3><Gauge size={16} style={{ marginRight: 6, verticalAlign: '-2px' }} /> Recent Mileage</h3>
            <Link to="/mileage" className="dashboard-link">View all <ChevronRight size={14} /></Link>
          </div>
          {recentMileage.length === 0 ? (
            <div className="dashboard-panel-empty">No mileage records yet.</div>
          ) : (
            <ul className="dashboard-miles">
              {recentMileage.map((m) => {
                const v = m.vehicles
                return (
                  <li key={m.id} className="dashboard-miles-item">
                    <div className="dashboard-miles-date">{formatDate(m.date)}</div>
                    <div className="dashboard-miles-veh">{v ? v.name : 'Vehicle'}</div>
                    <div className="dashboard-miles-dist">{m.distance > 0 ? `${m.distance} km` : '-'}</div>
                    <div className="dashboard-miles-mpg">
                      <span className="expense-category">{(Number(m.mileage) || 0).toFixed(1)} km/l</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="dashboard-quick-actions">
            {[
              { to: '/mileage', label: 'Log Mileage', icon: Gauge },
              { to: '/maintenance', label: 'Add Maintenance', icon: Receipt },
              { to: '/expenses', label: 'Add Expense', icon: Wallet },
              { to: '/vehicles', label: 'Manage Vehicles', icon: Car },
              { to: '/insurance', label: 'Insurance', icon: AlertTriangle },
              { to: '/license', label: 'Driving License', icon: Car },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="dashboard-quick-link">
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          {/* Monthly spend summary strip */}
          <div className="dashboard-monthly-spend">
            <span>Spent in {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</span>
            <strong>{formatCurrency(stats.monthlySpent)}</strong>
          </div>
        </section>
      </div>
    </div>
  )
}