import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { expenseService } from '../../services/expenseService'
import { storageService } from '../../services/storageService'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import DateInput from '../../components/common/DateInput/DateInput'
import FileUpload from '../../components/common/FileUpload/FileUpload'
import { MANUAL_EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants'

const initialForm = {
  vehicle_id: '',
  category: 'Parking',
  amount: '',
  expense_date: new Date().toISOString().split('T')[0],
  payment_method: '',
  description: '',
  note: '',
}

function validate(form) {
  const errors = {}
  if (!form.vehicle_id) errors.vehicle_id = 'Please select a vehicle'
  if (!form.category) errors.category = 'Please select a category'
  if (!form.amount) {
    errors.amount = 'Amount is required'
  } else if (Number(form.amount) <= 0) {
    errors.amount = 'Amount must be greater than zero'
  }
  if (!form.expense_date) errors.expense_date = 'Date is required'
  return errors
}

export default function ExpenseForm({ expense, vehicles, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [receiptPath, setReceiptPath] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [removeExistingReceipt, setRemoveExistingReceipt] = useState(false)
  const isEdit = !!expense

  useEffect(() => {
    if (expense) {
      setForm({
        vehicle_id: expense.vehicle_id || '',
        category: expense.category || '',
        amount: expense.amount != null ? String(expense.amount) : '',
        expense_date: expense.expense_date || '',
        payment_method: expense.payment_method || '',
        description: expense.description || '',
        note: expense.note || '',
      })
      setReceiptPath(expense.receipt_url || '')
    }
  }, [expense])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileSelect = ({ file, error }) => {
    if (error) {
      toast.error(error)
      return
    }
    setRemoveExistingReceipt(false)
    setPendingFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      let finalReceiptPath = removeExistingReceipt ? '' : receiptPath

      if (pendingFile) {
        const uploadedPath = await storageService.uploadDocument(
          pendingFile,
          user.id,
          form.vehicle_id,
          'expense'
        )
        if (receiptPath && !removeExistingReceipt) {
          try { await storageService.deleteDocument(receiptPath) } catch (err) { console.error(err) }
        }
        finalReceiptPath = uploadedPath
      }

      const payload = {
        vehicle_id: form.vehicle_id,
        category: form.category,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        payment_method: form.payment_method || null,
        description: form.description.trim(),
        note: form.note.trim(),
        receipt_url: finalReceiptPath,
      }

      if (isEdit) {
        await expenseService.update(expense.id, payload)
        toast.success('Expense updated successfully')
      } else {
        await expenseService.create(payload)
        toast.success('Expense added successfully')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.message || (isEdit ? 'Failed to update expense' : 'Failed to add expense'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const vehicleOptions = vehicles.map(v => ({
    value: v.id,
    label: `${v.name} (${v.reg_number})`,
  }))

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Expense' : 'Add Expense'}
      size="md"
    >
      <form className="module-form" onSubmit={handleSubmit}>
        <div className="module-form-grid">
          <SelectInput
            label="Vehicle"
            name="vehicle_id"
            value={form.vehicle_id}
            onChange={handleChange}
            error={errors.vehicle_id}
            options={vehicleOptions}
            placeholder="Select vehicle"
            required
          />
          <SelectInput
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            error={errors.category}
            options={MANUAL_EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))}
            placeholder="Select category"
            required
          />
          <FormInput
            label="Amount (₹)"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            error={errors.amount}
            placeholder="0.00"
            required
          />
          <SelectInput
            label="Payment Method"
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
            options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
            placeholder="Select method"
          />
          <DateInput
            label="Expense Date"
            name="expense_date"
            value={form.expense_date}
            onChange={handleChange}
            error={errors.expense_date}
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="e.g. Mall parking, seat cover"
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="expense-note">Notes</label>
          <textarea
            id="expense-note"
            name="note"
            className="form-input"
            rows={2}
            value={form.note}
            onChange={handleChange}
            placeholder="Optional notes"
          />
        </div>

        <FileUpload
          label="Receipt (PDF or image)"
          onFileSelect={handleFileSelect}
          existingPath={receiptPath}
          onExistingOpen={async () => {
            try {
              const url = await storageService.getSignedUrl(receiptPath)
              if (url) window.open(url, '_blank')
            } catch (err) {
              toast.error('Could not open receipt')
            }
          }}
          onRemove={() => { setReceiptPath(''); setRemoveExistingReceipt(true); setPendingFile(null) }}
        />

        <div className="module-form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}