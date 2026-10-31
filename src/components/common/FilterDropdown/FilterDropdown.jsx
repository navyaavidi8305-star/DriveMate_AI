import { ChevronDown } from 'lucide-react'
import './FilterDropdown.css'

export default function FilterDropdown({ label, value, onChange, options = [], allLabel = 'All' }) {
  return (
    <div className="filter-dropdown">
      {label && <label className="filter-dropdown-label">{label}</label>}
      <div className="filter-dropdown-wrapper">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="filter-dropdown-select"
        >
          <option value="">{allLabel}</option>
          {options.map((opt) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="filter-dropdown-chevron" />
      </div>
    </div>
  )
}
