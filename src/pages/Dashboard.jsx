import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { startOfMonth, endOfMonth, isWithinInterval, format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const COLORS = {
  Needs: '#4ade80', // success green
  Wants: '#fbbf24', // warning yellow
  Savings: '#66fcf1' // accent primary
};

export function Dashboard() {
  const { transactions, income, categoryGroups, categories, user } = useFinanceStore();

  const currentMonth = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now)
    };
  }, []);

  const stats = useMemo(() => {
    const currentMonthTx = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), currentMonth)
    );
    
    const currentMonthInc = income.filter(i => 
      isWithinInterval(parseISO(i.date_received), currentMonth)
    );

    const totalIncome = currentMonthInc.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpenses = currentMonthTx.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpenses;

    // Group spending
    const spendingByGroup = categoryGroups.reduce((acc, group) => {
      acc[group.name] = 0;
      return acc;
    }, {});

    currentMonthTx.forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      if (cat) {
        const group = categoryGroups.find(g => g.id === cat.group_id);
        if (group) {
          spendingByGroup[group.name] += Number(t.amount);
        }
      }
    });

    const pieData = Object.entries(spendingByGroup)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);

    // Daily trend
    const dailyDataObj = {};
    currentMonthTx.forEach(t => {
      const day = format(parseISO(t.date), 'dd MMM');
      dailyDataObj[day] = (dailyDataObj[day] || 0) + Number(t.amount);
    });

    const dailyData = Object.entries(dailyDataObj)
      .map(([date, amount]) => ({ date, amount }))
      .reverse(); // assuming transactions are sorted descending by date

    return { totalIncome, totalExpenses, balance, pieData, spendingByGroup, dailyData };
  }, [transactions, income, currentMonth, categories, categoryGroups]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="page-container">
      <div className="glass-header" style={{ margin: '-20px -20px 20px -20px', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--accent-primary-dim)', padding: '10px', borderRadius: '50%' }}>
            <Wallet size={24} color="var(--accent-primary)" />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>Total Balance</p>
            <h2 style={{ margin: 0 }}>${stats.balance.toFixed(2)}</h2>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <LogOut size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ marginBottom: 0, padding: '16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Income</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <ArrowDownRight size={16} color="var(--success)" />
            <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>${stats.totalIncome.toFixed(2)}</span>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0, padding: '16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expenses</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <ArrowUpRight size={16} color="var(--danger)" />
            <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>${stats.totalExpenses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {stats.pieData.length > 0 && (
        <div className="card animate-slide-up">
          <h3>Spending Breakdown</h3>
          <div style={{ height: '200px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            {stats.pieData.map(entry => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[entry.name] }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.dailyData.length > 0 && (
        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3>Daily Trend</h3>
          <div style={{ height: '150px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  itemStyle={{ color: 'var(--accent-primary)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Spacer for bottom nav */}
      <div style={{ height: '40px' }}></div>
    </div>
  );
}
