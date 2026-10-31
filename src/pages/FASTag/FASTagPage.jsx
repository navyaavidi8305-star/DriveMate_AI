import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Wallet, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { fastagService } from '../../services/fastagService'
import { vehicleService } from '../../services/vehicleService'
import { LOW_BALANCE_THRESHOLD } from '../../utils/constants'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import StatCard from '../../components/common/StatCard/StatCard'
import DataTable from '../../components/common/DataTable/DataTable'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import FilterDropdown from '../../components/common/FilterDropdown/FilterDropdown'
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog'
import FASTagForm from './FASTagForm'
import BalanceUpdateForm from './BalanceUpdateForm'
import './FASTagPage.css'

export default function FASTagPage() {
  const [fastags, setFastags] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, lowBalance: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editFastag, setEditFastag] = useState(null)
  const [balanceTarget, setBalanceTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, vehiclesData, statsData] = await Promise.all([
        fastagService.getAll(),
        vehicleService.getAll(),
        fastagService.getStats(),
      ])
      setFastags(data)
      setVehicles(vehiclesData)
      setStats(statsData)
    } catch (err) {
      toast.error('Failed to load FASTag data')
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

  const filtered = fastags.filter((f) => {
    const vehicle = f.vehicles || vehicleMap[f.vehicle_id]
    const vehicleName = vehicle?.name || ''
    const regNumber = vehicle?.reg_number || ''
    const matchSearch =
      !search ||
      vehicleName.toLowerCase().includes(search.toLowerCase()) ||
      regNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.fastag_id.toLowerCase().includes(search.toLowerCase()) ||
      f.bank.toLowerCase().includes(search.toLowerCase())
    const matchVehicle = !filterVehicle || f.vehicle_id === filterVehicle
    const matchStatus = !filterStatus || f.status === filterStatus
    return matchSearch && matchVehicle && matchStatus
  })

  const handleAdd = () => {
    setEditFastag(null)
    setShowForm(true)
  }

  const handleEdit = (fastag) => {
    setEditFastag(fastag)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fastagService.remove(deleteTarget.id)
      toast.success('FASTag deleted successfully')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete FASTag')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditFastag(null)
    loadData()
  }

  const handleBalanceUpdated = () => {
    setBalanceTarget(null)
    toast.success('Balance updated successfully')
    loadData()
  }

  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: `${v.name} (${v.reg_number})` }))

  const columns = [
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
      key: 'fastag_id',
      label: 'FASTag ID',
      render: (val) => <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-sm)' }}>{val}</span>,
    },
    { key: 'bank', label: 'Issuing Bank' },
    {
      key: 'balance',
      label: 'Balance',
      render: (val, row) => (
        <span className={`fastag-balance ${row.status === 'Low Balance' ? 'fastag-balance--low' : ''}`}>
          ₹{Number(val).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      render: (val) => val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ]

  return (
    <div className="fastag-page">
      <PageHeader
        title="FASTag Management"
        description="Manage toll tags, balances and bank details"
        onAdd={handleAdd}
        addLabel="Add FASTag"
      />

      <div className="stat-cards">
        <StatCard title="Total FASTags" value={stats.total} icon={CreditCard} color="primary" />
        <StatCard title="Active" value={stats.active} icon={Wallet} color="success" />
        <StatCard title="Low Balance" value={stats.lowBalance} icon={AlertTriangle} color="warning" />
      </div>

      <div className="fastag-threshold-note">
        <span className="fastag-threshold-dot" />
        Low balance threshold: ₹{LOW_BALANCE_THRESHOLD} (configurable in <code>src/utils/constants.js</code>)
      </div>

      <div className="fastag-filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by vehicle, FASTag ID, bank..."
        />
        <div className="fastag-filter-group">
          <FilterDropdown
            value={filterVehicle}
            onChange={setFilterVehicle}
            options={vehicleOptions}
            allLabel="All Vehicles"
          />
          <FilterDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            options={['Active', 'Low Balance', 'Inactive']}
            allLabel="All Status"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No FASTags found"
        emptyDescription="Add your first FASTag"
        emptyIcon={CreditCard}
        emptyActionLabel="Add FASTag"
        onEmptyAction={handleAdd}
        onEdit={handleEdit}
        onDelete={(f) => setDeleteTarget(f)}
        extraActions={[
          { key: 'balance', label: 'Update Balance', icon: Wallet, onClick: (f) => setBalanceTarget(f) },
        ]}
      />

      {showForm && (
        <FASTagForm
          fastag={editFastag}
          vehicles={vehicles}
          onClose={() => { setShowForm(false); setEditFastag(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {balanceTarget && (
        <BalanceUpdateForm
          fastag={balanceTarget}
          vehicleName={vehicleMap[balanceTarget.vehicle_id]?.name || ''}
          onClose={() => setBalanceTarget(null)}
          onSuccess={handleBalanceUpdated}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete FASTag"
        message="Are you sure you want to delete this FASTag record?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}