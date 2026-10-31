import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { licenseService } from '../../services/licenseService'
import { storageService } from '../../services/storageService'
import { LICENSE_CLASSES } from '../../utils/constants'
import Modal from '../../components/common/Modal/Modal'
import FormInput from '../../components/common/FormInput/FormInput'
import SelectInput from '../../components/common/SelectInput/SelectInput'
import DateInput from '../../components/common/DateInput/DateInput'
import FileUpload from '../../components/common/FileUpload/FileUpload'

const initialForm = {
  driver_name: '',
  license_number: '',
  dob: '',
  license_class: '',
  issue_date: '',
  valid_till: '',
}

function validate(form) {
  const errors = {}
  if (!form.driver_name || form.driver_name.trim().length < 2) {
    errors.driver_name = 'Driver name is required'
  }
  if (!form.license_number || form.license_number.trim().length < 4) {
    errors.license_number = 'License number is required'
  }
  if (!form.valid_till) {
    errors.valid_till = 'Valid till date is required'
  }
  if (form.issue_date && form.valid_till && form.valid_till < form.issue_date) {
    errors.valid_till = 'Valid till must be after issue date'
  }
  return errors
}

export default function LicenseForm({ license, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [docPath, setDocPath] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [removeExistingDoc, setRemoveExistingDoc] = useState(false)
  const isEdit = !!license

  useEffect(() => {
    if (license) {
      setForm({
        driver_name: license.driver_name || '',
        license_number: license.license_number || '',
        dob: license.dob || '',
        license_class: license.license_class || '',
        issue_date: license.issue_date || '',
        valid_till: license.valid_till || '',
      })
      setDocPath(license.document_url || '')
    }
  }, [license])

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
          null,
          'license'
        )
        if (docPath && !removeExistingDoc) {
          try { await storageService.deleteDocument(docPath) } catch (err) { console.error(err) }
        }
        finalDocPath = uploadedPath
      }

      const payload = {
        driver_name: form.driver_name.trim(),
        license_number: form.license_number.trim().toUpperCase(),
        dob: form.dob || null,
        license_class: form.license_class,
        issue_date: form.issue_date || null,
        valid_till: form.valid_till,
        document_url: finalDocPath,
      }

      if (isEdit) {
        await licenseService.update(license.id, payload)
        toast.success('License updated successfully')
      } else {
        await licenseService.create(payload)
        toast.success('License added successfully')
      }
      onSuccess()
    } catch (err) {
      if (err.code === '23505') {
        toast.error('A license with this number already exists')
      } else {
        toast.error(err.message || (isEdit ? 'Failed to update license' : 'Failed to add license'))
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
      title={isEdit ? 'Edit License' : 'Add Driving License'}
      size="lg"
    >
      <form className="module-form" onSubmit={handleSubmit}>
        <div className="module-form-grid">
          <FormInput
            label="Driver Name"
            name="driver_name"
            value={form.driver_name}
            onChange={handleChange}
            error={errors.driver_name}
            placeholder="Full name as on license"
            required
          />
          <FormInput
            label="License Number"
            name="license_number"
            value={form.license_number}
            onChange={handleChange}
            error={errors.license_number}
            placeholder="e.g. MH01201319876"
            required
          />
          <DateInput
            label="Date of Birth"
            name="dob"
            value={form.dob}
            onChange={handleChange}
          />
          <SelectInput
            label="License Class"
            name="license_class"
            value={form.license_class}
            onChange={handleChange}
            options={LICENSE_CLASSES}
          />
          <DateInput
            label="Issue Date"
            name="issue_date"
            value={form.issue_date}
            onChange={handleChange}
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
          label="License Document (PDF or image)"
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
            {loading ? 'Saving...' : isEdit ? 'Update License' : 'Add License'}
          </button>
        </div>
      </form>
    </Modal>
  )
}