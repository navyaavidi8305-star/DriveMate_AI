import './SelectInput.css'

export default function SelectInput({
  label,
  name,
  value,
  onChange,
  error,
  options = [],
  placeholder = 'Select...',
  required = false,
  disabled = false,
}) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`form-input select-input ${error ? 'error' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
