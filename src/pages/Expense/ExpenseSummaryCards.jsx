import { Wallet, CalendarDays, CalendarRange, PiggyBank, Gauge, CalendarCheck, Route, Award } from 'lucide-react'
import StatCard from '../../components/common/StatCard/StatCard'

export default function ExpenseSummaryCards({ stats }) {
  return (
    <div className="expense-summary">
      <div className="stat-cards stat-cards--4">
        <StatCard title="Today's Expense" value={stats.today} icon={Wallet} color="danger" />
        <StatCard title="This Month" value={stats.thisMonth} icon={CalendarDays} color="primary" />
        <StatCard title="This Year" value={stats.thisYear} icon={CalendarRange} color="warning" />
        <StatCard title="Total Expenses" value={stats.total} icon={PiggyBank} color="success" />
      </div>
      <div className="stat-cards stat-cards--4">
        <StatCard title="Average Daily" value={stats.avgDaily} icon={CalendarCheck} color="primary" subtitle="Total ÷ days with spend" />
        <StatCard title="Average Monthly" value={stats.avgMonthly} icon={Gauge} color="success" subtitle="Total ÷ months with spend" />
        <StatCard title="Cost per KM" value={stats.costPerKm} icon={Route} color="warning" subtitle="All categories ÷ km driven" />
        <StatCard title="Top Category" value={stats.topCategory} icon={Award} color="danger" subtitle="Highest spending category" />
      </div>
    </div>
  )
}