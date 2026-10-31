import { MoreVertical, Eye, Edit2, Trash2, Wallet } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import EmptyState from '../EmptyState/EmptyState'
import './DataTable.css'

function RowActions({ onView, onEdit, onDelete, extraActions }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!onView && !onEdit && !onDelete && (!extraActions || extraActions.length === 0)) {
    return null
  }

  return (
    <div className="row-actions" ref={ref}>
      <button className="btn-icon" onClick={() => setOpen(!open)}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="row-actions-menu">
          {onView && (
            <button onClick={() => { onView(); setOpen(false) }}>
              <Eye size={14} /> View
            </button>
          )}
          {extraActions && extraActions.map((action) => {
            const Icon = action.icon || Wallet
            return (
              <button
                key={action.key}
                className={action.danger ? 'danger' : ''}
                onClick={() => { action.onClick(); setOpen(false) }}
              >
                <Icon size={14} /> {action.label}
              </button>
            )
          })}
          {onEdit && (
            <button onClick={() => { onEdit(); setOpen(false) }}>
              <Edit2 size={14} /> Edit
            </button>
          )}
          {onDelete && (
            <button className="danger" onClick={() => { onDelete(); setOpen(false) }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function DataTable({
  columns,
  data,
  loading,
  emptyTitle = 'No records found',
  emptyDescription = 'No data available.',
  onView,
  onEdit,
  onDelete,
  onRowClick,
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,
  extraActions,
}) {
  if (loading) return <LoadingSpinner message="Loading data..." />

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    )
  }

  const hasActions = onView || onEdit || onDelete || (extraActions && extraActions.length > 0)

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
            {hasActions && <th className="col-actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {hasActions && (
                <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                  <RowActions
                    onView={onView ? () => onView(row) : null}
                    onEdit={onEdit ? () => onEdit(row) : null}
                    onDelete={onDelete ? () => onDelete(row) : null}
                    extraActions={
                      extraActions
                        ? extraActions.map((a) => ({ ...a, onClick: () => a.onClick(row) }))
                        : null
                    }
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}