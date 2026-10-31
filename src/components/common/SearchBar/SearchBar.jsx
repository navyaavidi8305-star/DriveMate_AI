import { Search, X } from 'lucide-react'
import './SearchBar.css'

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-bar">
      <Search size={16} className="search-bar-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-bar-input"
      />
      {value && (
        <button className="search-bar-clear" onClick={() => onChange('')}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
