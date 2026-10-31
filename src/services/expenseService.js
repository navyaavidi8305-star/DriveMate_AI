import { supabase } from '../lib/supabase'

const TABLE = 'expenses'

export const expenseService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, vehicles(id, name, reg_number)')
      .order('expense_date', { ascending: false })
    if (error) throw error
    return data
  },

  async create(record) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...record, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

// ---------------------------------------------------------------------------
// Pure aggregation helpers. The page fetches the user's expenses once and all
// analytics are derived from these so there is a single round-trip per load.
// ---------------------------------------------------------------------------

export function toDateKey(value) {
  if (value == null) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey() {
  return toDateKey(new Date())
}

function inRange(dateKey, from, to) {
  return (!from || dateKey >= from) && (!to || dateKey <= to)
}

export function filterExpenses(expenses, { from, to, vehicleId, category, source, minAmount, maxAmount, search }) {
  const q = (search || '').trim().toLowerCase()
  return (expenses || []).filter((e) => {
    if (!inRange(toDateKey(e.expense_date), from, to)) return false
    if (vehicleId && e.vehicle_id !== vehicleId) return false
    if (category && e.category !== category) return false
    if (source && (e.source_type || 'manual') !== source) return false
    const amount = Number(e.amount || 0)
    if (minAmount && amount < Number(minAmount)) return false
    if (maxAmount && amount > Number(maxAmount)) return false
    if (q) {
      const vehicle = e.vehicles || {}
      const haystack = [
        e.category,
        e.description,
        e.note,
        vehicle.name,
        vehicle.reg_number,
      ].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function sumAmount(expenses) {
  return (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
}

export function categoryBreakdown(expenses) {
  const map = new Map()
  ;(expenses || []).forEach((e) => {
    map.set(e.category, (map.get(e.category) || 0) + (Number(e.amount) || 0))
  })
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function monthlyTrend(expenses, monthCount = 12) {
  const now = new Date()
  const labels = []
  const map = new Map()
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const short = d.toLocaleDateString('en-IN', { month: 'short' })
    labels.push({ key, short })
    map.set(key, 0)
  }
  ;(expenses || []).forEach((e) => {
    const key = toDateKey(e.expense_date).slice(0, 7)
    if (map.has(key)) map.set(key, map.get(key) + (Number(e.amount) || 0))
  })
  return labels.map(({ key, short }) => ({
    month: short,
    key,
    amount: map.get(key) || 0,
  }))
}

export function vehicleBreakdown(expenses, vehicleMap) {
  const map = new Map()
  ;(expenses || []).forEach((e) => {
    if (!e.vehicle_id) return
    map.set(e.vehicle_id, (map.get(e.vehicle_id) || 0) + (Number(e.amount) || 0))
  })
  return Array.from(map.entries())
    .map(([id, amount]) => ({
      vehicleId: id,
      name: vehicleMap[id]?.name || 'Unknown vehicle',
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function dailyBreakdown(expenses, dateKey) {
  const day = (expenses || []).filter((e) => toDateKey(e.expense_date) === dateKey)
  const breakdown = categoryBreakdown(day)
  return { entries: day, breakdown, total: sumAmount(day) }
}

export function monthlyBreakdown(expenses, year, month, vehicleId) {
  const keyPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const rows = (expenses || []).filter(
    (e) =>
      toDateKey(e.expense_date).startsWith(keyPrefix) &&
      (!vehicleId || e.vehicle_id === vehicleId)
  )
  return { entries: rows, breakdown: categoryBreakdown(rows), total: sumAmount(rows) }
}

export function yearlyReport(expenses, year) {
  const rows = (expenses || []).filter((e) => toDateKey(e.expense_date).startsWith(`${year}-`))
  const months = []
  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`
    const total = rows
      .filter((e) => toDateKey(e.expense_date).startsWith(key))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)
    months.push({
      month: new Date(year, m, 1).toLocaleDateString('en-IN', { month: 'long' }),
      amount: total,
    })
  }
  const withSpend = months.filter((m) => m.amount > 0)
  const total = sumAmount(rows)
  return {
    months,
    total,
    average: withSpend.length ? total / withSpend.length : 0,
    highest: withSpend.length ? withSpend.reduce((a, b) => (b.amount > a.amount ? b : a)) : null,
    lowest: withSpend.length ? withSpend.reduce((a, b) => (b.amount < a.amount ? b : a)) : null,
    count: rows.length,
  }
}

export function sourceLabel(sourceType) {
  if (!sourceType) return 'Manual'
  const map = {
    fuel: 'Fuel',
    maintenance: 'Maintenance',
    insurance: 'Insurance',
    fastag: 'FASTag',
    puc: 'PUC',
    fitness: 'Fitness',
  }
  return map[sourceType] || sourceType
}

export function sourceRoute(sourceType) {
  const map = {
    fuel: '/mileage',
    maintenance: '/maintenance',
    insurance: '/insurance',
    fastag: '/fastag',
    puc: '/puc',
    fitness: '/fitness',
  }
  return map[sourceType] || null
}