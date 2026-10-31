import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { vehicleService } from '../../services/vehicleService'
import { VEHICLE_TYPES, FUEL_TYPES, VEHICLE_STATUSES } from '../../utils/constants'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import DateInput from '../../components/common/DateInput/DateInput'

const initialForm = {
  name: '',
  reg_number: '',
  type: '',
  fuel_type: '',
  manufacturer: '',
  model: '',
  reg_date: '',
  engine_number: '',
  chassis_number: '',
  odometer: '0',
  status: 'Active',
}

function validate(form) {
  const errors = {}
  if (!form.name || form.name.trim().length < 2) {
    errors.name = 'Vehicle name must be at least 2 characters'
  }
  if (!form.reg_number || form.reg_number.trim().length < 2) {
    errors.reg_number = 'Registration number is required'
  }
  if (!form.type) {
    errors.type = 'Vehicle type is required'
  }
  if (!form.fuel_type) {
    errors.fuel_type = 'Fuel type is required'
  }
  if (form.odometer === '' || isNaN(Number(form.odometer)) || Number(form.odometer) < 0) {
    errors.odometer = 'Odometer must be a non-negative number'
  }
  if (!form.status) {
    errors.status = 'Status is required'
  }
  return errors
}

export default function VehicleForm({ vehicle, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const isEdit = !!vehicle

  useEffect(() => {
    if (vehicle) {
      setForm({
        name: vehicle.name || '',
        reg_number: vehicle.reg_number || '',
        type: vehicle.type || '',
        fuel_type: vehicle.fuel_type || '',
        manufacturer: vehicle.manufacturer || '',
        model: vehicle.model || '',
        reg_date: vehicle.reg_date || '',
        engine_number: vehicle.engine_number || '',
        chassis_number: vehicle.chassis_number || '',
        odometer: String(vehicle.odometer ?? 0),
        status: vehicle.status || 'Active',
      })
    }
  }, [vehicle])

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
        ...form,
        name: form.name.trim(),
        reg_number: form.reg_number.trim().toUpperCase(),
        manufacturer: form.manufacturer.trim(),
        model: form.model.trim(),
        engine_number: form.engine_number.trim(),
        chassis_number: form.chassis_number.trim(),
        odometer: Number(form.odometer),
      }

      if (isEdit) {
        await vehicleService.update(vehicle.id, payload)
        toast.success('Vehicle updated successfully')
      } else {
        await vehicleService.create(payload)
        toast.success('Vehicle added successfully')
      }
      onSuccess()
    } catch (err) {
      if (err.message?.includes('duplicate key') || err.code === '23505') {
        toast.error('A vehicle with this registration number already exists')
      } else {
        toast.error(isEdit ? 'Failed to update vehicle' : 'Failed to add vehicle')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
      size="lg"
    >
      <form className="module-form" onSubmit={handleSubmit}>
        <div className="module-form-grid">
          <FormInput
            label="Vehicle Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. My Car"
            required
          />
          <FormInput
            label="Registration Number"
            name="reg_number"
            value={form.reg_number}
            onChange={handleChange}
            error={errors.reg_number}
            placeholder="e.g. MH12AB1234"
            required
          />
          <SelectInput
            label="Vehicle Type"
            name="type"
            value={form.type}
            onChange={handleChange}
            error={errors.type}
            options={VEHICLE_TYPES}
            required
          />
          <SelectInput
            label="Fuel Type"
            name="fuel_type"
            value={form.fuel_type}
            onChange={handleChange}
            error={errors.fuel_type}
            options={FUEL_TYPES}
            required
          />
          <FormInput
            label="Manufacturer"
            name="manufacturer"
            value={form.manufacturer}
            onChange={handleChange}
            placeholder="e.g. Maruti Suzuki"
          />
          <FormInput
            label="Model"
            name="model"
            value={form.model}
            onChange={handleChange}
            placeholder="e.g. Swift"
          />
          <DateInput
            label="Registration Date"
            name="reg_date"
            value={form.reg_date}
            onChange={handleChange}
          />
          <FormInput
            label="Current Odometer (km)"
            name="odometer"
            type="number"
            value={form.odometer}
            onChange={handleChange}
            error={errors.odometer}
            min="0"
            required
          />
          <FormInput
            label="Engine Number"
            name="engine_number"
            value={form.engine_number}
            onChange={handleChange}
            placeholder="Optional"
          />
          <FormInput
            label="Chassis Number"
            name="chassis_number"
            value={form.chassis_number}
            onChange={handleChange}
            placeholder="Optional"
          />
          <SelectInput
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            error={errors.status}
            options={VEHICLE_STATUSES}
            required
          />
        </div>

        <div className="module-form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
