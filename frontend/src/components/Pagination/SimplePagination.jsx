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
  sx = {}
}) => {
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirstPage = () => {
    onPageChange(1);
  };

  const handleLastPage = () => {
    onPageChange(totalPages);
  };

  const handlePageClick = (page) => {
    onPageChange(page);
  };

  // Generate array of page numbers to display
  const pageNumbers = useMemo(() => {
    // Don't show individual page buttons if there are too many pages
    if (!showPageNumbers || totalPages <= 1) return [];
    
    const halfMaxButtons = Math.floor(maxPageButtons / 2);
    let startPage = Math.max(1, currentPage - halfMaxButtons);
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Adjust startPage if we're near the end
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [currentPage, totalPages, maxPageButtons, showPageNumbers]);

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

  // Simple mode with just prev/next buttons
  if (pageNumbers.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="100%"
        {...sx}
      >
        <IconButton
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          sx={{
            ...getButtonSize(),
            color: currentPage === 1 ? 'text.disabled' : 'primary.main',
          }}
        >
          <ChevronLeft sx={getIconSize()} />
        </IconButton>

        {showPageNumbers && (
          <Typography variant="body2" sx={{ mx: 1, ...getTextSize() }}>
            {currentPage} / {totalPages}
          </Typography>
        )}

        <IconButton
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          sx={{
            ...getButtonSize(),
            color: currentPage === totalPages ? 'text.disabled' : 'primary.main',
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
      {...sx}
    >
      {/* First page button */}
      {totalPages > maxPageButtons && (
        <IconButton
          onClick={handleFirstPage}
          disabled={currentPage === 1}
          sx={{
            ...getButtonSize(),
            mr: 0.5,
            color: currentPage === 1 ? 'text.disabled' : 'primary.main',
          }}
        >
          <FirstPage sx={getIconSize()} />
        </IconButton>
      )}

      {/* Previous button */}
      <IconButton
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        sx={{
          ...getButtonSize(),
          color: currentPage === 1 ? 'text.disabled' : 'primary.main',
        }}
      >
        <ChevronLeft sx={getIconSize()} />
      </IconButton>

      {/* Page number buttons */}
      {pageNumbers.map(page => (
        <Button
          key={page}
          onClick={() => handlePageClick(page)}
          variant={page === currentPage ? 'contained' : 'text'}
          size="small"
          sx={{
            ...getButtonSize(),
            mx: 0.5,
            minWidth: size === 'small' ? '24px' : '32px',
            backgroundColor: page === currentPage ? 'primary.main' : 'transparent',
            color: page === currentPage ? 'white' : 'primary.main',
            fontWeight: page === currentPage ? 'bold' : 'normal',
            '&:hover': {
              backgroundColor: page === currentPage ? 'primary.dark' : 'rgba(25, 118, 210, 0.04)',
            },
            fontSize: getTextSize().fontSize,
          }}
        >
          {page}
        </Button>
      ))}

      {/* Next button */}
      <IconButton
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        sx={{
          ...getButtonSize(),
          color: currentPage === totalPages ? 'text.disabled' : 'primary.main',
        }}
      >
        <ChevronRight sx={getIconSize()} />
      </IconButton>

      {/* Last page button */}
      {totalPages > maxPageButtons && (
        <IconButton
          onClick={handleLastPage}
          disabled={currentPage === totalPages}
          sx={{
            ...getButtonSize(),
            ml: 0.5,
            color: currentPage === totalPages ? 'text.disabled' : 'primary.main',
          }}
        >
          <LastPage sx={getIconSize()} />
        </IconButton>
      )}
    </Box>
  );
};

export default SimplePagination; 