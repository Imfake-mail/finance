import { useState, useEffect, useRef } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function AddExpense() {
  const navigate = useNavigate();
  const { categories, addTransaction, categoryGroups } = useFinanceStore();
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountRef = useRef(null);

  useEffect(() => {
    // Auto-focus amount input for speed
    if (amountRef.current) {
      amountRef.current.focus();
    }
    // Set default category if available
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0 || !categoryId) return;
    
    setIsSubmitting(true);
    await addTransaction({
      amount: Number(amount),
      category_id: categoryId,
      date,
      note,
      is_recurring: false
    });
    setIsSubmitting(false);
    navigate('/');
  };

  // Group categories for select dropdown
  const groupedCategories = categoryGroups.map(group => ({
    ...group,
    categories: categories.filter(c => c.group_id === group.id)
  }));

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Add Expense</h2>
        <button className="btn" style={{ width: 'auto', padding: '8px 16px', background: 'var(--bg-card)' }} onClick={() => navigate(-1)}>Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="animate-slide-up">
        <div className="card" style={{ padding: '30px 20px' }}>
          <div className="amount-input-container">
            <span>$</span>
            <input
              ref={amountRef}
              type="number"
              step="0.01"
              className="amount-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="card" style={{ animationDelay: '0.1s' }}>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>Select a category</option>
              {groupedCategories.map(group => (
                <optgroup key={group.id} label={group.name}>
                  {group.categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Note (Optional)</label>
            <input 
              type="text" 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSubmitting || !amount || !categoryId}
          style={{ marginTop: '20px' }}
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </button>
      </form>
    </div>
  );
}
