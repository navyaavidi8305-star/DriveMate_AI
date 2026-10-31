import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { formatCurrency } from '../../utils/statusHelpers'

const PALETTE = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#64748B', '#F97316']

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="expense-chart-tooltip">
      <strong>{label || ''}</strong>
      <div>{formatCurrency(Number(payload[0].value))}</div>
    </div>
  )
}

export default function ExpenseCharts({ categoryData = [], trendData = [], vehicleData = [] }) {
  return (
    <div className="expense-charts">
      <div className="expense-card">
        <h3 className="expense-card-title">Expense by Category</h3>
        {categoryData.length === 0 ? (
          <div className="expense-chart-empty">No data for the selected period</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="expense-card">
        <h3 className="expense-card-title">Monthly Trend</h3>
        {trendData.every((d) => d.amount === 0) ? (
          <div className="expense-chart-empty">No spending in the last 12 months</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
              <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="expense-card">
        <h3 className="expense-card-title">Vehicle-wise Expenses</h3>
        {vehicleData.length === 0 ? (
          <div className="expense-chart-empty">No expenses recorded yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vehicleData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
              <Bar dataKey="amount" fill="#16A34A" radius={[0, 4, 4, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}