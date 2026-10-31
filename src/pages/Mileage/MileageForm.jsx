import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { mileageService } from '../../services/mileageService'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import DateInput from '../../components/common/DateInput/DateInput'

const initialForm = {
  vehicle_id: '',
  date: new Date().toISOString().split('T')[0],
  start_odo: '',
  end_odo: '',
  fuel_qty: '',
  fuel_cost: '',
}

function validate(form) {
  const errors = {}
  if (!form.vehicle_id) {
    errors.vehicle_id = 'Please select a vehicle'
  }
  if (!form.date) {
    errors.date = 'Date is required'
  }
  if (!form.start_odo && form.start_odo !== '0') {
    errors.start_odo = 'Starting odometer is required'
  } else if (Number(form.start_odo) < 0) {
    errors.start_odo = 'Odometer cannot be negative'
  }
  if (!form.end_odo) {
    errors.end_odo = 'Ending odometer is required'
  } else if (Number(form.end_odo) <= Number(form.start_odo)) {
    errors.end_odo = 'Ending odometer must be greater than starting'
  }
  if (!form.fuel_qty) {
    errors.fuel_qty = 'Fuel quantity is required'
  } else if (Number(form.fuel_qty) <= 0) {
    errors.fuel_qty = 'Fuel quantity must be greater than zero'
  }
  if (form.fuel_cost !== '' && Number(form.fuel_cost) < 0) {
    errors.fuel_cost = 'Fuel cost cannot be negative'
  }
  return errors
}

export default function MileageForm({ record, vehicles, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [calculatedMileage, setCalculatedMileage] = useState(null)
  const isEdit = !!record

  useEffect(() => {
    if (record) {
      setForm({
        vehicle_id: record.vehicle_id || '',
        date: record.date || '',
        start_odo: String(record.start_odo ?? ''),
        end_odo: String(record.end_odo ?? ''),
        fuel_qty: String(record.fuel_qty ?? ''),
        fuel_cost: String(record.fuel_cost ?? ''),
      })
    }
  }, [record])

  useEffect(() => {
    const start = Number(form.start_odo)
    const end = Number(form.end_odo)
    const fuel = Number(form.fuel_qty)
    if (end > start && fuel > 0) {
      setCalculatedMileage(((end - start) / fuel).toFixed(1))
    } else {
      setCalculatedMileage(null)
    }
  }, [form.start_odo, form.end_odo, form.fuel_qty])

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
        date: form.date,
        start_odo: Number(form.start_odo),
        end_odo: Number(form.end_odo),
        fuel_qty: Number(form.fuel_qty),
        fuel_cost: Number(form.fuel_cost || 0),
      }

      if (isEdit) {
        await mileageService.update(record.id, payload)
        toast.success('Record updated successfully')
      } else {
        await mileageService.create(payload)
        toast.success('Record added successfully')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.message || (isEdit ? 'Failed to update record' : 'Failed to add record'))
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
      title={isEdit ? 'Edit Mileage Record' : 'Add Mileage Record'}
      size="lg"
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
          <DateInput
            label="Date"
            name="date"
            value={form.date}
            onChange={handleChange}
            error={errors.date}
            required
          />
          <FormInput
            label="Starting Odometer (km)"
            name="start_odo"
            type="number"
            value={form.start_odo}
            onChange={handleChange}
            error={errors.start_odo}
            placeholder="e.g. 15000"
            min="0"
            required
          />
          <FormInput
            label="Ending Odometer (km)"
            name="end_odo"
            type="number"
            value={form.end_odo}
            onChange={handleChange}
            error={errors.end_odo}
            placeholder="e.g. 15500"
            min="0"
            required
          />
          <FormInput
            label="Fuel Quantity (Liters)"
            name="fuel_qty"
            type="number"
            value={form.fuel_qty}
            onChange={handleChange}
            error={errors.fuel_qty}
            placeholder="e.g. 35"
            min="0"
            step="0.1"
            required
          />
          <FormInput
            label="Fuel Cost (₹)"
            name="fuel_cost"
            type="number"
            value={form.fuel_cost}
            onChange={handleChange}
            error={errors.fuel_cost}
            placeholder="e.g. 3200"
            min="0"
          />
        </div>

        {calculatedMileage && (
          <div className="mileage-preview">
            <span className="mileage-preview-label">Calculated Mileage:</span>
            <span className="mileage-preview-value">{calculatedMileage} km/L</span>
          </div>
        )}

        <div className="module-form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
