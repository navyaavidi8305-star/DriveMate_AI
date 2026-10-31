import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Calendar, Fuel, Gauge, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import { vehicleService } from '../../services/vehicleService'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner'
import VehicleForm from './VehicleForm'
import './VehicleDetail.css'

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadVehicle = async () => {
    try {
      setLoading(true)
      const data = await vehicleService.getById(id)
      setVehicle(data)
    } catch (err) {
      toast.error('Failed to load vehicle details')
      navigate('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicle()
  }, [id])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await vehicleService.remove(deleteTarget.id)
      toast.success('Vehicle deleted successfully')
      navigate('/vehicles')
    } catch (err) {
      toast.error('Failed to delete vehicle')
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    loadVehicle()
  }

  if (loading) return <LoadingSpinner message="Loading vehicle details..." />
  if (!vehicle) return null

  const infoItems = [
    { label: 'Manufacturer', value: vehicle.manufacturer || '-', icon: Hash },
    { label: 'Model', value: vehicle.model || '-' },
    { label: 'Registration Date', value: vehicle.reg_date || '-', icon: Calendar },
    { label: 'Engine Number', value: vehicle.engine_number || '-' },
    { label: 'Chassis Number', value: vehicle.chassis_number || '-' },
    { label: 'Current Odometer', value: `${vehicle.odometer} km`, icon: Gauge },
    { label: 'Fuel Type', value: vehicle.fuel_type, icon: Fuel },
    { label: 'Created', value: new Date(vehicle.created_at).toLocaleDateString() },
  ]

  return (
    <div className="vehicle-detail">
      <div className="vehicle-detail-header">
        <button className="btn btn-ghost" onClick={() => navigate('/vehicles')}>
          <ArrowLeft size={18} /> Back to Vehicles
        </button>
        <div className="vehicle-detail-actions">
          <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
            <Edit2 size={16} /> Edit
          </button>
          <button className="btn btn-danger" onClick={() => setDeleteTarget(vehicle)}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="vehicle-detail-card">
        <div className="vehicle-detail-title-row">
          <div className="vehicle-detail-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17h14M5 17a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v7a2 2 0 01-2 2M5 17l-1 3h1m14-3l1 3h-1" />
              <circle cx="7.5" cy="17" r="1.5" />
              <circle cx="16.5" cy="17" r="1.5" />
            </svg>
          </div>
          <div>
            <h2 className="vehicle-detail-name">{vehicle.name}</h2>
            <p className="vehicle-detail-reg">{vehicle.reg_number}</p>
          </div>
          <div className="vehicle-detail-badge">
            <StatusBadge status={vehicle.status} />
          </div>
        </div>

        <div className="vehicle-detail-meta">
          <span className="vehicle-detail-meta-item">{vehicle.type}</span>
          <span className="vehicle-detail-meta-divider">-</span>
          <span className="vehicle-detail-meta-item">{vehicle.fuel_type}</span>
        </div>
      </div>

      <div className="vehicle-detail-info">
        <h3>Vehicle Information</h3>
        <div className="vehicle-detail-info-grid">
          {infoItems.map((item) => (
            <div key={item.label} className="vehicle-detail-info-item">
              <span className="vehicle-detail-info-label">{item.label}</span>
              <span className="vehicle-detail-info-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <VehicleForm
          vehicle={vehicle}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all related records.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
