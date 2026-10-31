import { AlertTriangle } from 'lucide-react'
import Modal from '../Modal/Modal'
import './ConfirmDialog.css'

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Delete',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="" size="sm">
      <div className="confirm-dialog">
        <div className="confirm-dialog-icon">
          <AlertTriangle size={32} />
        </div>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
