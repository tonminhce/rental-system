import React, { useMemo } from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import { ChevronLeft, ChevronRight, FirstPage, LastPage } from '@mui/icons-material';

const SimplePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  size = 'medium',
  showPageNumbers = true,
  maxPageButtons = 5,
  sx
}) => {
  // A narrowing filter can leave the page index past the last page; clamp it so
  // the controls can't walk further away from the results.
  const page = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const handlePreviousPage = () => {
    if (!isFirst) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLast) {
      onPageChange(page + 1);
    }
  };

  const handleFirstPage = () => {
    onPageChange(1);
  };

  const handleLastPage = () => {
    onPageChange(totalPages);
  };

  const handlePageClick = (target) => {
    onPageChange(target);
  };

  // Generate array of page numbers to display
  const pageNumbers = useMemo(() => {
    // Don't show individual page buttons if there are too many pages
    if (!showPageNumbers || totalPages <= 1) return [];
    
    const halfMaxButtons = Math.floor(maxPageButtons / 2);
    let startPage = Math.max(1, page - halfMaxButtons);
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Adjust startPage if we're near the end
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [page, totalPages, maxPageButtons, showPageNumbers]);

  // Calculate sizes based on the prop
  const getIconSize = () => {
    switch(size) {
      case 'small': return { fontSize: 16 };
      case 'large': return { fontSize: 28 };
      default: return { fontSize: 20 };
    }
  };

  const getButtonSize = () => {
    switch(size) {
      case 'small': return { width: 28, height: 28, minWidth: 'unset', px: 0 };
      case 'large': return { width: 40, height: 40, minWidth: 'unset', px: 0 };
      default: return { width: 35, height: 35, minWidth: 'unset', px: 0 };
    }
  };

  const getTextSize = () => {
    switch(size) {
      case 'small': return { fontSize: '0.75rem' };
      case 'large': return { fontSize: '1rem' };
      default: return { fontSize: '0.875rem' };
    }
  };

  const navColor = (atEdge) => (atEdge ? 'var(--rt-faint)' : 'var(--rt-brand)');

  // Simple mode with just prev/next buttons
  if (pageNumbers.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="100%"
        role="navigation"
        aria-label="Pagination"
        sx={sx}
      >
        <IconButton
          onClick={handlePreviousPage}
          disabled={isFirst}
          aria-label="Previous page"
          sx={{
            ...getButtonSize(),
            color: navColor(isFirst),
          }}
        >
          <ChevronLeft sx={getIconSize()} />
        </IconButton>

        {showPageNumbers && (
          <Typography variant="body2" sx={{ mx: 1, ...getTextSize() }}>
            {page} / {totalPages}
          </Typography>
        )}

        <IconButton
          onClick={handleNextPage}
          disabled={isLast}
          aria-label="Next page"
          sx={{
            ...getButtonSize(),
            color: navColor(isLast),
          }}
        >
          <ChevronRight sx={getIconSize()} />
        </IconButton>
      </Box>
    );
  }

  // Enhanced mode with page numbers
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      width="100%"
      role="navigation"
      aria-label="Pagination"
      sx={sx}
    >
      {/* First page button */}
      {totalPages > maxPageButtons && (
        <IconButton
          onClick={handleFirstPage}
          disabled={isFirst}
          aria-label="First page"
          sx={{
            ...getButtonSize(),
            mr: 0.5,
            color: navColor(isFirst),
          }}
        >
          <FirstPage sx={getIconSize()} />
        </IconButton>
      )}

      {/* Previous button */}
      <IconButton
        onClick={handlePreviousPage}
        disabled={isFirst}
        aria-label="Previous page"
        sx={{
          ...getButtonSize(),
          color: navColor(isFirst),
        }}
      >
        <ChevronLeft sx={getIconSize()} />
      </IconButton>

      {/* Page number buttons */}
      {pageNumbers.map((num) => {
        const isCurrent = num === page;
        return (
          <Button
            key={num}
            onClick={() => handlePageClick(num)}
            variant={isCurrent ? 'contained' : 'text'}
            size="small"
            aria-label={`Page ${num}`}
            aria-current={isCurrent ? 'page' : undefined}
            sx={{
              ...getButtonSize(),
              mx: 0.5,
              minWidth: size === 'small' ? '24px' : '32px',
              backgroundColor: isCurrent ? 'var(--rt-brand)' : 'transparent',
              color: isCurrent ? 'var(--rt-on-brand)' : 'var(--rt-brand)',
              fontWeight: isCurrent ? 700 : 400,
              '&:hover': {
                backgroundColor: isCurrent
                  ? 'var(--rt-brand-hover)'
                  : 'rgba(var(--rt-brand-rgb), 0.06)',
              },
              fontSize: getTextSize().fontSize,
            }}
          >
            {num}
          </Button>
        );
      })}

      {/* Next button */}
      <IconButton
        onClick={handleNextPage}
        disabled={isLast}
        aria-label="Next page"
        sx={{
          ...getButtonSize(),
          color: navColor(isLast),
        }}
      >
        <ChevronRight sx={getIconSize()} />
      </IconButton>

      {/* Last page button */}
      {totalPages > maxPageButtons && (
        <IconButton
          onClick={handleLastPage}
          disabled={isLast}
          aria-label="Last page"
          sx={{
            ...getButtonSize(),
            ml: 0.5,
            color: navColor(isLast),
          }}
        >
          <LastPage sx={getIconSize()} />
        </IconButton>
      )}
    </Box>
  );
};

export default SimplePagination; 