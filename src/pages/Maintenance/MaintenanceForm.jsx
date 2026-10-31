import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { maintenanceService } from '../../services/maintenanceService'
import { SERVICE_TYPES, MAINTENANCE_STATUSES } from '../../utils/constants'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import DateInput from '../../components/common/DateInput/DateInput'

const initialForm = {
  vehicle_id: '',
  service_date: new Date().toISOString().split('T')[0],
  service_type: '',
  description: '',
  odometer: '',
  cost: '0',
  next_service_date: '',
  next_service_odo: '',
  status: 'Completed',
}

function validate(form) {
  const errors = {}
  if (!form.vehicle_id) {
    errors.vehicle_id = 'Please select a vehicle'
  }
  if (!form.service_date) {
    errors.service_date = 'Service date is required'
  }
  if (!form.service_type) {
    errors.service_type = 'Service type is required'
  }
  if (form.odometer !== '' && Number(form.odometer) < 0) {
    errors.odometer = 'Odometer cannot be negative'
  }
  if (form.cost === '' || Number(form.cost) < 0) {
    errors.cost = 'Cost must be a non-negative number'
  }
  if (form.next_service_odo !== '' && Number(form.next_service_odo) < 0) {
    errors.next_service_odo = 'Odometer cannot be negative'
  }
  if (
    form.next_service_date &&
    form.service_date &&
    form.next_service_date < form.service_date
  ) {
    errors.next_service_date = 'Next service date must be after service date'
  }
  if (!form.status) {
    errors.status = 'Status is required'
  }
  return errors
}

export default function MaintenanceForm({ record, vehicles, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const isEdit = !!record

  useEffect(() => {
    if (record) {
      setForm({
        vehicle_id: record.vehicle_id || '',
        service_date: record.service_date || '',
        service_type: record.service_type || '',
        description: record.description || '',
        odometer: record.odometer != null ? String(record.odometer) : '',
        cost: String(record.cost ?? '0'),
        next_service_date: record.next_service_date || '',
        next_service_odo: record.next_service_odo != null ? String(record.next_service_odo) : '',
        status: record.status || 'Completed',
      })
    }
  }, [record])

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
        service_date: form.service_date,
        service_type: form.service_type,
        description: form.description.trim(),
        odometer: form.odometer !== '' ? Number(form.odometer) : null,
        cost: Number(form.cost || 0),
        next_service_date: form.next_service_date || null,
        next_service_odo: form.next_service_odo !== '' ? Number(form.next_service_odo) : null,
        status: form.status,
      }

      if (isEdit) {
        await maintenanceService.update(record.id, payload)
        toast.success('Record updated successfully')
      } else {
        await maintenanceService.create(payload)
        toast.success('Service record added successfully')
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
      title={isEdit ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
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
            label="Service Date"
            name="service_date"
            value={form.service_date}
            onChange={handleChange}
            error={errors.service_date}
            required
          />
          <SelectInput
            label="Service Type"
            name="service_type"
            value={form.service_type}
            onChange={handleChange}
            error={errors.service_type}
            options={SERVICE_TYPES}
            required
          />
          <FormInput
            label="Odometer Reading (km)"
            name="odometer"
            type="number"
            value={form.odometer}
            onChange={handleChange}
            error={errors.odometer}
            placeholder="e.g. 25000"
            min="0"
          />
          <FormInput
            label="Cost (₹)"
            name="cost"
            type="number"
            value={form.cost}
            onChange={handleChange}
            error={errors.cost}
            placeholder="e.g. 3500"
            min="0"
            required
          />
          <SelectInput
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            error={errors.status}
            options={MAINTENANCE_STATUSES}
            required
          />
          <DateInput
            label="Next Service Date"
            name="next_service_date"
            value={form.next_service_date}
            onChange={handleChange}
            error={errors.next_service_date}
          />
          <FormInput
            label="Next Service Odometer (km)"
            name="next_service_odo"
            type="number"
            value={form.next_service_odo}
            onChange={handleChange}
            error={errors.next_service_odo}
            placeholder="e.g. 30000"
            min="0"
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className="form-input"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Details about the service performed"
          />
        </div>

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