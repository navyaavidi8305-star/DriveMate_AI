import { useRef, useState } from 'react'
import { UploadCloud, FileText, X, ExternalLink, Loader2 } from 'lucide-react'
import './FileUpload.css'

export default function FileUpload({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  onFileSelect,
  existingPath,
  onExistingOpen,
  onRemove,
  error,
}) {
  const inputRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      onFileSelect({ error: 'File must be less than 5MB' })
      return
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result)
      reader.readAsDataURL(file)
    }

    setSelected(file)
    setUploading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    setUploading(false)

    if (onFileSelect) onFileSelect({ file, error: null })
    e.target.value = ''
  }

  const handleRemove = () => {
    setSelected(null)
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ''
    if (onRemove) onRemove()
  }

  const showExisting = !selected && existingPath
  const showPreview = !selected && previewUrl

  return (
    <div className="form-group">
      <label className="form-label">
        {label}
      </label>

      {showExisting && (
        <div className="file-upload-existing">
          <div className="file-upload-existing-left">
            <FileText size={20} className="file-upload-file-icon" />
            <span className="file-upload-existing-name">Document attached</span>
          </div>
          <div className="file-upload-existing-actions">
            {onExistingOpen && (
              <button type="button" className="btn btn-sm btn-secondary" onClick={onExistingOpen}>
                <ExternalLink size={14} /> View
              </button>
            )}
            <button
              type="button"
              className="btn-icon-naked"
              onClick={handleRemove}
              title="Remove document"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="file-upload-preview">
          <img src={previewUrl} alt="Document preview" className="file-upload-preview-img" />
          <div className="file-upload-preview-actions">
            <button type="button" className="btn btn-sm btn-danger" onClick={handleRemove}>
              Remove
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div className="file-upload-selected">
          <div className="file-upload-selected-left">
            <FileText size={20} className="file-upload-file-icon" />
            <div>
              <div className="file-upload-selected-name">{selected.name}</div>
              <div className="file-upload-selected-size">
                {(selected.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
          <div className="file-upload-selected-actions">
            {uploading && <Loader2 size={16} className="spin" />}
            {!uploading && (
              <button type="button" className="btn-icon-naked" onClick={handleRemove}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {!selected && !showExisting && !showPreview && (
        <button
          type="button"
          className="file-upload-dropzone"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud size={24} className="file-upload-dropzone-icon" />
          <div className="file-upload-dropzone-title">Click to upload</div>
          <div className="file-upload-dropzone-hint">
            PDF, JPG or PNG (max 5MB)
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="file-upload-input"
        hidden
      />

      {error && <span className="form-error">{error}</span>}
    </div>
  )
}