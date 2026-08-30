import React from 'react';
import { PulseLoader } from 'react-spinners';
import './Skeleton.scss';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  className = '',
  style,
}: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    ...style,
  };

  return <div className={`skeleton ${className}`} style={customStyle} />;
}

export function PageLoader({ text = 'Loading MinistryHub...' }: { text?: string }) {
  return (
    <div className="page-loader-container">
      <PulseLoader color="var(--primary-color)" size={12} margin={4} />
      <span className="loader-text" style={{ marginTop: '16px' }}>{text}</span>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-table-wrap">
      <div className="skeleton-table-header">
        <Skeleton width="40px" height="18px" />
        <Skeleton width="180px" height="18px" />
        <Skeleton width="120px" height="18px" />
        <Skeleton width="140px" height="18px" />
        <Skeleton width="100px" height="18px" />
        <Skeleton width="80px" height="18px" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-table-row">
          <Skeleton width="20px" height="20px" borderRadius="4px" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <Skeleton width="38px" height="38px" borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <Skeleton width="60%" height="15px" />
              <Skeleton width="40%" height="12px" />
            </div>
          </div>
          <Skeleton width="100px" height="24px" borderRadius="12px" />
          <Skeleton width="110px" height="24px" borderRadius="12px" />
          <Skeleton width="90px" height="14px" />
          <Skeleton width="60px" height="30px" borderRadius="6px" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="skeleton-cards-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-member-card">
          <div className="skeleton-card-top">
            <Skeleton width="64px" height="64px" borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
              <Skeleton width="70%" height="18px" />
              <Skeleton width="45%" height="13px" />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <Skeleton width="65px" height="20px" borderRadius="10px" />
              <Skeleton width="75px" height="20px" borderRadius="10px" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderTop: '1px solid #f1f5f9' }}>
            <Skeleton width="90%" height="13px" />
            <Skeleton width="75%" height="13px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="skeleton-profile-container">
      <div className="skeleton-profile-banner">
        <Skeleton width="90px" height="90px" borderRadius="50%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <Skeleton width="240px" height="26px" />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Skeleton width="80px" height="22px" borderRadius="12px" />
            <Skeleton width="100px" height="22px" borderRadius="12px" />
          </div>
        </div>
      </div>

      <div className="skeleton-grid-2">
        <div className="skeleton-card">
          <Skeleton width="160px" height="20px" />
          <Skeleton width="100%" height="14px" />
          <Skeleton width="85%" height="14px" />
          <Skeleton width="90%" height="14px" />
        </div>
        <div className="skeleton-card">
          <Skeleton width="160px" height="20px" />
          <Skeleton width="100%" height="14px" />
          <Skeleton width="80%" height="14px" />
          <Skeleton width="75%" height="14px" />
        </div>
      </div>
    </div>
  );
}
