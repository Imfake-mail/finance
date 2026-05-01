import { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format } from 'date-fns';
import { Filter } from 'lucide-react';

const COLORS = ['#66fcf1', '#4ade80', '#fbbf24', '#f87171', '#c084fc', '#818cf8', '#2dd4bf'];

export function Analytics() {
  const { transactions, categories, categoryGroups } = useFinanceStore();
  
  const [dateRange, setDateRange] = useState('month'); // month, year, all
  const [selectedGroupId, setSelectedGroupId] = useState('all');

  const filteredData = useMemo(() => {
    let txs = [...transactions];

    // Date filtering
    if (dateRange === 'month') {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      txs = txs.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
    } else if (dateRange === 'year') {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      txs = txs.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
    }

    // Group filtering
    if (selectedGroupId !== 'all') {
      const groupCats = categories.filter(c => c.group_id === selectedGroupId).map(c => c.id);
      txs = txs.filter(t => groupCats.includes(t.category_id));
    }

    // Aggregation by Category
    const categoryTotals = {};
    txs.forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      if (cat) {
        categoryTotals[cat.name] = (categoryTotals[cat.name] || 0) + Number(t.amount);
      }
    });

    const chartData = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount); // sort desc

    const totalSpent = txs.reduce((sum, t) => sum + Number(t.amount), 0);

    return { chartData, totalSpent };
  }, [transactions, categories, dateRange, selectedGroupId]);

  return (
    <div className="page-container">
      <h2>Analytics & Insights</h2>
      
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '10px', alignItems: 'center', overflowX: 'auto' }}>
        <Filter size={20} color="var(--text-muted)" />
        <select 
          value={dateRange} 
          onChange={e => setDateRange(e.target.value)}
          style={{ width: 'auto', padding: '8px', fontSize: '0.875rem' }}
        >
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>

        <select 
          value={selectedGroupId} 
          onChange={e => setSelectedGroupId(e.target.value)}
          style={{ width: 'auto', padding: '8px', fontSize: '0.875rem' }}
        >
          <option value="all">All Groups</option>
          {categoryGroups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="card animate-slide-up">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Spent (Filtered)</p>
        <h2 style={{ fontSize: '2rem', margin: '8px 0', color: 'var(--accent-primary)' }}>
          ${filteredData.totalSpent.toFixed(2)}
        </h2>
      </div>

      {filteredData.chartData.length > 0 ? (
        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3>Spending by Category</h3>
          <div style={{ height: '300px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData.chartData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-card)' }}
                  contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {filteredData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>No data found for the selected filters.</p>
        </div>
      )}

      <div style={{ height: '40px' }}></div>
    </div>
  );
}
