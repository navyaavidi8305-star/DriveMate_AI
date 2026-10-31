import './LoadingSpinner.css'

export default function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner loading-spinner--${size}`} />
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  )
}
