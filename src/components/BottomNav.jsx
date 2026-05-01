import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, PieChart, Settings } from 'lucide-react';
import './BottomNav.css';

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/add" className={({ isActive }) => `nav-item add-btn ${isActive ? 'active' : ''}`}>
        <div className="add-icon-wrapper">
          <PlusCircle size={32} />
        </div>
        <span>Add</span>
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <PieChart size={24} />
        <span>Insights</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings size={24} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
