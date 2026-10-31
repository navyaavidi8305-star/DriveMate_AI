import './StatCard.css'

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <span className="stat-card-title">{title}</span>
        <span className="stat-card-value">{value}</span>
        {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
      </div>
      {Icon && (
        <div className={`stat-card-icon stat-card-icon--${color}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  )
}
