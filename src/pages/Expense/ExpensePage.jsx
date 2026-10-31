import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { expenseService, filterExpenses, sumAmount, categoryBreakdown, monthlyTrend, vehicleBreakdown, toDateKey, todayKey } from '../../services/expenseService'
import { vehicleService } from '../../services/vehicleService'
import { mileageService } from '../../services/mileageService'
import { storageService } from '../../services/storageService'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog'
import { formatCurrency } from '../../utils/statusHelpers'
import { EXPENSE_CATEGORIES } from '../../utils/constants'
import ExpenseSummaryCards from './ExpenseSummaryCards'
import ExpenseCharts from './ExpenseCharts'
import ExpenseFilters from './ExpenseFilters'
import ExpenseTable from './ExpenseTable'
import ExpenseDetails from './ExpenseDetails'
import ExpenseReports from './ExpenseReports'
import ExpenseForm from './ExpenseForm'
import './ExpensePage.css'

const PAGE_SIZE = 10
const VIEWS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function getRange(period, customFrom, customTo) {
  const now = new Date()
  const today = todayKey()
  if (period === 'today') return { from: today, to: today }
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return { from: toDateKey(d), to: today }
  }
  if (period === 'month') return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today }
  if (period === 'year') return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` }
  if (period === 'custom') return { from: customFrom, to: customTo }
  return { from: '', to: '' }
}

export default function ExpensePage() {
  const navigate = useNavigate()

  const [expenses, setExpenses] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [mileageRecords, setMileageRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState('dashboard')
  const [filters, setFilters] = useState({
    period: 'month', dateFrom: '', dateTo: '', vehicle: '', category: '', source: '', minAmount: '', maxAmount: '',
  })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [detailsExpense, setDetailsExpense] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, vehiclesData, mileageData] = await Promise.all([
        expenseService.getAll(),
        vehicleService.getAll(),
        mileageService.getAll(),
      ])
      setExpenses(data)
      setVehicles(vehiclesData)
      setMileageRecords(mileageData)
    } catch (err) {
      toast.error('Failed to load expenses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const vehicleMap = useMemo(() => vehicles.reduce((m, v) => { m[v.id] = v; return m }, {}), [vehicles])

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  // ---------- Global summary (unfiltered) ----------
  const summary = useMemo(() => {
    const now = new Date()
    const today = todayKey()
    const thisMonthPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
    const thisYearPrefix = `${now.getFullYear()}-`

    let todayTotal = 0
    let monthTotal = 0
    let yearTotal = 0
    const days = new Set()
    const months = new Set()

    expenses.forEach((e) => {
      const amount = Number(e.amount) || 0
      const key = toDateKey(e.expense_date)
      if (key === today) todayTotal += amount
      if (key.startsWith(thisMonthPrefix)) monthTotal += amount
      if (key.startsWith(thisYearPrefix)) yearTotal += amount
      if (key) days.add(key)
      if (key) months.add(key.slice(0, 7))
    })

    const total = sumAmount(expenses)
    const breakdown = categoryBreakdown(expenses)
    const totalDistance = mileageRecords.reduce((s, r) => s + (Number(r.distance) || 0), 0)

    return {
      today: formatCurrency(todayTotal),
      thisMonth: formatCurrency(monthTotal),
      thisYear: formatCurrency(yearTotal),
      total: formatCurrency(total),
      avgDaily: days.size ? formatCurrency(total / days.size) : formatCurrency(0),
      avgMonthly: months.size ? formatCurrency(total / months.size) : formatCurrency(0),
      costPerKm: totalDistance > 0 ? `${(total / totalDistance).toFixed(2)} ₹/km` : '—',
      topCategory: breakdown.length ? breakdown[0].category : '—',
    }
  }, [expenses, mileageRecords])

  // ---------- Filtered analytics (dashboard view) ----------
  const range = useMemo(
    () => getRange(filters.period, filters.dateFrom, filters.dateTo),
    [filters.period, filters.dateFrom, filters.dateTo]
  )

  const filtered = useMemo(
    () => filterExpenses(expenses, {
      from: range.from,
      to: range.to,
      vehicleId: filters.vehicle,
      category: filters.category,
      source: filters.source,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      search,
    }),
    [expenses, range, filters, search]
  )

  const filteredCategoryData = useMemo(() => categoryBreakdown(filtered), [filtered])
  const trendData = useMemo(() => monthlyTrend(expenses), [expenses])
  const vehicleChartData = useMemo(() => vehicleBreakdown(filtered, vehicleMap), [filtered, vehicleMap])

  // ---------- Table pagination ----------
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedExpenses = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // ---------- Handlers ----------
  const handleAdd = () => {
    setEditExpense(null)
    setShowForm(true)
    setDetailsExpense(null)
  }

  const handleEdit = (expense) => {
    setDetailsExpense(null)
    setEditExpense(expense)
    setShowForm(true)
  }

  const handleDeleteRequest = (expense) => {
    setDetailsExpense(null)
    setDeleteTarget(expense)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.receipt_url) {
        try { await storageService.deleteDocument(deleteTarget.receipt_url) } catch (e) { console.error(e) }
      }
      await expenseService.remove(deleteTarget.id)
      toast.success('Expense deleted successfully')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete expense')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditExpense(null)
    loadData()
  }

  const handleGoToSource = (route) => {
    setDetailsExpense(null)
    navigate(route)
  }

  return (
    <div className="expense-page">
      <PageHeader
        title="Expense Tracking"
        description="Centralized expense aggregation from all vehicle modules"
        onAdd={handleAdd}
        addLabel="Add Expense"
      />

      <div className="expense-view-tabs">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className={`expense-view-tab ${view === v.key ? 'active' : ''}`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'dashboard' && (
        <>
          <ExpenseSummaryCards stats={summary} />

          <div className="expense-recent">
            <h3 className="expense-card-title">Expense Analytics</h3>
            <ExpenseCharts
              categoryData={filteredCategoryData}
              trendData={trendData}
              vehicleData={vehicleChartData}
            />
          </div>

          <div className="expense-recent">
            <div className="expense-recent-head">
              <h3 className="expense-card-title">Recent Expenses</h3>
              <span className="expense-recent-count">{filtered.length} records</span>
            </div>
            <ExpenseFilters
              filters={filters}
              onChange={updateFilters}
              vehicles={vehicles}
              categories={EXPENSE_CATEGORIES}
            />
            <div className="expense-search-row">
              <SearchBar
                value={search}
                onChange={(v) => { setSearch(v); setPage(1) }}
                placeholder="Search by description, vehicle, category..."
              />
            </div>
            <ExpenseTable
              expenses={pagedExpenses}
              loading={loading}
              page={safePage}
              pageSize={PAGE_SIZE}
              totalPages={totalPages}
              onPageChange={setPage}
              onView={(e) => setDetailsExpense(e)}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          </div>
        </>
      )}

      {view !== 'dashboard' && (
        <ExpenseReports
          view={view}
          expenses={expenses}
          vehicles={vehicles}
          vehicleMap={vehicleMap}
        />
      )}

      {showForm && (
        <ExpenseForm
          expense={editExpense}
          vehicles={vehicles}
          onClose={() => { setShowForm(false); setEditExpense(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {detailsExpense && (
        <ExpenseDetails
          expense={detailsExpense}
          vehicleMap={vehicleMap}
          onClose={() => setDetailsExpense(null)}
          onEdit={() => handleEdit(detailsExpense)}
          onDelete={() => handleDeleteRequest(detailsExpense)}
          onGoToSource={handleGoToSource}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Expense"
        message="Are you sure you want to delete this manual expense?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}