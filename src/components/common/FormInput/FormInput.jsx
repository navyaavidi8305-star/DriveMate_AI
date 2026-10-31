import './FormInput.css'

export default function FormInput({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  step,
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
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`form-input ${error ? 'error' : ''}`}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
