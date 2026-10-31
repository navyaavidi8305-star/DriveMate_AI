import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { pucService } from '../../services/pucService'
import { storageService } from '../../services/storageService'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import DateInput from '../../components/common/DateInput/DateInput'
import FileUpload from '../../components/common/FileUpload/FileUpload'

const initialForm = {
  vehicle_id: '',
  puc_number: '',
  issue_date: new Date().toISOString().split('T')[0],
  valid_till: '',
}

function validate(form) {
  const errors = {}
  if (!form.vehicle_id) errors.vehicle_id = 'Please select a vehicle'
  if (!form.puc_number || form.puc_number.trim().length < 3) errors.puc_number = 'PUC number is required'
  if (!form.issue_date) errors.issue_date = 'Issue date is required'
  if (!form.valid_till) errors.valid_till = 'Valid till date is required'
  if (form.valid_till && form.issue_date && form.valid_till < form.issue_date) {
    errors.valid_till = 'Valid till must be after issue date'
  }
  return errors
}

export default function PUCForm({ certificate, vehicles, onClose, onSuccess }) {
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
        puc_number: certificate.puc_number || '',
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
          'puc'
        )
        if (docPath && !removeExistingDoc) {
          try { await storageService.deleteDocument(docPath) } catch (err) { console.error(err) }
        }
        finalDocPath = uploadedPath
      }

      const payload = {
        vehicle_id: form.vehicle_id,
        puc_number: form.puc_number.trim().toUpperCase(),
        issue_date: form.issue_date,
        valid_till: form.valid_till,
        document_url: finalDocPath,
      }

      if (isEdit) {
        await pucService.update(certificate.id, payload)
        toast.success('Certificate updated successfully')
      } else {
        await pucService.create(payload)
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
      title={isEdit ? 'Edit PUC Certificate' : 'Add PUC Certificate'}
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
            label="PUC Number"
            name="puc_number"
            value={form.puc_number}
            onChange={handleChange}
            error={errors.puc_number}
            placeholder="e.g. PUC123456"
            required
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
          label="PUC Document (PDF or image)"
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