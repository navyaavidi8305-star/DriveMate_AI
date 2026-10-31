import './StatusBadge.css'

const STATUS_CONFIG = {
  Active: { className: 'badge-success', dot: true },
  Valid: { className: 'badge-success', dot: true },
  Completed: { className: 'badge-success', dot: true },
  Inactive: { className: 'badge-danger', dot: true },
  Expired: { className: 'badge-danger', dot: true },
  Overdue: { className: 'badge-danger', dot: true },
  'Expiring Soon': { className: 'badge-warning', dot: true },
  'Low Balance': { className: 'badge-warning', dot: true },
  Upcoming: { className: 'badge-info', dot: true },
  Pending: { className: 'badge-warning', dot: true },
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { className: 'badge-default', dot: false }

  return (
    <span className={`status-badge ${config.className}`}>
      {config.dot && <span className="status-badge-dot" />}
      {status}
    </span>
  )
}
