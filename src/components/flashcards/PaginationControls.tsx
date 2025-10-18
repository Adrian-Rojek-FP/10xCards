import * as React from "react";
import { Button } from "@/components/ui/button";
import type { PaginationDto } from "@/types";

interface PaginationControlsProps {
  pagination: PaginationDto;
  onPageChange: (page: number) => void;
}

/**
 * Pagination controls component for navigating through flashcard pages.
 * Displays current page, total pages, and navigation buttons.
 */
export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  // Don't render if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handleFirst = () => {
    if (page !== 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (page !== totalPages) {
      onPageChange(totalPages);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if there are 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page and surrounding pages
      pages.push(1);

      if (page > 3) {
        pages.push("...");
      }

      // Show pages around current page
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {/* First page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleFirst}
        disabled={page === 1}
        aria-label="Pierwsza strona"
        className="hidden sm:flex"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
        </svg>
      </Button>

      {/* Previous page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={page === 1}
        aria-label="Poprzednia strona"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span className="ml-2 hidden sm:inline">Poprzednia</span>
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) =>
          pageNum === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum as number)}
              aria-label={`Strona ${pageNum}`}
              aria-current={pageNum === page ? "page" : undefined}
              className="min-w-[2.5rem]"
            >
              {pageNum}
            </Button>
          )
        )}
      </div>

      {/* Next page button */}
      <Button variant="outline" size="sm" onClick={handleNext} disabled={page === totalPages} aria-label="Następna strona">
        <span className="mr-2 hidden sm:inline">Następna</span>
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Button>

      {/* Last page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleLast}
        disabled={page === totalPages}
        aria-label="Ostatnia strona"
        className="hidden sm:flex"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
        </svg>
      </Button>
    </nav>
  );
}

