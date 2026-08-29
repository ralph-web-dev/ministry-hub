import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/components/AuthProvider';
import {
  IconLayoutDashboard,
  IconUsers,
  IconMenu2,
  IconBell,
  IconHelpCircle,
  IconChevronDown,
  IconLogout,
  IconUser,
  IconSettings,
  IconX
} from '@tabler/icons-react';
import './DashboardLayout.scss';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const getPageContext = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path === '/members') return 'Members / Directory';
    if (path === '/members/new') return 'Members / Add New';
    if (path.includes('/edit')) return 'Members / Edit Profile';
    if (path.startsWith('/members/')) return 'Members / Profile Details';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {(!isCollapsed || isMobileOpen) && (
            <img src="/logo.svg" alt="MinistryHub Logo" className="sidebar-logo" />
          )}

          {/* Desktop Collapse Toggle */}
          <button
            className="sidebar-toggle desktop-only"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle Sidebar"
          >
            <IconMenu2 size={21} stroke={1.8} />
          </button>

          {/* Mobile Close Button */}
          <button
            className="sidebar-toggle mobile-only"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close Sidebar"
          >
            <IconX size={21} stroke={1.8} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <IconLayoutDashboard size={22} stroke={1.8} />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/members"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <IconUsers size={22} stroke={1.8} />
            <span className="nav-label">Members</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="global-header">
          <div className="header-left">
            {/* Mobile Hamburger Menu Button */}
            <button
              className="mobile-menu-trigger mobile-only"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <IconMenu2 size={22} stroke={1.8} />
            </button>
            <span className="page-context">{getPageContext()}</span>
          </div>

          <div className="header-right">
            <button className="header-icon-btn" aria-label="Notifications">
              <IconBell size={20} stroke={1.8} />
              <span className="notification-badge"></span>
            </button>

            <button className="header-icon-btn hide-on-mobile" aria-label="Help">
              <IconHelpCircle size={20} stroke={1.8} />
            </button>

            <div className="header-divider hide-on-mobile"></div>

            {/* User Profile Dropdown Container */}
            <div className="user-dropdown-container" style={{ position: 'relative' }}>
              <button
                type="button"
                className="user-profile-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              >
                <div className="user-avatar">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="user-info hide-on-mobile">
                  <span className="user-name">{user?.firstName} {user?.lastName}</span>
                  <span className="user-role">{user?.role || 'ADMIN'}</span>
                </div>
                <IconChevronDown size={16} stroke={2} className={`dropdown-arrow hide-on-mobile ${isDropdownOpen ? 'open' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-summary">
                    <span className="summary-name">{user?.firstName} {user?.lastName}</span>
                    <span className="summary-email">{user?.email || 'admin@ministryhub.org'}</span>
                  </div>
                  <div className="dropdown-items">
                    <button type="button" className="dropdown-btn">
                      <IconUser size={16} stroke={1.8} />
                      <span>My Profile</span>
                    </button>
                    <button type="button" className="dropdown-btn">
                      <IconSettings size={16} stroke={1.8} />
                      <span>Settings</span>
                    </button>
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                    <button type="button" className="dropdown-btn logout" onClick={handleLogout}>
                      <IconLogout size={16} stroke={1.8} />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
