import { useState, useEffect, useCallback } from 'react'
import { Wrench, CalendarClock, AlertTriangle, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { maintenanceService, getDisplayStatus } from '../../services/maintenanceService'
import { vehicleService } from '../../services/vehicleService'
import { SERVICE_TYPES } from '../../utils/constants'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import StatCard from '../../components/common/StatCard/StatCard'
import DataTable from '../../components/common/DataTable/DataTable'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import FilterDropdown from '../../components/common/FilterDropdown/FilterDropdown'
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog'
import MaintenanceForm from './MaintenanceForm'
import './MaintenancePage.css'

export default function MaintenancePage() {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [stats, setStats] = useState({ upcoming: 0, overdue: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [recordsData, vehiclesData, statsData] = await Promise.all([
        maintenanceService.getAll(),
        vehicleService.getAll(),
        maintenanceService.getStats(),
      ])
      setRecords(recordsData)
      setVehicles(vehiclesData)
      setStats(statsData)
    } catch (err) {
      toast.error('Failed to load maintenance records')
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
      regNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.service_type.toLowerCase().includes(search.toLowerCase())
    const matchVehicle = !filterVehicle || r.vehicle_id === filterVehicle

    const displayStatus = getDisplayStatus(r)
    const matchStatus = !filterStatus || displayStatus === filterStatus

    return matchSearch && matchVehicle && matchStatus
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
      await maintenanceService.remove(deleteTarget.id)
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
      key: 'service_date',
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
    {
      key: 'service_type',
      label: 'Service Type',
      render: (val) => <span className="service-type-chip">{val}</span>,
    },
    { key: 'cost', label: 'Cost', render: (val) => `₹${Number(val).toLocaleString()}` },
    {
      key: 'next_service_date',
      label: 'Next Service',
      render: (val) => val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={getDisplayStatus(row)} />,
    },
  ]

  return (
    <div className="maintenance-page">
      <PageHeader
        title="Maintenance Records"
        description="Track services, repairs and scheduled maintenance for your vehicles"
        onAdd={handleAdd}
        addLabel="Add Record"
      />

      <div className="stat-cards">
        <StatCard title="Upcoming Services" value={stats.upcoming} icon={CalendarClock} color="primary" />
        <StatCard title="Overdue Services" value={stats.overdue} icon={AlertTriangle} color="danger" />
        <StatCard title="Total Services" value={stats.total} icon={ClipboardList} color="warning" />
      </div>

      <div className="maintenance-filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by vehicle, service type..."
        />
        <div className="maintenance-filter-group">
          <FilterDropdown
            value={filterVehicle}
            onChange={setFilterVehicle}
            options={vehicleOptions}
            allLabel="All Vehicles"
          />
          <FilterDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            options={['Completed', 'Upcoming', 'Overdue']}
            allLabel="All Status"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No maintenance records found"
        emptyDescription="Add your first service record"
        emptyIcon={Wrench}
        emptyActionLabel="Add Record"
        onEmptyAction={handleAdd}
        onEdit={handleEdit}
        onDelete={(r) => setDeleteTarget(r)}
      />

      {showForm && (
        <MaintenanceForm
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
        title="Delete Service Record"
        message="Are you sure you want to delete this maintenance record?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}