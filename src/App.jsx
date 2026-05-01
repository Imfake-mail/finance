import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFinanceStore } from './store/useFinanceStore';

import { BottomNav } from './components/BottomNav';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { AddExpense } from './pages/AddExpense';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useFinanceStore();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }}>Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return children;
}

function App() {
  const { initialize } = useFinanceStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
            <BottomNav />
          </ProtectedRoute>
        } />
        
        <Route path="/add" element={
          <ProtectedRoute>
            <AddExpense />
            <BottomNav />
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
            <BottomNav />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
            <BottomNav />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
