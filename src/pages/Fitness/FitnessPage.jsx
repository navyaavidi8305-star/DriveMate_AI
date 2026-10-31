import { useState, useEffect, useCallback } from 'react'
import { BadgeCheck, CheckCircle2, Clock, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { fitnessService, computeExpiryStatus } from '../../services/fitnessService'
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
import FitnessForm from './FitnessForm'
import { formatDate, daysUntil } from '../../utils/statusHelpers'
import './FitnessPage.css'

export default function FitnessPage() {
  const [certificates, setCertificates] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [stats, setStats] = useState({ total: 0, valid: 0, expiringSoon: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editCert, setEditCert] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [docUrl, setDocUrl] = useState(null)
  const [docLoading, setDocLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, vehiclesData, statsData] = await Promise.all([
        fitnessService.getAll(),
        vehicleService.getAll(),
        fitnessService.getStats(),
      ])
      setCertificates(data)
      setVehicles(vehiclesData)
      setStats(statsData)
    } catch (err) {
      toast.error('Failed to load fitness certificates')
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

  const filtered = certificates.filter((c) => {
    const vehicle = c.vehicles || vehicleMap[c.vehicle_id]
    const vehicleName = vehicle?.name || ''
    const regNumber = vehicle?.reg_number || ''
    const matchSearch =
      !search ||
      vehicleName.toLowerCase().includes(search.toLowerCase()) ||
      regNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.fitness_number.toLowerCase().includes(search.toLowerCase())
    const matchVehicle = !filterVehicle || c.vehicle_id === filterVehicle
    const status = computeExpiryStatus(c.valid_till)
    const matchStatus = !filterStatus || status === filterStatus
    return matchSearch && matchVehicle && matchStatus
  })

  const handleAdd = () => {
    setEditCert(null)
    setShowForm(true)
  }

  const handleEdit = (cert) => {
    setEditCert(cert)
    setShowForm(true)
  }

  const handleViewDocument = async (cert) => {
    if (!cert.document_url) {
      toast('No document uploaded', { icon: '📄' })
      return
    }
    setViewDoc(cert)
    setDocUrl(null)
    setDocLoading(true)
    try {
      const url = await storageService.getSignedUrl(cert.document_url)
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
      await fitnessService.remove(deleteTarget.id)
      toast.success('Certificate deleted successfully')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete certificate')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditCert(null)
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
      key: 'fitness_number',
      label: 'Fitness Number',
      render: (val) => <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-sm)' }}>{val}</span>,
    },
    {
      key: 'issue_date',
      label: 'Issue Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'valid_till',
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
      render: (_, row) => <StatusBadge status={computeExpiryStatus(row.valid_till)} />,
    },
  ]

  return (
    <div className="fitness-page">
      <PageHeader
        title="Fitness Certificate Management"
        description="Track vehicle fitness certificates and renewal reminders"
        onAdd={handleAdd}
        addLabel="Add Certificate"
      />

      <div className="stat-cards stat-cards--4">
        <StatCard title="Total Certificates" value={stats.total} icon={BadgeCheck} color="primary" />
        <StatCard title="Valid" value={stats.valid} icon={CheckCircle2} color="success" />
        <StatCard title="Expiring Soon" value={stats.expiringSoon} icon={Clock} color="warning" />
        <StatCard title="Expired" value={stats.expired} icon={Ban} color="danger" />
      </div>

      <div className="fitness-filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by vehicle or fitness number..."
        />
        <div className="fitness-filter-group">
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
        emptyTitle="No fitness certificates found"
        emptyDescription="Add your first fitness certificate"
        emptyIcon={BadgeCheck}
        emptyActionLabel="Add Certificate"
        onEmptyAction={handleAdd}
        onView={(c) => handleViewDocument(c)}
        onEdit={handleEdit}
        onDelete={(c) => setDeleteTarget(c)}
      />

      {showForm && (
        <FitnessForm
          certificate={editCert}
          vehicles={vehicles}
          onClose={() => { setShowForm(false); setEditCert(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {viewDoc && (
        <Modal
          isOpen={true}
          onClose={() => setViewDoc(null)}
          title="Fitness Certificate Document"
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
                <img src={docUrl} alt="Fitness document" style={{ marginTop: '16px', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }} />
              ) : (
                <iframe src={docUrl} title="Fitness document" className="doc-viewer-frame" />
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
        title="Delete Fitness Certificate"
        message="Are you sure you want to delete this fitness certificate?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}