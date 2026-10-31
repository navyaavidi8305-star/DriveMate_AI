import './DateInput.css'

export default function DateInput({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  max,
  min,
}) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        max={max}
        min={min}
        className={`form-input ${error ? 'error' : ''}`}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
