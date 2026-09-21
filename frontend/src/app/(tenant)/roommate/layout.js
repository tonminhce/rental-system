"use client";

import { Box, Container } from "@mui/material";

export default function RoommateLayout({ children }) {
  return (
    <Box>
      <Container component="main" id="main-content" maxWidth="xl" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
