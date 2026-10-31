import { useState, useEffect, useCallback } from 'react'
import { Gauge, Fuel, Route, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { mileageService } from '../../services/mileageService'
import { vehicleService } from '../../services/vehicleService'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import StatCard from '../../components/common/StatCard/StatCard'
import DataTable from '../../components/common/DataTable/DataTable'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import FilterDropdown from '../../components/common/FilterDropdown/FilterDropdown'
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog'
import MileageForm from './MileageForm'
import './MileagePage.css'

export default function MileagePage() {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [stats, setStats] = useState({ totalRecords: 0, avgMileage: 0, distanceThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [recordsData, vehiclesData, statsData] = await Promise.all([
        mileageService.getAll(),
        vehicleService.getAll(),
        mileageService.getStats(),
      ])
      setRecords(recordsData)
      setVehicles(vehiclesData)
      setStats(statsData)
    } catch (err) {
      toast.error('Failed to load mileage data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const vehicleMap = vehicles.reduce((map, v) => {
    map[v.id] = v
    return map
  }, {})

  const filtered = records.filter((r) => {
    const vehicle = r.vehicles || vehicleMap[r.vehicle_id]
    const vehicleName = vehicle?.name || ''
    const regNumber = vehicle?.reg_number || ''
    const matchSearch =
      !search ||
      vehicleName.toLowerCase().includes(search.toLowerCase()) ||
      regNumber.toLowerCase().includes(search.toLowerCase())
    const matchVehicle = !filterVehicle || r.vehicle_id === filterVehicle
    return matchSearch && matchVehicle
  })

  const handleAdd = () => {
    setEditRecord(null)
    setShowForm(true)
  }

  const handleEdit = (record) => {
    setEditRecord(record)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await mileageService.remove(deleteTarget.id)
      toast.success('Record deleted successfully')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete record')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditRecord(null)
    loadData()
  }

  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: `${v.name} (${v.reg_number})` }))

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'vehicles',
      label: 'Vehicle',
      render: (_, row) => {
        const v = row.vehicles || vehicleMap[row.vehicle_id]
        return v ? (
          <div>
            <div style={{ fontWeight: 500 }}>{v.name}</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{v.reg_number}</div>
          </div>
        ) : '-'
      },
    },
    { key: 'start_odo', label: 'Start (km)', render: (val) => Number(val).toLocaleString() },
    { key: 'end_odo', label: 'End (km)', render: (val) => Number(val).toLocaleString() },
    { key: 'distance', label: 'Distance', render: (val) => `${Number(val).toLocaleString()} km` },
    { key: 'fuel_qty', label: 'Fuel (L)', render: (val) => `${Number(val).toFixed(1)}` },
    { key: 'fuel_cost', label: 'Cost', render: (val) => `₹${Number(val).toLocaleString()}` },
    {
      key: 'mileage',
      label: 'Mileage',
      render: (val) => (
        <span className="mileage-value">{Number(val).toFixed(1)} km/L</span>
      ),
    },
  ]

  return (
    <div className="mileage-page">
      <PageHeader
        title="Mileage Tracking"
        description="Track fuel efficiency and distance for your vehicles"
        onAdd={handleAdd}
        addLabel="Add Record"
      />

      <div className="stat-cards">
        <StatCard title="Average Mileage" value={`${stats.avgMileage}`} icon={TrendingUp} color="primary" subtitle="km/L" />
        <StatCard title="Distance This Month" value={`${stats.distanceThisMonth.toLocaleString()}`} icon={Route} color="success" subtitle="km" />
        <StatCard title="Total Records" value={stats.totalRecords} icon={Gauge} color="warning" />
      </div>

      <div className="mileage-filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by vehicle name or registration..."
        />
        <FilterDropdown
          value={filterVehicle}
          onChange={setFilterVehicle}
          options={vehicleOptions}
          allLabel="All Vehicles"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No mileage records found"
        emptyDescription="Add your first mileage record to start tracking fuel efficiency"
        emptyIcon={Fuel}
        emptyActionLabel="Add Record"
        onEmptyAction={handleAdd}
        onEdit={handleEdit}
        onDelete={(r) => setDeleteTarget(r)}
      />

      {showForm && (
        <MileageForm
          record={editRecord}
          vehicles={vehicles}
          onClose={() => { setShowForm(false); setEditRecord(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Mileage Record"
        message="Are you sure you want to delete this mileage record? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
