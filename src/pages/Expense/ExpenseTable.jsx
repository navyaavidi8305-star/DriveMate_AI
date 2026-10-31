import { Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import DataTable from '../../components/common/DataTable/DataTable'
import Pagination from '../../components/common/Pagination/Pagination'
import { formatDate, formatCurrency } from '../../utils/statusHelpers'
import { sourceLabel, sourceRoute } from '../../services/expenseService'

function categoryClass(category) {
  return `expense-category expense-category--${(category || '').toLowerCase().replace(/[^a-z]/g, '')}`
}

export default function ExpenseTable({
  expenses,
  loading,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      key: 'expense_date',
      label: 'Date',
      render: (val) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(val)}</span>,
    },
    {
      key: 'vehicles',
      label: 'Vehicle',
      render: (_, row) => {
        const v = row.vehicles
        return v ? (
          <div>
            <div style={{ fontWeight: 500 }}>{v.name}</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{v.reg_number}</div>
          </div>
        ) : '-'
      },
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => <span className={categoryClass(val)}>{val}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (val, row) => {
        if (val) return <span className="text-truncate" style={{ maxWidth: 220, display: 'block' }}>{val}</span>
        if (row.note) return <span className="text-truncate" style={{ maxWidth: 220, display: 'block', color: 'var(--text-muted)' }}>{row.note}</span>
        return '-'
      },
    },
    { key: 'payment_method', label: 'Payment', render: (val) => val || '-' },
    {
      key: 'source_type',
      label: 'Source',
      render: (val) => {
        const label = sourceLabel(val)
        return <span className={`expense-source-badge ${val ? 'auto' : 'manual'}`}>{label}</span>
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (val) => <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{formatCurrency(val)}</span>,
    },
  ]

  const guardAuto = (action, row, message) => {
    if (row.source_type) {
      toast(message || `This expense is managed by the ${sourceLabel(row.source_type)} module. Edit or delete the original record instead.`)
      return
    }
    action(row)
  }

  return (
    <div className="expense-table-wrap">
      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        onRowClick={onView}
        onView={onView}
        onEdit={(row) => guardAuto(onEdit, row)}
        onDelete={(row) => guardAuto(onDelete, row, 'Auto expenses are deleted when their source record is deleted.')}
        emptyTitle="No expenses found"
        emptyDescription="Adjust your filters, or add a manual expense"
        emptyIcon={Wallet}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
      <div className="expense-table-hint">
        Auto expenses (Fuel / Service / Maintenance / Insurance / FASTag/Toll) can only be edited in their source module.
      </div>
    </div>
  )
}