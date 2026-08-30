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
  IconTrash,
  IconPhone,
  IconMail,
  IconMapPin
} from '@tabler/icons-react';
import { membersApi, MemberResponse } from '../api/members';
import { getMediaUrl } from '@/utils/media';
import { TableSkeleton, GridSkeleton, Pagination, Avatar, Input, Select, ToggleGroup, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
      toast.error('Failed to load members');
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

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(members.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleArchive = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to archive ${name}?`)) {
      try {
        await membersApi.archiveMember(id);
        toast.success(`${name} archived`);
        fetchMembers();
      } catch (error) {
        console.error('Failed to archive member:', error);
        toast.error('Failed to archive member');
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

  const totalItems = sortedMembers.length;
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
          <ToggleGroup
            value={viewMode}
            onChange={(v) => setViewMode(v as 'list' | 'thumbnail')}
            options={[
              { value: 'list', label: 'List' },
              { value: 'thumbnail', label: 'Thumbnail' }
            ]}
          />
        </div>

        {/* Action Controls */}
        <div className="header-actions-group">
          <div className="search-bar-wrapper">
            <Input 
              startIcon={<IconSearch size={18} stroke={1.8} />}
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
            <Select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name (A - Z)</option>
              <option value="status">Membership Status</option>
            </Select>
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

      {/* ================= VIEW SWITCHER (LIST / THUMBNAIL) ================= */}
      {viewMode === 'thumbnail' ? (
        /* THUMBNAIL / GRID VIEW */
        <div className="thumbnail-view-container">
          {isLoading ? (
            <GridSkeleton count={8} />
          ) : sortedMembers.length === 0 ? (
            <div className="table-card">
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
            </div>
          ) : (
            <div className="thumbnail-card-wrapper">
              <div className="members-thumbnail-grid">
                {paginatedMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);

                  return (
                    <div
                      key={member.id}
                      className={`member-thumbnail-card ${isSelected ? 'card-selected' : ''}`}
                      onClick={() => navigate(`/members/${member.id}`)}
                    >
                      <div className="card-top-bar" onClick={(e) => e.stopPropagation()}>
                        <label className="checkbox-wrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(member.id)}
                          />
                        </label>

                        <div className="card-actions-quick">
                          <button
                            type="button"
                            className="btn-card-action"
                            title="View Profile"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/members/${member.id}`);
                            }}
                          >
                            <IconEye size={15} stroke={1.8} />
                          </button>
                          <button
                            type="button"
                            className="btn-card-action"
                            title="Edit Profile"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/members/${member.id}/edit`);
                            }}
                          >
                            <IconEdit size={15} stroke={1.8} />
                          </button>
                          {member.membershipStatus !== 'ARCHIVED' && (
                            <button
                              type="button"
                              className="btn-card-action danger"
                              title="Archive Member"
                              onClick={(e) => handleArchive(member.id, `${member.firstName} ${member.lastName}`, e)}
                            >
                              <IconTrash size={15} stroke={1.8} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="card-avatar-section">
                        <Avatar
                          src={member.profilePictureUrl ? getMediaUrl(member.profilePictureUrl) : undefined}
                          alt={member.firstName}
                          fallback={`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`}
                          size="xl"
                          className="card-avatar"
                        />
                        <h3 className="card-name">{member.firstName} {member.lastName}</h3>
                        <span className="card-member-id">{member.memberId}</span>

                        <div className="card-badges-row">
                          <span className={`status-pill status-${member.membershipStatus?.toLowerCase() || 'active'}`}>
                            {member.membershipStatus || 'ACTIVE'}
                          </span>
                          <span className={`badge-step ${member.baptismStatus === 'BAPTIZED' ? 'step-baptized' : 'step-pending'}`}>
                            {member.baptismStatus === 'BAPTIZED' ? 'Baptized' : 'Not Baptized'}
                          </span>
                        </div>
                      </div>

                      <div className="card-info-list">
                        <div className="card-info-item">
                          <IconPhone size={14} stroke={1.8} />
                          <span>{member.phoneNumber || '—'}</span>
                        </div>
                        <div className="card-info-item">
                          <IconMail size={14} stroke={1.8} />
                          <span className="truncate">{member.email || 'No email provided'}</span>
                        </div>
                        <div className="card-info-item">
                          <IconMapPin size={14} stroke={1.8} />
                          <span className="truncate">{member.address || 'Main Campus'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Thumbnail Pagination */}
              <div className="thumbnail-pagination-card">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="table-card">
          {isLoading ? (
            <TableSkeleton rows={6} />
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
            <>
              <div className="table-responsive">
                <Table className="members-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="col-checkbox">
                        <input 
                          type="checkbox" 
                          onChange={handleSelectAll}
                          checked={selectedIds.length === sortedMembers.length && sortedMembers.length > 0}
                        />
                      </TableHead>
                      <TableHead>Basic Info</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>City / Address</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="col-actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member) => {
                      const isSelected = selectedIds.includes(member.id);

                      return (
                        <TableRow 
                          key={member.id} 
                          selected={isSelected}
                          className="member-row"
                          onClick={() => navigate(`/members/${member.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <TableCell className="col-checkbox" onClick={(e) => handleSelectOne(member.id, e)}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}}
                            />
                          </TableCell>

                          {/* Basic Info (Avatar + Name + Email) */}
                          <TableCell>
                            <div className="basic-info-cell">
                              <Avatar
                                src={member.profilePictureUrl ? getMediaUrl(member.profilePictureUrl) : undefined}
                                alt={member.firstName}
                                fallback={`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`}
                                size="md"
                                className="member-avatar"
                              />
                              <div className="name-email-wrap">
                                <span className="member-full-name">{member.firstName} {member.lastName}</span>
                                <span className="member-email">{member.email || member.memberId}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Phone */}
                          <TableCell>
                            <span className="cell-phone">{member.phoneNumber || '—'}</span>
                          </TableCell>

                          {/* City / Address */}
                          <TableCell>
                            <span className="cell-city">{member.address || 'Main Campus'}</span>
                          </TableCell>

                          {/* Joined Date */}
                          <TableCell>
                            <span className="cell-date">
                              {member.dateJoined 
                                ? new Date(member.dateJoined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : member.createdAt 
                                  ? new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : '—'}
                            </span>
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            <span className={`status-pill status-${member.membershipStatus?.toLowerCase() || 'active'}`}>
                              {member.membershipStatus || 'ACTIVE'}
                            </span>
                          </TableCell>

                          {/* Tabler Action Buttons */}
                          <TableCell className="col-actions" onClick={(e) => e.stopPropagation()}>
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
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Table Pagination */}
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
