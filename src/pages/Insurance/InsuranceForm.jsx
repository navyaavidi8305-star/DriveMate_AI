import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { insuranceService } from '../../services/insuranceService'
import { storageService } from '../../services/storageService'
import { INSURANCE_TYPES } from '../../utils/constants'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import DateInput from '../../components/common/DateInput/DateInput'
import FileUpload from '../../components/common/FileUpload/FileUpload'

const initialForm = {
  vehicle_id: '',
  company: '',
  policy_number: '',
  policy_type: '',
  start_date: '',
  expiry_date: '',
  premium: '',
  coverage: '',
}

function validate(form) {
  const errors = {}
  if (!form.vehicle_id) errors.vehicle_id = 'Please select a vehicle'
  if (!form.company || form.company.trim().length < 2) errors.company = 'Company name is required'
  if (!form.policy_number || form.policy_number.trim().length < 3) errors.policy_number = 'Policy number is required'
  if (!form.start_date) errors.start_date = 'Start date is required'
  if (!form.expiry_date) errors.expiry_date = 'Expiry date is required'
  if (form.expiry_date && form.start_date && form.expiry_date < form.start_date) {
    errors.expiry_date = 'Expiry date must be after start date'
  }
  if (form.premium !== '' && Number(form.premium) < 0) errors.premium = 'Premium must be non-negative'
  return errors
}

export default function InsuranceForm({ policy, vehicles, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [docPath, setDocPath] = useState('')
  const [removeExistingDoc, setRemoveExistingDoc] = useState(false)
  const isEdit = !!policy

  useEffect(() => {
    if (policy) {
      setForm({
        vehicle_id: policy.vehicle_id || '',
        company: policy.company || '',
        policy_number: policy.policy_number || '',
        policy_type: policy.policy_type || '',
        start_date: policy.start_date || '',
        expiry_date: policy.expiry_date || '',
        premium: String(policy.premium ?? ''),
        coverage: policy.coverage || '',
      })
      setDocPath(policy.document_url || '')
    }
  }, [policy])

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
    setRemoveExistingDoc(false)
    setPendingFile(file)
  }

  const [pendingFile, setPendingFile] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      let finalDocPath = removeExistingDoc ? '' : docPath

      if (pendingFile) {
        const uploadedPath = await storageService.uploadDocument(
          pendingFile,
          user.id,
          form.vehicle_id,
          'insurance'
        )

        if (docPath && !removeExistingDoc) {
          try { await storageService.deleteDocument(docPath) } catch (err) { console.error(err) }
        }
        finalDocPath = uploadedPath
      }

      const payload = {
        vehicle_id: form.vehicle_id,
        company: form.company.trim(),
        policy_number: form.policy_number.trim().toUpperCase(),
        policy_type: form.policy_type,
        start_date: form.start_date,
        expiry_date: form.expiry_date,
        premium: Number(form.premium || 0),
        coverage: form.coverage.trim(),
        document_url: finalDocPath,
      }

      if (isEdit) {
        await insuranceService.update(policy.id, payload)
        toast.success('Policy updated successfully')
      } else {
        await insuranceService.create(payload)
        toast.success('Policy added successfully')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.message || (isEdit ? 'Failed to update policy' : 'Failed to add policy'))
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
      title={isEdit ? 'Edit Policy' : 'Add Insurance Policy'}
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
          <SelectInput
            label="Policy Type"
            name="policy_type"
            value={form.policy_type}
            onChange={handleChange}
            options={INSURANCE_TYPES}
          />
          <FormInput
            label="Insurance Company"
            name="company"
            value={form.company}
            onChange={handleChange}
            error={errors.company}
            placeholder="e.g. ICICI Lombard"
            required
          />
          <FormInput
            label="Policy Number"
            name="policy_number"
            value={form.policy_number}
            onChange={handleChange}
            error={errors.policy_number}
            placeholder="e.g. 1234-5678-9012"
            required
          />
          <DateInput
            label="Start Date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            error={errors.start_date}
            required
          />
          <DateInput
            label="Expiry Date"
            name="expiry_date"
            value={form.expiry_date}
            onChange={handleChange}
            error={errors.expiry_date}
            required
          />
          <FormInput
            label="Premium (₹)"
            name="premium"
            type="number"
            value={form.premium}
            onChange={handleChange}
            error={errors.premium}
            placeholder="e.g. 8500"
            min="0"
          />
          <FormInput
            label="Coverage Details"
            name="coverage"
            value={form.coverage}
            onChange={handleChange}
            placeholder="e.g. Comprehensive cover"
          />
        </div>

        <FileUpload
          label="Insurance Document (Policy PDF or image)"
          onFileSelect={handleFileSelect}
          existingPath={docPath}
          onExistingOpen={async () => {
            try {
              const url = await storageService.getSignedUrl(docPath)
              if (url) window.open(url, '_blank')
            } catch (err) {
              toast.error('Could not open document')
            }
          }}
          onRemove={() => { setDocPath(''); setRemoveExistingDoc(true); setPendingFile(null) }}
        />

        <div className="module-form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Policy' : 'Add Policy'}
          </button>
        </div>
      </form>
    </Modal>
  )
}