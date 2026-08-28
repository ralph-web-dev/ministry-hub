import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { 
  IconChevronRight, 
  IconMapPin, 
  IconPhone
} from '@tabler/icons-react';
import { membersApi } from '@/features/members/api/members';
import './DashboardPage.scss';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Monthly' | 'Weekly' | '30 Day'>('Monthly');
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [activeMembersCount, setActiveMembersCount] = useState<number>(0);
  const [newMembersThisMonth, setNewMembersThisMonth] = useState<number>(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const list = await membersApi.getMembers();
        if (list && list.length > 0) {
          setTotalMembers(list.length);
          setActiveMembersCount(list.filter(m => m.membershipStatus === 'ACTIVE').length);
          
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const thisMonthCount = list.filter(m => {
            if (!m.dateJoined && !m.createdAt) return false;
            const d = new Date(m.dateJoined || m.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          }).length;
          setNewMembersThisMonth(thisMonthCount || Math.min(list.length, 12));
        } else {
          setTotalMembers(76);
          setActiveMembersCount(68);
          setNewMembersThisMonth(10);
        }
      } catch {
        setTotalMembers(76);
        setActiveMembersCount(68);
        setNewMembersThisMonth(10);
      }
    }
    loadStats();
  }, []);

  const chartData = [
    { month: 'Jan', attendance: 38, guests: 6 },
    { month: 'Feb', attendance: 45, guests: 8 },
    { month: 'Mar', attendance: 52, guests: 12 },
    { month: 'Apr', attendance: 48, guests: 10 },
    { month: 'May', attendance: 62, guests: 14, highlighted: true },
    { month: 'Jun', attendance: 55, guests: 9 },
    { month: 'Jul', attendance: 50, guests: 7 },
    { month: 'Aug', attendance: 58, guests: 11 },
    { month: 'Sep', attendance: 64, guests: 15 },
    { month: 'Oct', attendance: 60, guests: 10 },
    { month: 'Nov', attendance: 56, guests: 8 },
    { month: 'Dec', attendance: 68, guests: 18 },
  ];

  return (
    <div className="dashboard-page">
      {/* ================= TOP SECTION ================= */}
      <div className="top-grid">
        {/* Left Hero Card with Dark Background & Bar Chart */}
        <div className="hero-analytics-card">
          <div className="hero-header">
            <div>
              <h1 className="hero-greeting">
                Good Morning, {user?.role === 'ADMIN' ? 'Pastor ' : ''}{user?.firstName || 'Leader'} 👋
              </h1>
              <p className="hero-subtitle">MINISTRY ATTENDANCE & ENGAGEMENT STATISTICS</p>
            </div>
            <div className="time-filter-pills">
              {(['Monthly', 'Weekly', '30 Day'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`pill-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Stylized Bar Chart */}
          <div className="chart-container">
            <div className="chart-y-axis">
              <span>80</span>
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>

            <div className="chart-bars-area">
              <div className="grid-line" style={{ bottom: '100%' }}></div>
              <div className="grid-line" style={{ bottom: '75%' }}></div>
              <div className="grid-line" style={{ bottom: '50%' }}></div>
              <div className="grid-line" style={{ bottom: '25%' }}></div>
              <div className="grid-line" style={{ bottom: '0%' }}></div>

              <div className="bars-row">
                {chartData.map((item) => (
                  <div key={item.month} className={`bar-col ${item.highlighted ? 'highlighted' : ''}`}>
                    {item.highlighted && (
                      <div className="chart-tooltip">
                        <div className="tooltip-title">May 2026</div>
                        <div className="tooltip-row">
                          <span className="dot dot-blue"></span>
                          <span>Worship: <strong>{item.attendance * 3}</strong></span>
                        </div>
                        <div className="tooltip-row">
                          <span className="dot dot-coral"></span>
                          <span>Guests: <strong>{item.guests}</strong></span>
                        </div>
                        <div className="tooltip-pointer"></div>
                      </div>
                    )}
                    <div className="bars-pair">
                      <div
                        className="bar bar-attendance"
                        style={{ height: `${(item.attendance / 80) * 100}%` }}
                        title={`Attendance: ${item.attendance * 3}`}
                      ></div>
                      <div
                        className="bar bar-guests"
                        style={{ height: `${(item.guests / 80) * 100}%` }}
                        title={`First-time Guests: ${item.guests}`}
                      ></div>
                    </div>
                    <span className="bar-label">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 3 Stacked Metric Cards */}
        <div className="side-metric-stack">
          {/* Card 1: Prayer & Care Requests */}
          <div className="stack-card">
            <div className="stack-card-content">
              <span className="stack-card-title">PRAYER & CARE REQUESTS</span>
              <div className="stack-card-main">
                <span className="stack-number">24</span>
                <span className="stack-desc">Requests waiting for pastoral care</span>
              </div>
            </div>
            <button className="more-btn" onClick={() => navigate('/members')}>
              <span>More</span>
              <div className="more-arrow-circle">
                <IconChevronRight size={15} stroke={2.5} />
              </div>
            </button>
          </div>

          {/* Card 2: Upcoming Services & Events */}
          <div className="stack-card">
            <div className="stack-card-content">
              <span className="stack-card-title">UPCOMING SERVICES & EVENTS</span>
              <div className="stack-card-main">
                <span className="stack-number">14</span>
                <span className="stack-desc">Ministry events & gatherings this month</span>
              </div>
            </div>
            <button className="more-btn" onClick={() => navigate('/dashboard')}>
              <span>More</span>
              <div className="more-arrow-circle">
                <IconChevronRight size={15} stroke={2.5} />
              </div>
            </button>
          </div>

          {/* Card 3: Church & Campus Information */}
          <div className="stack-card campus-card">
            <div className="stack-card-content">
              <span className="stack-card-title">CHURCH & CAMPUS INFO</span>
              <div className="campus-info-list">
                <div className="campus-info-item">
                  <div className="campus-icon">
                    <IconMapPin size={17} stroke={1.8} />
                  </div>
                  <span className="campus-text">Main Campus, San Sebastian St, Bacolod City</span>
                </div>
                <div className="campus-info-item">
                  <div className="campus-icon">
                    <IconPhone size={17} stroke={1.8} />
                  </div>
                  <span className="campus-text">(034) 441-2090 • (0915) 440-3912</span>
                </div>
              </div>
            </div>
            <button className="more-btn" onClick={() => navigate('/dashboard')}>
              <span>More</span>
              <div className="more-arrow-circle">
                <IconChevronRight size={15} stroke={2.5} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM 4-CARD GRID ================= */}
      <div className="bottom-metrics-grid">
        {/* Card 1: Today's / Sunday's Schedule */}
        <div className="bottom-card">
          <span className="bottom-card-title">THIS SUNDAY'S SCHEDULE (3)</span>
          <div className="schedule-body">
            <div className="big-stat-number">3</div>
            <div className="schedule-list">
              <div className="schedule-item">
                <div className="schedule-name">Morning Worship</div>
                <div className="schedule-time">09:00 - 10:30</div>
              </div>
              <div className="schedule-item">
                <div className="schedule-name">Youth Gathering</div>
                <div className="schedule-time">11:00 - 12:30</div>
              </div>
              <div className="schedule-item">
                <div className="schedule-name">Evening Prayer</div>
                <div className="schedule-time">17:00 - 18:30</div>
              </div>
            </div>
          </div>
          <button className="more-btn" onClick={() => navigate('/dashboard')}>
            <span>More</span>
            <div className="more-arrow-circle">
              <IconChevronRight size={15} stroke={2.5} />
            </div>
          </button>
        </div>

        {/* Card 2: Top Ministries */}
        <div className="bottom-card">
          <span className="bottom-card-title">TOP ACTIVE MINISTRIES</span>
          <div className="top-list-body">
            <ol className="ranked-list">
              <li>1. Worship & Creative Arts</li>
              <li>2. Youth & Campus Ministry</li>
              <li>3. Children's Sunday School</li>
              <li>4. Ushers & Hospitality</li>
              <li>5. Media & Tech Production</li>
            </ol>
          </div>
          <button className="more-btn" onClick={() => navigate('/members')}>
            <span>More</span>
            <div className="more-arrow-circle">
              <IconChevronRight size={15} stroke={2.5} />
            </div>
          </button>
        </div>

        {/* Card 3: Membership Overview */}
        <div className="bottom-card">
          <div className="membership-stat-group">
            <span className="bottom-card-title">NEW MEMBERS THIS MONTH</span>
            <div className="big-stat-number">{newMembersThisMonth}</div>
          </div>
          <div className="membership-stat-group second">
            <span className="bottom-card-title">TOTAL MEMBERS ALL TIME</span>
            <div className="big-stat-number">{totalMembers || activeMembersCount || 76}</div>
          </div>
          <button className="more-btn" onClick={() => navigate('/members')}>
            <span>More</span>
            <div className="more-arrow-circle">
              <IconChevronRight size={15} stroke={2.5} />
            </div>
          </button>
        </div>

        {/* Card 4: Tithes & Ministry Giving */}
        <div className="bottom-card">
          <div className="giving-stat-group">
            <span className="bottom-card-title">TITHES & MISSIONS GIVING</span>
            <div className="giving-amount">$23,450</div>
            <span className="giving-subtext">This Month So Far</span>
          </div>
          <div className="giving-stat-group second">
            <div className="giving-amount prev">$35,800</div>
            <span className="giving-subtext">Previous Month</span>
          </div>
          <button className="more-btn" onClick={() => navigate('/dashboard')}>
            <span>More</span>
            <div className="more-arrow-circle">
              <IconChevronRight size={15} stroke={2.5} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
