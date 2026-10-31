import { useState, useEffect, useCallback } from 'react'
import { IdCard, CheckCircle2, Clock, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { licenseService, computeExpiryStatus } from '../../services/licenseService'
import { storageService } from '../../services/storageService'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import StatCard from '../../components/common/StatCard/StatCard'
import DataTable from '../../components/common/DataTable/DataTable'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import FilterDropdown from '../../components/common/FilterDropdown/FilterDropdown'
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog'
import Modal from '../../components/common/Modal/Modal'
import LicenseForm from './LicenseForm'
import { formatDate, daysUntil } from '../../utils/statusHelpers'
import './LicensePage.css'

export default function LicensePage() {
  const [licenses, setLicenses] = useState([])
  const [stats, setStats] = useState({ total: 0, valid: 0, expiringSoon: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editLicense, setEditLicense] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [docUrl, setDocUrl] = useState(null)
  const [docLoading, setDocLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, statsData] = await Promise.all([
        licenseService.getAll(),
        licenseService.getStats(),
      ])
      setLicenses(data)
      setStats(statsData)
    } catch (err) {
      toast.error('Failed to load licenses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = licenses.filter((l) => {
    const matchSearch =
      !search ||
      l.driver_name.toLowerCase().includes(search.toLowerCase()) ||
      l.license_number.toLowerCase().includes(search.toLowerCase())
    const status = computeExpiryStatus(l.valid_till)
    const matchStatus = !filterStatus || status === filterStatus
    return matchSearch && matchStatus
  })

  const handleAdd = () => {
    setEditLicense(null)
    setShowForm(true)
  }

  const handleEdit = (license) => {
    setEditLicense(license)
    setShowForm(true)
  }

  const handleViewDocument = async (license) => {
    if (!license.document_url) {
      toast('No document uploaded', { icon: '📄' })
      return
    }
    setViewDoc(license)
    setDocUrl(null)
    setDocLoading(true)
    try {
      const url = await storageService.getSignedUrl(license.document_url)
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
      await licenseService.remove(deleteTarget.id)
      toast.success('License deleted successfully')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete license')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditLicense(null)
    loadData()
  }

  const columns = [
    {
      key: 'driver_name',
      label: 'Driver Name',
      render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'license_number',
      label: 'License Number',
      render: (val) => <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-sm)' }}>{val}</span>,
    },
    {
      key: 'license_class',
      label: 'Class',
      render: (val) => val ? <span className="license-class-chip">{val}</span> : '-',
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
    <div className="license-page">
      <PageHeader
        title="Driving License Management"
        description="Manage driving licenses and renewal reminders"
        onAdd={handleAdd}
        addLabel="Add License"
      />

      <div className="stat-cards stat-cards--4">
        <StatCard title="Total Licenses" value={stats.total} icon={IdCard} color="primary" />
        <StatCard title="Valid" value={stats.valid} icon={CheckCircle2} color="success" />
        <StatCard title="Expiring Soon" value={stats.expiringSoon} icon={Clock} color="warning" />
        <StatCard title="Expired" value={stats.expired} icon={Ban} color="danger" />
      </div>

      <div className="license-filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by driver name or license number..."
        />
        <FilterDropdown
          value={filterStatus}
          onChange={setFilterStatus}
          options={['Valid', 'Expiring Soon', 'Expired']}
          allLabel="All Status"
        />
      </div>

      <div className="license-note">
        <InfoIcon />
        Uploaded license images are user-provided documents. They are <strong>not</strong> government verified.
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No licenses found"
        emptyDescription="Add your driving license details"
        emptyIcon={IdCard}
        emptyActionLabel="Add License"
        onEmptyAction={handleAdd}
        onView={(l) => handleViewDocument(l)}
        onEdit={handleEdit}
        onDelete={(l) => setDeleteTarget(l)}
      />

      {showForm && (
        <LicenseForm
          license={editLicense}
          onClose={() => { setShowForm(false); setEditLicense(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {viewDoc && (
        <Modal
          isOpen={true}
          onClose={() => setViewDoc(null)}
          title="License Document"
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
                <img src={docUrl} alt="License document" style={{ marginTop: '16px', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }} />
              ) : (
                <iframe src={docUrl} title="License document" className="doc-viewer-frame" />
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
        title="Delete License"
        message="Are you sure you want to delete this driving license record?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}