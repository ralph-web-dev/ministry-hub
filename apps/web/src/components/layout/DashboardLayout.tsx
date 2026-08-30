import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/components/AuthProvider';
import { membersApi, MemberResponse } from '@/features/members/api/members';
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
  IconX,
  IconCake,
  IconClipboardCheck,
} from '@tabler/icons-react';
import './DashboardLayout.scss';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const [birthdayMembers, setBirthdayMembers] = useState<MemberResponse[]>([]);
  const [readNotifs, setReadNotifs] = useState<string[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch members and check for birthdays today
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const members = await membersApi.getMembers();
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        const havingBirthday = members.filter(member => {
          if (!member.dateOfBirth) return false;
          const dob = new Date(member.dateOfBirth);
          return (dob.getMonth() + 1) === currentMonth && dob.getDate() === currentDay;
        });

        setBirthdayMembers(havingBirthday);
      } catch (error) {
        console.error('Failed to fetch members for birthdays', error);
      }
    };
    
    fetchBirthdays();
  }, []);

  const getPageContext = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/attendance')) return 'Attendance / Overview';
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
            <span className="nav-icon">
              <IconLayoutDashboard size={22} stroke={1.8} />
            </span>
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/members"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <span className="nav-icon">
              <IconUsers size={22} stroke={1.8} />
            </span>
            <span className="nav-label">Members</span>
          </NavLink>
          <NavLink
            to="/attendance"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <span className="nav-icon">
              <IconClipboardCheck size={22} stroke={1.8} />
            </span>
            <span className="nav-label">Attendance</span>
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
            {/* Notification Dropdown Container */}
            <div className="notification-dropdown-container" ref={notifRef} style={{ position: 'relative' }}>
              <button 
                className={`header-icon-btn ${isNotificationOpen ? 'active' : ''}`} 
                aria-label="Notifications"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              >
                <IconBell size={20} stroke={1.8} />
                {birthdayMembers.filter(m => !readNotifs.includes(m.id)).length > 0 && (
                  <span className="notification-badge">{birthdayMembers.filter(m => !readNotifs.includes(m.id)).length}</span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="notification-dropdown-menu">
                  <div className="dropdown-title">
                    <div className="title-left">
                      <span>Notifications</span>
                      {birthdayMembers.filter(m => !readNotifs.includes(m.id)).length > 0 && (
                        <span className="title-badge">
                          {birthdayMembers.filter(m => !readNotifs.includes(m.id)).length} new
                        </span>
                      )}
                    </div>
                    {birthdayMembers.filter(m => !readNotifs.includes(m.id)).length > 0 && (
                      <button
                        type="button"
                        className="btn-mark-read-quick"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReadNotifs(birthdayMembers.map(m => m.id));
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {birthdayMembers.length > 0 ? (
                      birthdayMembers.map(member => {
                        const isRead = readNotifs.includes(member.id);
                        return (
                          <div 
                            key={member.id} 
                            className={`notification-item ${!isRead ? 'unread' : 'read'}`}
                            onClick={() => {
                              if (!isRead) setReadNotifs([...readNotifs, member.id]);
                              navigate(`/members/${member.id}`);
                              setIsNotificationOpen(false);
                            }}
                          >
                            <div className="notif-icon-circle bg-pink-100 text-pink-600">
                              <IconCake size={18} stroke={2} />
                            </div>
                            <div className="notif-content">
                              <div className="notif-text">
                                <span className="notif-name">{member.firstName} {member.lastName}</span>
                                <span className="notif-desc"> has a birthday today! 🎉</span>
                              </div>
                              <div className="notif-time">Today · Member Birthday</div>
                            </div>
                            {!isRead && <div className="unread-dot" title="Unread notification"></div>}
                          </div>
                        );
                      })
                    ) : (
                      <div className="notification-empty">
                        <div className="empty-bell-circle">
                          <IconBell size={24} stroke={1.8} />
                        </div>
                        <p className="empty-title">All caught up!</p>
                        <p className="empty-subtitle">No notifications at this time.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
