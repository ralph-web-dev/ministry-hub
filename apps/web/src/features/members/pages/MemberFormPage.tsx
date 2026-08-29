import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  IconArrowLeft, 
  IconUpload, 
  IconCheck, 
  IconPhone, 
  IconMail, 
  IconMapPin, 
  IconUser,
  IconAlertCircle
} from '@tabler/icons-react';
import { membersApi } from '../api/members';
import { getMediaUrl } from '@/utils/media';
import { toast } from '@/components/ui/Toast';
import './MemberFormPage.scss';

export function MemberFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    membershipStatus: 'ACTIVE',
    baptismStatus: 'NOT_BAPTIZED',
    baptismDate: '',
  });

  useEffect(() => {
    if (id) {
      const fetchMember = async () => {
        try {
          const data = await membersApi.getMember(id);
          setFormData({
            firstName: data.firstName || '',
            middleName: data.middleName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
            gender: data.gender || '',
            address: data.address || '',
            membershipStatus: data.membershipStatus || 'ACTIVE',
            baptismStatus: data.baptismStatus || 'NOT_BAPTIZED',
            baptismDate: data.baptismDate ? data.baptismDate.split('T')[0] : '',
          });
          if (data.profilePictureUrl) {
            setProfilePictureUrl(data.profilePictureUrl);
          }
        } catch (error) {
          console.error('Failed to load member details', error);
          toast.error('Failed to load member details.', 'Error');
        }
      };
      fetchMember();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setProfilePictureUrl(previewUrl);

    setIsUploadingPhoto(true);
    try {
      const url = await membersApi.uploadProfilePicture(file);
      setProfilePictureUrl(url);
      toast.success('Photo uploaded successfully');
    } catch (error: any) {
      console.error('Failed to upload image', error);
      const msg = error?.response?.data?.message || 'Failed to upload photo';
      toast.error(msg);
      setProfilePictureUrl('');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input value so re-selecting same file works
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'This field is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'This field is required';
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'This field is required';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'This field is required';
    }

    if (!formData.address.trim()) {
      errors.address = 'This field is required';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fill in all required fields');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        membershipStatus: formData.membershipStatus,
        baptismStatus: formData.baptismStatus,
      };

      if (formData.middleName.trim()) payload.middleName = formData.middleName.trim();
      if (formData.email.trim()) payload.email = formData.email.trim();
      if (formData.gender) payload.gender = formData.gender;
      if (formData.baptismDate && formData.baptismStatus === 'BAPTIZED') {
        payload.baptismDate = new Date(formData.baptismDate).toISOString();
      }
      if (profilePictureUrl) payload.profilePictureUrl = profilePictureUrl;

      if (id) {
        await membersApi.updateMember(id, payload);
        toast.success('Member profile updated');
      } else {
        await membersApi.createMember(payload);
        toast.success('Member added successfully');
      }
      navigate('/members');
    } catch (error: any) {
      console.error('Failed to save member', error);
      const serverErrors = error?.response?.data?.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        setFormErrors(serverErrors);
      }
      const message = error?.response?.data?.message || 'Failed to save member';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="member-form-page">
      {/* ================= HEADER BAR ================= */}
      <div className="form-page-header">
        <div className="header-left">
          <Link to="/members" className="back-link">
            <IconArrowLeft size={16} stroke={2.2} />
            <span>Back to Members</span>
          </Link>
          <h1 className="page-title">{id ? 'Edit Member Profile' : 'Add New Member'}</h1>
          <p className="page-subtitle">
            {id ? 'Update the details for this church member.' : 'Fill in the information below to add a new member to the ministry directory.'}
          </p>
        </div>

        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/members')}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => handleSubmit()} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : id ? 'Update Member' : 'Save Member'}
          </button>
        </div>
      </div>

      {/* ================= MAIN FORM CARD ================= */}
      <form className="form-card-container" onSubmit={handleSubmit} noValidate>
        
        {/* SECTION 1: PROFILE PICTURE */}
        <div className="form-section-card">
          <div className="section-header">
            <div className="section-number">1</div>
            <div>
              <h2 className="section-title">Profile Picture</h2>
              <p className="section-desc">Upload a clear photo of the church member.</p>
            </div>
          </div>

          <div className="avatar-upload-row">
            <div className="avatar-preview-box">
              {profilePictureUrl ? (
                <img src={getMediaUrl(profilePictureUrl)} alt="Preview" />
              ) : (
                <div className="avatar-placeholder">
                  <IconUser size={40} stroke={1.5} />
                </div>
              )}
            </div>

            <div className="upload-controls">
              <div className="upload-btn-row">
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm upload-trigger-btn" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  <IconUpload size={16} stroke={2} />
                  <span>
                    {isUploadingPhoto ? 'Uploading...' : profilePictureUrl ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </button>
                {profilePictureUrl && (
                  <button 
                    type="button" 
                    className="btn btn-text danger btn-sm" 
                    onClick={() => setProfilePictureUrl('')}
                    disabled={isUploadingPhoto}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden-file-input" 
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
              />
              <span className="upload-hint">Supported formats: JPG, PNG, WEBP. Maximum file size: 5MB.</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: PERSONAL INFORMATION */}
        <div className="form-section-card">
          <div className="section-header">
            <div className="section-number">2</div>
            <div>
              <h2 className="section-title">Personal Information</h2>
              <p className="section-desc">Basic identification and personal demographics.</p>
            </div>
          </div>

          <div className="form-fields-grid grid-3-cols">
            <div className="field-group">
              <label className="field-label">First Name <span className="req">*</span></label>
              <input 
                type="text" 
                name="firstName" 
                placeholder="e.g. John"
                value={formData.firstName} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.firstName ? 'has-error' : ''}`}
                aria-invalid={!!formErrors.firstName}
              />
              {formErrors.firstName && (
                <div className="field-error-msg">
                  <IconAlertCircle size={14} />
                  <span>{formErrors.firstName}</span>
                </div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">Middle Name</label>
              <input 
                type="text" 
                name="middleName" 
                placeholder="e.g. Michael"
                value={formData.middleName} 
                onChange={handleInputChange} 
                className="form-input"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Last Name <span className="req">*</span></label>
              <input 
                type="text" 
                name="lastName" 
                placeholder="e.g. Doe"
                value={formData.lastName} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.lastName ? 'has-error' : ''}`}
                aria-invalid={!!formErrors.lastName}
              />
              {formErrors.lastName && (
                <div className="field-error-msg">
                  <IconAlertCircle size={14} />
                  <span>{formErrors.lastName}</span>
                </div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">Date of Birth <span className="req">*</span></label>
              <input 
                type="date" 
                name="dateOfBirth" 
                value={formData.dateOfBirth} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.dateOfBirth ? 'has-error' : ''}`}
                aria-invalid={!!formErrors.dateOfBirth}
              />
              {formErrors.dateOfBirth && (
                <div className="field-error-msg">
                  <IconAlertCircle size={14} />
                  <span>{formErrors.dateOfBirth}</span>
                </div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">Gender</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleInputChange} 
                className="form-select"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: CONTACT INFORMATION */}
        <div className="form-section-card">
          <div className="section-header">
            <div className="section-number">3</div>
            <div>
              <h2 className="section-title">Contact Information</h2>
              <p className="section-desc">Phone, email, and residential location.</p>
            </div>
          </div>

          <div className="form-fields-grid grid-2-cols">
            <div className="field-group">
              <label className="field-label">Contact Number <span className="req">*</span></label>
              <div className="input-with-icon">
                <IconPhone size={16} stroke={1.8} className="input-icon" />
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  placeholder="e.g. (0915) 440-3912"
                  value={formData.phoneNumber} 
                  onChange={handleInputChange} 
                  className={`form-input with-left-icon ${formErrors.phoneNumber ? 'has-error' : ''}`}
                  aria-invalid={!!formErrors.phoneNumber}
                />
              </div>
              {formErrors.phoneNumber && (
                <div className="field-error-msg">
                  <IconAlertCircle size={14} />
                  <span>{formErrors.phoneNumber}</span>
                </div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">Email Address</label>
              <div className="input-with-icon">
                <IconMail size={16} stroke={1.8} className="input-icon" />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="e.g. member@ministryhub.org"
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className={`form-input with-left-icon ${formErrors.email ? 'has-error' : ''}`}
                  aria-invalid={!!formErrors.email}
                />
              </div>
              {formErrors.email && (
                <div className="field-error-msg">
                  <IconAlertCircle size={14} />
                  <span>{formErrors.email}</span>
                </div>
              )}
            </div>

            <div className="field-group full-width">
              <label className="field-label">Residential Address <span className="req">*</span></label>
              <div className="input-with-icon">
                <IconMapPin size={16} stroke={1.8} className="input-icon" />
                <input 
                  type="text" 
                  name="address" 
                  placeholder="e.g. San Sebastian St, Bacolod City, Negros Occidental"
                  value={formData.address} 
                  onChange={handleInputChange} 
                  className={`form-input with-left-icon ${formErrors.address ? 'has-error' : ''}`}
                  aria-invalid={!!formErrors.address}
                />
              </div>
              {formErrors.address && (
                <div className="field-error-msg">
                  <IconAlertCircle size={14} />
                  <span>{formErrors.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: CHURCH MEMBERSHIP & SPIRITUAL JOURNEY */}
        <div className="form-section-card">
          <div className="section-header">
            <div className="section-number">4</div>
            <div>
              <h2 className="section-title">Church Membership & Milestones</h2>
              <p className="section-desc">Membership classification and baptism status.</p>
            </div>
          </div>

          <div className="form-fields-grid grid-3-cols">
            <div className="field-group">
              <label className="field-label">Membership Status</label>
              <select 
                name="membershipStatus" 
                value={formData.membershipStatus} 
                onChange={handleInputChange} 
                className="form-select"
              >
                <option value="ACTIVE">Active Member</option>
                <option value="INACTIVE">Inactive Member</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Baptism Status</label>
              <select 
                name="baptismStatus" 
                value={formData.baptismStatus} 
                onChange={handleInputChange} 
                className="form-select"
              >
                <option value="BAPTIZED">Baptized</option>
                <option value="NOT_BAPTIZED">Not Baptized</option>
              </select>
            </div>

            {formData.baptismStatus === 'BAPTIZED' && (
              <div className="field-group">
                <label className="field-label">Baptism Date</label>
                <input 
                  type="date" 
                  name="baptismDate" 
                  value={formData.baptismDate} 
                  onChange={handleInputChange} 
                  className="form-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* ================= FOOTER ACTIONS ================= */}
        <div className="form-footer-actions">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => navigate('/members')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary btn-save" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner"></span>
                <span>Saving member...</span>
              </>
            ) : (
              <>
                <IconCheck size={18} stroke={2.5} />
                <span>{id ? 'Update Member Profile' : 'Save Member'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
