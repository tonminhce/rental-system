"use client";

import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Box, Container } from "@mui/material";
import FullscreenLoading from "@/components/FullscreenLoading";

export default function RoommateLayout({ children }) {
  const { isLoading } = useProtectedRoute();

  if (isLoading) {
    return <FullscreenLoading />;
  }

  return (
    <Box>
      <Container maxWidth="xl" sx={{ py: 3, mt: 8 }}>
        {children}
      </Container>
    </Box>
  );
} 