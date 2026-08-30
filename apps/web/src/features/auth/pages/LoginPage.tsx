import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/components/AuthProvider';
import { api } from '@/lib/api';
import { encryptPayload } from '@ministryhub/utils';
import { IconAlertTriangle, IconAlertCircle } from '@tabler/icons-react';
import './LoginPage.scss';

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const isSessionExpired = searchParams.get('expired') === 'true';

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (isSessionExpired) {
      setErrorMessage('Your session has expired. Please sign in again to continue.');
    }
  }, [isSessionExpired]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      // AES Encrypt credentials before transmitting over the network
      const encryptedPayload = encryptPayload({
        email: email.trim(),
        password,
      });

      const response = await api.post('/auth/login', { payload: encryptedPayload });
      login(response.data.accessToken, response.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const respData = err?.response?.data;
      if (err?.response?.status === 429) {
        setErrorMessage(respData?.message || 'Too many login attempts. Please wait 1 minute.');
      } else if (respData?.message) {
        setErrorMessage(respData.message);
      } else {
        setErrorMessage('The email or password you entered is incorrect.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-wrapper">
          <img src="/logo.svg" alt="MINISTRY HUB Logo" />
        </div>

        <div className="login-headings">
          <h1>Welcome back</h1>
          <p>Sign in to continue to Ministry Hub.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <div className={`error-alert ${isSessionExpired ? 'session-expired-alert' : ''}`} role="alert">
              <div className="alert-icon">
                {isSessionExpired ? <IconAlertTriangle size={18} /> : <IconAlertCircle size={18} />}
              </div>
              <div className="alert-text">
                <strong>{isSessionExpired ? 'Session Expired' : 'Unable to sign in'}</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors(p => ({ ...p, email: undefined }));
                setErrorMessage(null);
              }}
              placeholder="admin@ministryhub.com"
              aria-invalid={!!fieldErrors.email}
              disabled={isLoading}
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors(p => ({ ...p, password: undefined }));
                  setErrorMessage(null);
                }}
                placeholder="••••••••"
                aria-invalid={!!fieldErrors.password}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              <div className="submit-btn-spinner-wrap">
                <span className="btn-spinner"></span>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>

      <footer className="login-footer">
        © 2026 Ministry Hub · All rights reserved
      </footer>
    </div>
  );
}
