import { supabase } from '../lib/supabase'
import { vehicleService } from './vehicleService'
import { mileageService } from './mileageService'
import { insuranceService } from './insuranceService'
import { fastagService } from './fastagService'
import { licenseService } from './licenseService'
import { pucService } from './pucService'
import { fitnessService } from './fitnessService'
import { maintenanceService, getDisplayStatus } from './maintenanceService'
import { expenseService } from './expenseService'
import { computeExpiryStatus, daysUntil } from '../utils/statusHelpers'

function vehicleLabel(v) {
  if (!v) return 'Unknown vehicle'
  return `${v.name}${v.reg_number ? ` (${v.reg_number})` : ''}`
}

function collectExpiryItem(typeLabel, path, label, item, dateKey) {
  const date = item[dateKey]
  if (!date) return null
  const status = computeExpiryStatus(date)
  if (status === 'Valid') return null
  const days = daysUntil(date)
  return {
    id: `${typeLabel}-${item.id}`,
    type: typeLabel,
    path,
    label,
    vehicle: item.vehicles ? vehicleLabel(item.vehicles) : '',
    date,
    days,
    status,
  }
}

export const dashboardService = {
  async getDashboardData() {
    const [
      vehicles,
      mileage,
      insurances,
      fastags,
      licenses,
      pucs,
      fitnesses,
      maintenances,
      expenses,
    ] = await Promise.all([
      vehicleService.getAll(),
      mileageService.getAll(),
      insuranceService.getAll(),
      fastagService.getAll(),
      licenseService.getAll(),
      pucService.getAll(),
      fitnessService.getAll(),
      maintenanceService.getAll(),
      expenseService.getAll(),
    ])

    const totalDistance = mileage.reduce((sum, r) => sum + (r.distance || 0), 0)
    const vehicleCount = vehicles.length
    const totalSpent = expenses.reduce((sum, r) => sum + (r.amount || 0), 0)

    const alerts = []

    insurances.forEach(i => {
      const item = collectExpiryItem('Insurance', '/insurance', i.policy_number, i, 'expiry_date')
      if (item) alerts.push(item)
    })
    fastags.forEach(f => {
      if (f.status === 'Low Balance') {
        alerts.push({
          id: `FASTag-${f.id}`,
          type: 'FASTag',
          path: '/fastag',
          label: `${f.fastag_id || f.bank || ''}`.trim() || 'FASTag',
          vehicle: f.vehicles ? vehicleLabel(f.vehicles) : '',
          date: null,
          days: 0,
          status: 'Low Balance',
        })
      }
    })
    licenses.forEach(l => {
      const item = collectExpiryItem('License', '/license', l.license_number, l, 'valid_till')
      if (item) alerts.push(item)
    })
    pucs.forEach(p => {
      const item = collectExpiryItem('PUC', '/puc', p.puc_number, p, 'valid_till')
      if (item) alerts.push(item)
    })
    fitnesses.forEach(f => {
      const item = collectExpiryItem('Fitness', '/fitness', f.fitness_number, f, 'valid_till')
      if (item) alerts.push(item)
    })
    maintenances.forEach(m => {
      if (m.status === 'Completed') return
      const displayStatus = getDisplayStatus(m)
      if (displayStatus !== 'Overdue' && displayStatus !== 'Upcoming') return
      const upcomingOnly = m.next_service_date && m.next_service_date >= new Date().toISOString().split('T')[0]
      if (upcomingOnly && daysUntil(m.next_service_date) > 30) return
      alerts.push({
        id: `Maintenance-${m.id}`,
        type: 'Maintenance',
        path: '/maintenance',
        label: m.service_type,
        vehicle: m.vehicles ? vehicleLabel(m.vehicles) : '',
        date: m.next_service_date,
        days: daysUntil(m.next_service_date),
        status: displayStatus,
      })
    })

    alerts.sort((a, b) => a.days - b.days)
    const expiringCount = alerts.length

    const recentExpenses = [...expenses]
      .sort((a, b) => {
        const byDate = b.expense_date.localeCompare(a.expense_date)
        if (byDate !== 0) return byDate
        return (b.created_at || '').localeCompare(a.created_at || '')
      })
      .slice(0, 6)

    const recentMileage = mileage.slice(0, 5)

    const monthlySpent = expenses.reduce((sum, r) => {
      const d = new Date(r.expense_date)
      const now = new Date()
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        return sum + (r.amount || 0)
      }
      return sum
    }, 0)

    return {
      stats: {
        vehicleCount,
        totalDistance,
        totalSpent,
        monthlySpent,
        expiringCount,
      },
      alerts,
      recentExpenses,
      recentMileage,
    }
  },
}

export { supabase }