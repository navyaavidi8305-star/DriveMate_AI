import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { fastagService } from '../../services/fastagService'
import { FASTAG_STATUSES } from '../../utils/constants'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'

const initialForm = {
  vehicle_id: '',
  fastag_id: '',
  bank: '',
  balance: '0',
}

function validate(form) {
  const errors = {}
  if (!form.vehicle_id) {
    errors.vehicle_id = 'Please select a vehicle'
  }
  if (!form.fastag_id || form.fastag_id.trim().length < 4) {
    errors.fastag_id = 'FASTag ID is required'
  }
  if (!form.bank) {
    errors.bank = 'Issuing bank is required'
  }
  if (form.balance === '' || Number(form.balance) < 0) {
    errors.balance = 'Balance must be a non-negative number'
  }
  return errors
}

export default function FASTagForm({ fastag, vehicles, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const isEdit = !!fastag

  useEffect(() => {
    if (fastag) {
      setForm({
        vehicle_id: fastag.vehicle_id || '',
        fastag_id: fastag.fastag_id || '',
        bank: fastag.bank || '',
        balance: String(fastag.balance ?? '0'),
      })
    }
  }, [fastag])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
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
      const payload = {
        vehicle_id: form.vehicle_id,
        fastag_id: form.fastag_id.trim().toUpperCase(),
        bank: form.bank.trim(),
        balance: Number(form.balance),
      }

      if (isEdit) {
        await fastagService.update(fastag.id, payload)
        toast.success('FASTag updated successfully')
      } else {
        await fastagService.create(payload)
        toast.success('FASTag added successfully')
      }
      onSuccess()
    } catch (err) {
      if (err.code === '23505') {
        toast.error('This vehicle already has a FASTag')
      } else {
        toast.error(err.message || (isEdit ? 'Failed to update FASTag' : 'Failed to add FASTag'))
      }
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
      title={isEdit ? 'Edit FASTag' : 'Add FASTag'}
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
          <FormInput
            label="FASTag ID"
            name="fastag_id"
            value={form.fastag_id}
            onChange={handleChange}
            error={errors.fastag_id}
            placeholder="e.g. 3429 1028 4567 8901"
            required
          />
          <FormInput
            label="Issuing Bank"
            name="bank"
            value={form.bank}
            onChange={handleChange}
            error={errors.bank}
            placeholder="e.g. HDFC Bank"
            required
          />
          <FormInput
            label="Current Balance (₹)"
            name="balance"
            type="number"
            value={form.balance}
            onChange={handleChange}
            error={errors.balance}
            placeholder="e.g. 500"
            min="0"
            required
          />
        </div>

        <div className="fastag-form-note">
          Balance is entered manually. Status is calculated automatically based on the balance threshold.
        </div>

        <div className="module-form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update FASTag' : 'Add FASTag'}
          </button>
        </div>
      </form>
    </Modal>
  )
}