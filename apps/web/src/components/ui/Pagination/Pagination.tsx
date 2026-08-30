import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';
import { Select } from '@/components/ui';
import './Pagination.scss';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={`pagination-container ${className}`}>
      {/* Left: Summary Info */}
      <div className="pagination-info">
        <span>
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
          <strong>{totalItems}</strong> entries
        </span>
      </div>

      {/* Right: Page Navigation & Page Size Selector */}
      <div className="pagination-controls">
        {onPageSizeChange && (
          <div className="page-size-selector">
            <label htmlFor="page-size-select">Per page:</label>
            <Select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="page-size-select"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="pagination-buttons">
          {/* First Page */}
          <button
            type="button"
            className="btn-page-nav"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title="First page"
            aria-label="First page"
          >
            <IconChevronsLeft size={16} stroke={1.8} />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            className="btn-page-nav"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Previous page"
            aria-label="Previous page"
          >
            <IconChevronLeft size={16} stroke={1.8} />
          </button>

          {/* Numbered Page Buttons */}
          <div className="page-numbers">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="page-ellipsis">
                    &hellip;
                  </span>
                );
              }

              const pageNum = Number(page);
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  className={`btn-page-number ${isActive ? 'active' : ''}`}
                  onClick={() => onPageChange(pageNum)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            className="btn-page-nav"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Next page"
            aria-label="Next page"
          >
            <IconChevronRight size={16} stroke={1.8} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            className="btn-page-nav"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last page"
            aria-label="Last page"
          >
            <IconChevronsRight size={16} stroke={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
