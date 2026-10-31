import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Users, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import { vehicleService } from '../../services/vehicleService'
import { VEHICLE_TYPES, FUEL_TYPES, VEHICLE_STATUSES } from '../../utils/constants'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import StatCard from '../../components/common/StatCard/StatCard'
import DataTable from '../../components/common/DataTable/DataTable'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import FilterDropdown from '../../components/common/FilterDropdown/FilterDropdown'
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog'
import VehicleForm from './VehicleForm'
import './VehiclesPage.css'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, countData] = await Promise.all([
        vehicleService.getAll(),
        vehicleService.getCounts(),
      ])
      setVehicles(data)
      setCounts(countData)
    } catch (err) {
      toast.error('Failed to load vehicles')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredVehicles = vehicles.filter((v) => {
    const matchSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.reg_number.toLowerCase().includes(search.toLowerCase()) ||
      v.manufacturer?.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || v.type === filterType
    const matchStatus = !filterStatus || v.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  const handleAdd = () => {
    setEditVehicle(null)
    setShowForm(true)
  }

  const handleEdit = (vehicle) => {
    setEditVehicle(vehicle)
    setShowForm(true)
  }

  const handleView = (vehicle) => {
    navigate(`/vehicles/${vehicle.id}`)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await vehicleService.remove(deleteTarget.id)
      toast.success('Vehicle deleted successfully')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete vehicle')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditVehicle(null)
    loadData()
  }

  const columns = [
    {
      key: 'name',
      label: 'Vehicle Name',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{val}</div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            {row.manufacturer} {row.model}
          </div>
        </div>
      ),
    },
    { key: 'reg_number', label: 'Registration No.' },
    { key: 'type', label: 'Type' },
    { key: 'fuel_type', label: 'Fuel Type' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ]

  return (
    <div className="vehicles-page">
      <PageHeader
        title="Vehicle Management"
        description="Manage all your vehicles in one place"
        onAdd={handleAdd}
        addLabel="Add Vehicle"
      />

      <div className="stat-cards">
        <StatCard title="Total Vehicles" value={counts.total} icon={Car} color="primary" />
        <StatCard title="Active" value={counts.active} icon={Users} color="success" />
        <StatCard title="Inactive" value={counts.inactive} icon={UserX} color="danger" />
      </div>

      <div className="vehicles-filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search vehicles..."
        />
        <div className="vehicles-filter-group">
          <FilterDropdown
            value={filterType}
            onChange={setFilterType}
            options={VEHICLE_TYPES}
            allLabel="All Types"
          />
          <FilterDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            options={VEHICLE_STATUSES}
            allLabel="All Status"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredVehicles}
        loading={loading}
        emptyTitle="No vehicles found"
        emptyDescription="Add your first vehicle to get started"
        emptyIcon={Car}
        emptyActionLabel="Add Vehicle"
        onEmptyAction={handleAdd}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(v) => setDeleteTarget(v)}
        onRowClick={handleView}
      />

      {showForm && (
        <VehicleForm
          vehicle={editVehicle}
          onClose={() => { setShowForm(false); setEditVehicle(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all related records (mileage, maintenance, expenses, etc.).`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
