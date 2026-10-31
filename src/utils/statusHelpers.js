import { EXPIRY_WARNING_DAYS } from './constants'

export function computeExpiryStatus(validTill, warningDays = EXPIRY_WARNING_DAYS) {
  if (!validTill) return 'Valid'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiry = new Date(validTill)
  expiry.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Expired'
  if (diffDays <= warningDays) return 'Expiring Soon'
  return 'Valid'
}

export function daysUntil(date) {
  if (!date) return Infinity
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

export function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}