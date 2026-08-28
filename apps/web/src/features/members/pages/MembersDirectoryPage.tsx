import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  IconUsers, 
  IconSearch, 
  IconPlus, 
  IconPrinter, 
  IconFilter, 
  IconEye, 
  IconEdit, 
  IconTrash 
} from '@tabler/icons-react';
import { membersApi, MemberResponse } from '../api/members';
import './MembersDirectoryPage.scss';

export function MembersDirectoryPage() {
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'status'>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'thumbnail'>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const data = await membersApi.getMembers({ 
        search: searchTerm, 
        status: statusFilter || undefined 
      });
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(members.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleArchive = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to archive ${name}?`)) {
      try {
        await membersApi.archiveMember(id);
        fetchMembers();
      } catch (error) {
        console.error('Failed to archive member:', error);
      }
    }
  };

  // Sort members
  const sortedMembers = [...members].sort((a, b) => {
    if (sortBy === 'name') {
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    }
    if (sortBy === 'status') {
      return a.membershipStatus.localeCompare(b.membershipStatus);
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="members-directory-page">
      {/* ================= HEADER CONTROL BAR ================= */}
      <div className="directory-header">
        <div className="header-left-group">
          <div className="page-title-wrap">
            <IconUsers size={24} stroke={1.8} className="title-icon" />
            <h1 className="page-title">Members Directory</h1>
          </div>

          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'thumbnail' ? 'active' : ''}`}
              onClick={() => setViewMode('thumbnail')}
            >
              Thumbnail
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions-group">
          <div className="search-bar">
            <IconSearch size={18} stroke={1.8} />
            <input 
              type="text" 
              placeholder="Search by name, ID or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Link to="/members/new" className="btn-add-member" title="Add New Member">
            <IconPlus size={18} stroke={2.5} />
            <span>Add Member</span>
          </Link>
        </div>
      </div>

      {/* ================= SECONDARY FILTER BAR ================= */}
      <div className="directory-subbar">
        <div className="subbar-left">
          <div className="member-count-badge">
            <strong>{members.length}</strong> members
          </div>

          <div className="sort-by-select-wrap">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="recent">Recently Joined</option>
              <option value="name">Name (A - Z)</option>
              <option value="status">Membership Status</option>
            </select>
          </div>
        </div>

        <div className="subbar-right">
          <button className="icon-toolbar-btn" onClick={() => window.print()} title="Print / Export">
            <IconPrinter size={18} stroke={1.8} />
          </button>

          <div className="filter-dropdown-container">
            <button 
              className={`filter-toggle-btn ${statusFilter ? 'active' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <IconFilter size={16} stroke={1.8} />
              <span>{statusFilter ? `Status: ${statusFilter}` : 'Filter'}</span>
            </button>

            {isFilterOpen && (
              <div className="filter-popup-menu">
                <div className="popup-title">Filter by Status</div>
                <button 
                  className={`filter-option ${statusFilter === '' ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter(''); setIsFilterOpen(false); }}
                >
                  All Statuses
                </button>
                <button 
                  className={`filter-option ${statusFilter === 'ACTIVE' ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter('ACTIVE'); setIsFilterOpen(false); }}
                >
                  Active Only
                </button>
                <button 
                  className={`filter-option ${statusFilter === 'INACTIVE' ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter('INACTIVE'); setIsFilterOpen(false); }}
                >
                  Inactive Only
                </button>
                <button 
                  className={`filter-option ${statusFilter === 'TRANSFERRED' ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter('TRANSFERRED'); setIsFilterOpen(false); }}
                >
                  Transferred
                </button>
                <button 
                  className={`filter-option ${statusFilter === 'ARCHIVED' ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter('ARCHIVED'); setIsFilterOpen(false); }}
                >
                  Archived
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= TABLE VIEW ================= */}
      <div className="table-card">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading directory...</span>
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <IconUsers size={36} stroke={1.5} />
            </div>
            <h3>No members found</h3>
            <p>Try adjusting your search criteria or add a new church member.</p>
            <Link to="/members/new" className="btn-add-inline">
              + Add New Member
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="members-table">
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === sortedMembers.length && sortedMembers.length > 0}
                    />
                  </th>
                  <th>Basic Info</th>
                  <th>Phone Number</th>
                  <th>City / Address</th>
                  <th>Baptism</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);

                  return (
                    <tr 
                      key={member.id} 
                      className={`member-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => navigate(`/members/${member.id}`)}
                    >
                      <td className="col-checkbox" onClick={(e) => handleSelectOne(member.id, e)}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => {}}
                        />
                      </td>

                      {/* Basic Info (Avatar + Name + Email) */}
                      <td>
                        <div className="basic-info-cell">
                          <div className="member-avatar">
                            {member.profilePictureUrl ? (
                              <img src={`http://localhost:3000${member.profilePictureUrl}`} alt={member.firstName} />
                            ) : (
                              <span className="avatar-initials">
                                {member.firstName?.[0] || ''}{member.lastName?.[0] || ''}
                              </span>
                            )}
                          </div>
                          <div className="name-email-wrap">
                            <span className="member-full-name">{member.firstName} {member.lastName}</span>
                            <span className="member-email">{member.email || member.memberId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td>
                        <span className="cell-phone">{member.phoneNumber || '—'}</span>
                      </td>

                      {/* City / Address */}
                      <td>
                        <span className="cell-city">{member.address || 'Main Campus'}</span>
                      </td>

                      {/* Baptism */}
                      <td>
                        <span className={`badge-step ${member.baptismStatus === 'BAPTIZED' ? 'step-baptized' : 'step-pending'}`}>
                          {member.baptismStatus === 'BAPTIZED' ? 'Baptized' : 'Not Baptized'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td>
                        <span className="cell-date">
                          {member.dateJoined 
                            ? new Date(member.dateJoined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : member.createdAt 
                              ? new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span className={`status-pill status-${member.membershipStatus?.toLowerCase() || 'active'}`}>
                          {member.membershipStatus || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Tabler Action Buttons */}
                      <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                        <div className="table-actions-group">
                          <button 
                            className="btn-table-action"
                            title="View Profile"
                            onClick={() => navigate(`/members/${member.id}`)}
                          >
                            <IconEye size={17} stroke={1.8} />
                          </button>

                          <button 
                            className="btn-table-action"
                            title="Edit Member"
                            onClick={() => navigate(`/members/${member.id}/edit`)}
                          >
                            <IconEdit size={17} stroke={1.8} />
                          </button>

                          {member.membershipStatus !== 'ARCHIVED' && (
                            <button 
                              className="btn-table-action danger"
                              title="Archive Member"
                              onClick={(e) => handleArchive(member.id, `${member.firstName} ${member.lastName}`, e)}
                            >
                              <IconTrash size={17} stroke={1.8} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
