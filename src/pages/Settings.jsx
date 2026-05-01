import { useFinanceStore } from '../store/useFinanceStore';
import { Download, Wallet, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function Settings() {
  const { transactions, categories, categoryGroups } = useFinanceStore();

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("No data to export");
      return;
    }

    // CSV Headers
    const headers = ['Date', 'Amount', 'Category', 'Group', 'Note', 'Type'];
    
    // CSV Rows
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const group = cat ? categoryGroups.find(g => g.id === cat.group_id) : null;
      
      const dateStr = format(parseISO(t.date), 'yyyy-MM-dd');
      const amountStr = t.amount;
      const catStr = cat ? `"${cat.name}"` : 'Unknown';
      const groupStr = group ? `"${group.name}"` : 'Unknown';
      const noteStr = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';
      
      return [dateStr, amountStr, catStr, groupStr, noteStr, 'Expense'].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finance_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <h2>Settings</h2>
      
      <div className="card animate-slide-up">
        <h3>Data Management</h3>
        <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>
          Export your complete transaction history as a CSV file.
        </p>
        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={20} />
          Export to CSV
        </button>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3>Categories</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {categoryGroups.map(group => {
            const groupCats = categories.filter(c => c.group_id === group.id);
            return (
              <div key={group.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Tag size={16} color="var(--accent-secondary)" />
                  <span style={{ fontWeight: '600' }}>{group.name}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {groupCats.map(cat => (
                    <span key={cat.id} style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div style={{ height: '40px' }}></div>
    </div>
  );
}
