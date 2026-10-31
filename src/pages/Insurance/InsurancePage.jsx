import { useState, useEffect, useCallback } from 'react'
import { Shield, CheckCircle2, Clock, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { insuranceService, computeExpiryStatus } from '../../services/insuranceService'
import { vehicleService } from '../../services/vehicleService'
import { storageService } from '../../services/storageService'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import StatCard from '../../components/common/StatCard/StatCard'
import DataTable from '../../components/common/DataTable/DataTable'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import FilterDropdown from '../../components/common/FilterDropdown/FilterDropdown'
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog'
import Modal from '../../components/common/Modal/Modal'
import InsuranceForm from './InsuranceForm'
import { formatDate, daysUntil } from '../../utils/statusHelpers'
import './InsurancePage.css'

export default function InsurancePage() {
  const [policies, setPolicies] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, expiringSoon: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editPolicy, setEditPolicy] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [docUrl, setDocUrl] = useState(null)
  const [docLoading, setDocLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, vehiclesData, statsData] = await Promise.all([
        insuranceService.getAll(),
        vehicleService.getAll(),
        insuranceService.getStats(),
      ])
      setPolicies(data)
      setVehicles(vehiclesData)
      setStats(statsData)
    } catch (err) {
      toast.error('Failed to load insurance data')
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

  const filtered = policies.filter((p) => {
    const vehicle = p.vehicles || vehicleMap[p.vehicle_id]
    const vehicleName = vehicle?.name || ''
    const regNumber = vehicle?.reg_number || ''
    const matchSearch =
      !search ||
      vehicleName.toLowerCase().includes(search.toLowerCase()) ||
      regNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.policy_number.toLowerCase().includes(search.toLowerCase())
    const matchVehicle = !filterVehicle || p.vehicle_id === filterVehicle

    const status = computeExpiryStatus(p.expiry_date)
    const matchStatus = !filterStatus || status === filterStatus

    return matchSearch && matchVehicle && matchStatus
  })

  const handleAdd = () => {
    setEditPolicy(null)
    setShowForm(true)
  }

  const handleEdit = (policy) => {
    setEditPolicy(policy)
    setShowForm(true)
  }

  const handleViewDocument = async (policy) => {
    if (!policy.document_url) {
      toast('No document uploaded', { icon: '📄' })
      return
    }
    setViewDoc(policy)
    setDocUrl(null)
    setDocLoading(true)
    try {
      const url = await storageService.getSignedUrl(policy.document_url)
      setDocUrl(url)
    } catch (err) {
      toast.error('Failed to load document')
    } finally {
      setDocLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.document_url) {
        try { await storageService.deleteDocument(deleteTarget.document_url) } catch (e) { console.error(e) }
      }
      await insuranceService.remove(deleteTarget.id)
      toast.success('Policy deleted successfully')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete policy')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditPolicy(null)
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
    { key: 'company', label: 'Insurance Company' },
    {
      key: 'policy_number',
      label: 'Policy No.',
      render: (val) => <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-sm)' }}>{val}</span>,
    },
    {
      key: 'expiry_date',
      label: 'Valid Till',
      render: (val) => {
        const days = daysUntil(val)
        const color = days < 0 ? 'var(--color-danger)' : days <= 30 ? 'var(--color-warning)' : 'var(--text-primary)'
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{formatDate(val)}</div>
            <div style={{ fontSize: 'var(--font-xs)', color }}>
              {days < 0 ? `Expired ${Math.abs(days)} days ago` : days === 0 ? 'Expires today' : `${days} days left`}
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={computeExpiryStatus(row.expiry_date)} />,
    },
  ]

  return (
    <div className="insurance-page">
      <PageHeader
        title="Insurance Management"
        description="Track insurance policies, renewals and documents"
        onAdd={handleAdd}
        addLabel="Add Policy"
      />

      <div className="stat-cards stat-cards--4">
        <StatCard title="Total Policies" value={stats.total} icon={Shield} color="primary" />
        <StatCard title="Active" value={stats.active} icon={CheckCircle2} color="success" />
        <StatCard title="Expiring Soon" value={stats.expiringSoon} icon={Clock} color="warning" />
        <StatCard title="Expired" value={stats.expired} icon={Ban} color="danger" />
      </div>

      <div className="insurance-filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by vehicle, company, policy no..."
        />
        <div className="insurance-filter-group">
          <FilterDropdown
            value={filterVehicle}
            onChange={setFilterVehicle}
            options={vehicleOptions}
            allLabel="All Vehicles"
          />
          <FilterDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            options={['Valid', 'Expiring Soon', 'Expired']}
            allLabel="All Status"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No insurance policies found"
        emptyDescription="Add your first insurance policy"
        emptyIcon={Shield}
        emptyActionLabel="Add Policy"
        onEmptyAction={handleAdd}
        onView={(p) => handleViewDocument(p)}
        onEdit={handleEdit}
        onDelete={(p) => setDeleteTarget(p)}
        extraActions={
          [
            {
              key: 'doc',
              label: 'View Document',
              icon: Shield,
              onClick: (p) => handleViewDocument(p),
            },
          ]
        }
      />

      {showForm && (
        <InsuranceForm
          policy={editPolicy}
          vehicles={vehicles}
          onClose={() => { setShowForm(false); setEditPolicy(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {viewDoc && (
        <Modal
          isOpen={true}
          onClose={() => setViewDoc(null)}
          title="Insurance Document"
          size="lg"
        >
          {docLoading ? (
            <div className="doc-viewer-loading">Loading document...</div>
          ) : docUrl ? (
            <div className="doc-viewer">
              <a href={docUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                Open in new tab
              </a>
              {/\.(png|jpe?g|gif|webp)$/i.test(docUrl) ? (
                <img src={docUrl} alt="Insurance document" style={{ marginTop: '16px', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }} />
              ) : (
                <iframe src={docUrl} title="Insurance document" className="doc-viewer-frame" />
              )}
            </div>
          ) : (
            <div className="doc-viewer-empty">Document not available</div>
          )}
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Policy"
        message="Are you sure you want to delete this insurance policy?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}