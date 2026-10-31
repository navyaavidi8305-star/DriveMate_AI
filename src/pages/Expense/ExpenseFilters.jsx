import FilterDropdown from '../../components/common/FilterDropdown/FilterDropdown'
import { EXPENSE_SOURCES } from '../../utils/constants'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom' },
]

export default function ExpenseFilters({ filters, onChange, vehicles, categories }) {
  const sourceOptions = [
    { value: 'manual', label: 'Manual' },
    ...Object.entries(EXPENSE_SOURCES).map(([value, label]) => ({ value, label })),
  ]

  return (
    <div className="expense-filters">
      <div className="expense-period-selector">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`expense-period-btn ${filters.period === p.key ? 'active' : ''}`}
            onClick={() => onChange({ period: p.key })}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filters.period === 'custom' && (
        <div className="expense-filter-group">
          <label className="expense-date-field">
            <span className="expense-field-label">From</span>
            <input
              type="date"
              className="form-input"
              value={filters.dateFrom || ''}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
            />
          </label>
          <label className="expense-date-field">
            <span className="expense-field-label">To</span>
            <input
              type="date"
              className="form-input"
              value={filters.dateTo || ''}
              onChange={(e) => onChange({ dateTo: e.target.value })}
            />
          </label>
        </div>
      )}

      <div className="expense-filter-group">
        <FilterDropdown
          label="Vehicle"
          value={filters.vehicle || ''}
          onChange={(v) => onChange({ vehicle: v })}
          options={vehicles.map((v) => ({ value: v.id, label: `${v.name} (${v.reg_number})` }))}
          allLabel="All Vehicles"
        />
        <FilterDropdown
          label="Category"
          value={filters.category || ''}
          onChange={(c) => onChange({ category: c })}
          options={categories.map((c) => ({ value: c, label: c }))}
          allLabel="All Categories"
        />
        <FilterDropdown
          label="Source"
          value={filters.source || ''}
          onChange={(s) => onChange({ source: s })}
          options={sourceOptions}
          allLabel="All Sources"
        />
      </div>

      <div className="expense-filter-group">
        <label className="expense-date-field">
          <span className="expense-field-label">Min ₹</span>
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder="Min"
            value={filters.minAmount || ''}
            onChange={(e) => onChange({ minAmount: e.target.value })}
          />
        </label>
        <label className="expense-date-field">
          <span className="expense-field-label">Max ₹</span>
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder="Max"
            value={filters.maxAmount || ''}
            onChange={(e) => onChange({ maxAmount: e.target.value })}
          />
        </label>
        <button className="btn btn-secondary btn-sm" onClick={() => onChange({ period: 'all', vehicle: '', category: '', source: '', minAmount: '', maxAmount: '', dateFrom: '', dateTo: '' })}>
          Reset
        </button>
      </div>
    </div>
  )
}