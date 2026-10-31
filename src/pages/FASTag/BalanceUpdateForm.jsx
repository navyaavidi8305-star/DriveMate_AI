import { useState } from 'react'
import toast from 'react-hot-toast'
import { fastagService } from '../../services/fastagService'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import './BalanceUpdateForm.css'

export default function BalanceUpdateForm({ fastag, vehicleName, onClose, onSuccess }) {
  const [balance, setBalance] = useState(String(fastag.balance ?? '0'))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (balance === '' || Number(balance) < 0) {
      setError('Balance must be a non-negative number')
      return
    }
    setLoading(true)
    try {
      await fastagService.updateBalance(fastag.id, Number(balance))
      onSuccess()
    } catch (err) {
      toast.error('Failed to update balance')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Update FASTag Balance"
      size="sm"
    >
      <form className="module-form" onSubmit={handleSubmit}>
        <div className="balance-update-info">
          <div className="balance-update-vehicle">{vehicleName}</div>
          <div className="balance-update-id">
            FASTag ID: <span style={{ fontFamily: 'monospace' }}>{fastag.fastag_id}</span>
          </div>
        </div>

        <FormInput
          label="Current Balance (₹)"
          name="balance"
          type="number"
          value={balance}
          onChange={(e) => { setBalance(e.target.value); setError('') }}
          error={error}
          placeholder="e.g. 500"
          min="0"
          required
        />

        <div className="module-form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Update Balance'}
          </button>
        </div>
      </form>
    </Modal>
  )
}