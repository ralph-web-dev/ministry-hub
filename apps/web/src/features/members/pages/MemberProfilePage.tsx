import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  IconArrowLeft, 
  IconEdit, 
  IconTrash, 
  IconPhone, 
  IconMail, 
  IconMapPin, 
  IconUser, 
  IconBuildingChurch
} from '@tabler/icons-react';
import { membersApi, MemberResponse } from '../api/members';
import './MemberProfilePage.scss';

export function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        if (id) {
          const data = await membersApi.getMember(id);
          setMember(data);
        }
      } catch (error) {
        console.error('Failed to fetch member', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  const handleArchive = async () => {
    if (member && window.confirm(`Are you sure you want to archive ${member.firstName} ${member.lastName}?`)) {
      try {
        await membersApi.archiveMember(member.id);
        navigate('/members');
      } catch (error) {
        console.error('Failed to archive member', error);
      }
    }
  };

  const getAge = (dobString?: string | null) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  if (isLoading) {
    return (
      <div className="member-profile-page">
        <div className="profile-loading">
          <div className="spinner"></div>
          <span>Loading member profile...</span>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="member-profile-page">
        <div className="profile-not-found">
          <h2>Member Not Found</h2>
          <p>The requested member profile could not be found in the directory.</p>
          <Link to="/members" className="btn btn-primary">
            Return to Directory
          </Link>
        </div>
      </div>
    );
  }

  const age = getAge(member.dateOfBirth);

  return (
    <div className="member-profile-page">
      {/* ================= TOP NAV BAR ================= */}
      <div className="profile-nav-bar">
        <Link to="/members" className="back-btn-link">
          <IconArrowLeft size={16} stroke={2.2} />
          <span>Back to Directory</span>
        </Link>

        <div className="profile-top-actions">
          <button 
            className="btn btn-outline btn-edit-profile" 
            onClick={() => navigate(`/members/${member.id}/edit`)}
          >
            <IconEdit size={16} stroke={1.8} />
            <span>Edit Profile</span>
          </button>

          {member.membershipStatus !== 'ARCHIVED' && (
            <button 
              className="btn btn-outline danger btn-archive-profile" 
              onClick={handleArchive}
            >
              <IconTrash size={16} stroke={1.8} />
              <span>Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= HERO PROFILE BANNER CARD ================= */}
      <div className="hero-profile-card">
        <div className="profile-cover-banner"></div>

        <div className="profile-hero-content">
          <div className="avatar-wrapper">
            {member.profilePictureUrl ? (
              <img src={`http://localhost:3000${member.profilePictureUrl}`} alt={member.firstName} className="avatar-img" />
            ) : (
              <div className="avatar-gradient">
                <span>{member.firstName?.[0] || ''}{member.lastName?.[0] || ''}</span>
              </div>
            )}
          </div>

          <div className="profile-hero-details">
            <div className="name-and-badges">
              <h1 className="member-name">
                {member.firstName} {member.middleName ? `${member.middleName} ` : ''}{member.lastName} {member.suffix || ''}
              </h1>

              <div className="badges-row">
                <span className="badge-member-id">{member.memberId}</span>
                <span className={`status-pill status-${member.membershipStatus?.toLowerCase() || 'active'}`}>
                  {member.membershipStatus || 'ACTIVE'}
                </span>
                <span className={`step-pill ${member.baptismStatus === 'BAPTIZED' ? 'step-baptized' : 'step-pending'}`}>
                  {member.baptismStatus === 'BAPTIZED' ? 'Baptized' : 'Not Baptized'}
                </span>
              </div>
            </div>

            {/* Quick Contact Chips */}
            <div className="quick-chips-row">
              {member.phoneNumber && (
                <div className="chip-item">
                  <IconPhone size={15} stroke={1.8} />
                  <span>{member.phoneNumber}</span>
                </div>
              )}

              {member.email && (
                <div className="chip-item">
                  <IconMail size={15} stroke={1.8} />
                  <span>{member.email}</span>
                </div>
              )}

              <div className="chip-item">
                <IconMapPin size={15} stroke={1.8} />
                <span>{member.address || 'Main Campus'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DETAIL PANELS GRID ================= */}
      <div className="details-panels-grid">
        
        {/* PANEL 1: PERSONAL INFORMATION */}
        <div className="detail-card">
          <div className="detail-card-header">
            <div className="header-icon-wrap">
              <IconUser size={17} stroke={1.8} />
            </div>
            <h3>Personal Demographics</h3>
          </div>

          <div className="detail-card-body grid-2">
            <div className="info-item">
              <span className="info-label">First Name</span>
              <span className="info-value">{member.firstName}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Middle Name</span>
              <span className="info-value">{member.middleName || '—'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Last Name</span>
              <span className="info-value">{member.lastName}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Gender</span>
              <span className="info-value capitalize">{member.gender ? member.gender.toLowerCase() : '—'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Date of Birth</span>
              <span className="info-value">
                {member.dateOfBirth 
                  ? new Date(member.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : '—'}
                {age !== null && <span className="info-sub-pill">({age} years old)</span>}
              </span>
            </div>
          </div>
        </div>

        {/* PANEL 2: CONTACT & RESIDENCE */}
        <div className="detail-card">
          <div className="detail-card-header">
            <div className="header-icon-wrap">
              <IconPhone size={17} stroke={1.8} />
            </div>
            <h3>Contact & Residence</h3>
          </div>

          <div className="detail-card-body grid-2">
            <div className="info-item">
              <span className="info-label">Contact Number</span>
              {member.phoneNumber ? (
                <a href={`tel:${member.phoneNumber}`} className="info-link">
                  {member.phoneNumber}
                </a>
              ) : (
                <span className="info-value">—</span>
              )}
            </div>

            <div className="info-item">
              <span className="info-label">Email Address</span>
              {member.email ? (
                <a href={`mailto:${member.email}`} className="info-link">
                  {member.email}
                </a>
              ) : (
                <span className="info-value">—</span>
              )}
            </div>

            <div className="info-item col-span-full">
              <span className="info-label">Residential Address</span>
              <span className="info-value">{member.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* PANEL 3: CHURCH MEMBERSHIP & SPIRITUAL JOURNEY */}
        <div className="detail-card col-span-full">
          <div className="detail-card-header">
            <div className="header-icon-wrap">
              <IconBuildingChurch size={17} stroke={1.8} />
            </div>
            <h3>Church Membership & Spiritual Milestones</h3>
          </div>

          <div className="detail-card-body grid-3">
            <div className="info-item">
              <span className="info-label">Member ID</span>
              <span className="info-value code-font">{member.memberId}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Membership Status</span>
              <span className={`status-pill status-${member.membershipStatus?.toLowerCase() || 'active'}`}>
                {member.membershipStatus || 'ACTIVE'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Date Joined</span>
              <span className="info-value">
                {member.dateJoined 
                  ? new Date(member.dateJoined).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : '—'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Water Baptism</span>
              <span className={`step-pill ${member.baptismStatus === 'BAPTIZED' ? 'step-baptized' : 'step-pending'}`}>
                {member.baptismStatus === 'BAPTIZED' ? 'Baptized' : 'Not Baptized'}
              </span>
            </div>

            {member.baptismStatus === 'BAPTIZED' && (
              <div className="info-item">
                <span className="info-label">Baptism Date</span>
                <span className="info-value">
                  {member.baptismDate 
                    ? new Date(member.baptismDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : '—'}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
