import { useState } from 'react'
import { ExternalLink, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal/Modal'
import { formatDate, formatCurrency } from '../../utils/statusHelpers'
import { sourceLabel, sourceRoute } from '../../services/expenseService'
import { storageService } from '../../services/storageService'

function Field({ label, value }) {
  return (
    <div className="expense-detail-field">
      <span className="expense-detail-label">{label}</span>
      <span className="expense-detail-value">{value || '-'}</span>
    </div>
  )
}

export default function ExpenseDetails({ expense, vehicleMap, onClose, onEdit, onDelete, onGoToSource }) {
  const [receiptUrl, setReceiptUrl] = useState(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const isAuto = !!expense.source_type
  const source = sourceLabel(expense.source_type)
  const route = sourceRoute(expense.source_type)
  const vehicle = expense.vehicles || vehicleMap[expense.vehicle_id]

  const openReceipt = async () => {
    if (!expense.receipt_url) {
      toast('No receipt uploaded', { icon: '🧾' })
      return
    }
    setReceiptLoading(true)
    try {
      const url = await storageService.getSignedUrl(expense.receipt_url)
      setReceiptUrl(url)
    } catch (err) {
      toast.error('Failed to load receipt')
    } finally {
      setReceiptLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Expense Details" size="md">
      <div className="expense-details">
        <div className="expense-details-head">
          <span className={`expense-category expense-category--${(expense.category || '').toLowerCase().replace(/[^a-z]/g, '')}`}>
            {expense.category}
          </span>
          <span className={`expense-source-badge ${isAuto ? 'auto' : 'manual'}`}>{source}</span>
        </div>

        <div className="expense-details-amount">{formatCurrency(expense.amount)}</div>

        <div className="expense-details-grid">
          <Field label="Date" value={formatDate(expense.expense_date)} />
          <Field label="Vehicle" value={vehicle ? `${vehicle.name} (${vehicle.reg_number})` : '-'} />
          <Field label="Payment Method" value={expense.payment_method} />
          <Field label="Description" value={expense.description} />
          <Field label="Notes" value={expense.note} />
        </div>

        {expense.receipt_url && (
          <button className="btn btn-secondary btn-sm" onClick={openReceipt}>
            View Receipt
          </button>
        )}

        {receiptLoading && <div className="expense-detail-hint">Loading receipt...</div>}
        {receiptUrl && (
          <div style={{ marginTop: 8 }}>
            <a href={receiptUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
              Open receipt in new tab <ExternalLink size={14} />
            </a>
          </div>
        )}

        {isAuto ? (
          <div className="expense-auto-note">
            This expense is generated automatically from a <strong>{source}</strong> record. Amount and dates are
            controlled by the source — edit or delete the original record there.
            {route && onGoToSource && (
              <button className="btn btn-secondary btn-sm" onClick={() => onGoToSource(route)} style={{ marginTop: 8 }}>
                View {source} Record <ExternalLink size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="expense-details-actions">
            <button className="btn btn-secondary" onClick={onEdit}>
              <Edit2 size={16} /> Edit
            </button>
            <button className="btn btn-danger" onClick={onDelete}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}