import { useState, useMemo } from 'react'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import FormInput from '../../components/common/FormInput/FormInput'
import { formatDate, formatCurrency } from '../../utils/statusHelpers'
import { dailyBreakdown, monthlyBreakdown, yearlyReport, toDateKey, todayKey } from '../../services/expenseService'

function BreakdownList({ breakdown, total }) {
  const max = breakdown.length ? Math.max(...breakdown.map((b) => b.amount)) : 1
  if (breakdown.length === 0) {
    return <div className="expense-report-empty">No expenses recorded for this period.</div>
  }
  return (
    <div className="expense-report-panel">
      <div className="expense-breakdown-list">
        {breakdown.map((b) => (
          <div key={b.category} className="expense-breakdown-item">
            <span className="expense-breakdown-label">{b.category}</span>
            <div className="expense-breakdown-bar-track">
              <div className="expense-breakdown-bar" style={{ width: `${Math.max(4, (b.amount / max) * 100)}%` }} />
            </div>
            <span className="expense-breakdown-value">{formatCurrency(b.amount)}</span>
          </div>
        ))}
      </div>
      <div className="expense-report-total">
        <span>Total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </div>
  )
}

export default function ExpenseReports({ view, expenses, vehicles, vehicleMap }) {
  const now = new Date()
  const [dailyDate, setDailyDate] = useState(todayKey())
  const [month, setMonth] = useState(now.getMonth())
  const [monthYear, setMonthYear] = useState(now.getFullYear())
  const [monthVehicle, setMonthVehicle] = useState('')
  const [year, setYear] = useState(now.getFullYear())

  const years = useMemo(() => {
    const set = new Set([now.getFullYear()])
    ;(expenses || []).forEach((e) => {
      const y = Number((toDateKey(e.expense_date) || '').slice(0, 4))
      if (y) set.add(y)
    })
    return Array.from(set).sort((a, b) => b - a)
  }, [expenses])

  const daily = useMemo(() => dailyBreakdown(expenses, dailyDate), [expenses, dailyDate])
  const monthly = useMemo(
    () => monthlyBreakdown(expenses, monthYear, month, monthVehicle),
    [expenses, monthYear, month, monthVehicle]
  )
  const yearly = useMemo(() => yearlyReport(expenses, year), [expenses, year])

  const vehicleOptions = vehicles.map((v) => ({ value: v.id, label: `${v.name} (${v.reg_number})` }))
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2000, i, 1).toLocaleDateString('en-IN', { month: 'long' }),
  }))

  if (view === 'daily') {
    return (
      <div className="expense-report">
        <div className="expense-report-controls">
          <FormInput label="Date" type="date" name="dailyDate" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} />
        </div>
        <div className="expense-report-title">{formatDate(dailyDate)}</div>
        <BreakdownList breakdown={daily.breakdown} total={daily.total} />
      </div>
    )
  }

  if (view === 'monthly') {
    return (
      <div className="expense-report">
        <div className="expense-report-controls">
          <SelectInput label="Month" name="month" value={month} onChange={(e) => setMonth(Number(e.target.value))} options={monthOptions} />
          <SelectInput label="Year" name="year" value={monthYear} onChange={(e) => setMonthYear(Number(e.target.value))} options={years.map((y) => ({ value: y, label: String(y) }))} />
          <SelectInput label="Vehicle" name="vehicle" value={monthVehicle} onChange={(e) => setMonthVehicle(e.target.value)} options={vehicleOptions} placeholder="Select vehicle" />
        </div>
        <div className="expense-report-title">
          {new Date(monthYear, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </div>
        <BreakdownList breakdown={monthly.breakdown} total={monthly.total} />
      </div>
    )
  }

  const yearlyStats = [
    { label: 'Total Yearly Expense', value: formatCurrency(yearly.total) },
    { label: 'Average Monthly Expense', value: formatCurrency(yearly.average) },
    { label: 'Highest Spending Month', value: yearly.highest ? `${yearly.highest.month} · ${formatCurrency(yearly.highest.amount)}` : '-' },
    { label: 'Lowest Spending Month', value: yearly.lowest ? `${yearly.lowest.month} · ${formatCurrency(yearly.lowest.amount)}` : '-' },
  ]

  const maxMonthly = Math.max(1, ...yearly.months.map((m) => m.amount))

  return (
    <div className="expense-report">
      <div className="expense-report-controls">
        <SelectInput label="Year" name="year" value={year} onChange={(e) => setYear(Number(e.target.value))} options={years.map((y) => ({ value: y, label: String(y) }))} />
      </div>
      <div className="expense-report-title">Year {year}</div>

      <div className="stat-cards stat-cards--4 expense-yearly-stats">
        {yearlyStats.map((s) => (
          <div key={s.label} className="expense-yearly-stat">
            <span className="stat-card-title">{s.label}</span>
            <span className="stat-card-value">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="expense-report-panel">
        <div className="expense-breakdown-list">
          {yearly.months.map((m) => (
            <div key={m.month} className="expense-breakdown-item">
              <span className="expense-breakdown-label">{m.month}</span>
              <div className="expense-breakdown-bar-track">
                <div className="expense-breakdown-bar" style={{ width: m.amount ? `${Math.max(4, (m.amount / maxMonthly) * 100)}%` : '0%' }} />
              </div>
              <span className="expense-breakdown-value">{m.amount ? formatCurrency(m.amount) : '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}