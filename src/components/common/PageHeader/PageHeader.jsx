import { Plus } from 'lucide-react'
import './PageHeader.css'

export default function PageHeader({ title, description, onAdd, addLabel = 'Add New' }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {onAdd && (
        <button className="btn btn-primary" onClick={onAdd}>
          <Plus size={18} />
          {addLabel}
        </button>
      )}
    </div>
  )
}
