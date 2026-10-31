import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { fitnessService } from '../../services/fitnessService'
import { storageService } from '../../services/storageService'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import DateInput from '../../components/common/DateInput/DateInput'
import FileUpload from '../../components/common/FileUpload/FileUpload'

const initialForm = {
  vehicle_id: '',
  fitness_number: '',
  rto: '',
  last_tested_date: '',
  issue_date: new Date().toISOString().split('T')[0],
  valid_till: '',
}

function validate(form) {
  const errors = {}
  if (!form.vehicle_id) errors.vehicle_id = 'Please select a vehicle'
  if (!form.fitness_number || form.fitness_number.trim().length < 3) errors.fitness_number = 'Fitness number is required'
  if (!form.issue_date) errors.issue_date = 'Issue date is required'
  if (!form.valid_till) errors.valid_till = 'Valid till date is required'
  if (form.valid_till && form.issue_date && form.valid_till < form.issue_date) {
    errors.valid_till = 'Valid till must be after issue date'
  }
  return errors
}

export default function FitnessForm({ certificate, vehicles, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [docPath, setDocPath] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [removeExistingDoc, setRemoveExistingDoc] = useState(false)
  const isEdit = !!certificate

  useEffect(() => {
    if (certificate) {
      setForm({
        vehicle_id: certificate.vehicle_id || '',
        fitness_number: certificate.fitness_number || '',
        rto: certificate.rto || '',
        last_tested_date: certificate.last_tested_date || '',
        issue_date: certificate.issue_date || '',
        valid_till: certificate.valid_till || '',
      })
      setDocPath(certificate.document_url || '')
    }
  }, [certificate])

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
          'fitness'
        )
        if (docPath && !removeExistingDoc) {
          try { await storageService.deleteDocument(docPath) } catch (err) { console.error(err) }
        }
        finalDocPath = uploadedPath
      }

      const payload = {
        vehicle_id: form.vehicle_id,
        fitness_number: form.fitness_number.trim().toUpperCase(),
        rto: form.rto.trim(),
        last_tested_date: form.last_tested_date || null,
        issue_date: form.issue_date,
        valid_till: form.valid_till,
        document_url: finalDocPath,
      }

      if (isEdit) {
        await fitnessService.update(certificate.id, payload)
        toast.success('Certificate updated successfully')
      } else {
        await fitnessService.create(payload)
        toast.success('Certificate added successfully')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.message || (isEdit ? 'Failed to update certificate' : 'Failed to add certificate'))
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
      title={isEdit ? 'Edit Fitness Certificate' : 'Add Fitness Certificate'}
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
            label="Fitness Number"
            name="fitness_number"
            value={form.fitness_number}
            onChange={handleChange}
            error={errors.fitness_number}
            placeholder="e.g. FTN123456"
            required
          />
          <FormInput
            label="RTO / Authority"
            name="rto"
            value={form.rto}
            onChange={handleChange}
            placeholder="e.g. Mumbai RTO"
          />
          <DateInput
            label="Last Tested Date"
            name="last_tested_date"
            value={form.last_tested_date}
            onChange={handleChange}
          />
          <DateInput
            label="Issue Date"
            name="issue_date"
            value={form.issue_date}
            onChange={handleChange}
            error={errors.issue_date}
            required
          />
          <DateInput
            label="Valid Till"
            name="valid_till"
            value={form.valid_till}
            onChange={handleChange}
            error={errors.valid_till}
            required
          />
        </div>

        <FileUpload
          label="Fitness Certificate Document (PDF or image)"
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
            {loading ? 'Saving...' : isEdit ? 'Update Certificate' : 'Add Certificate'}
          </button>
        </div>
      </form>
    </Modal>
  )
}