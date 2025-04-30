"use client";
import SearchBar from "@/components/SearchBar";
import { Box, Container } from "@mui/material";

export default function PropertyLayout({ children }) {
  return (
    <Container maxWidth="xl" sx={{ position: "relative", mt: 2 }}>
      <SearchBar />
      <Box height={60}></Box>

      {children}
    </Container>
  );
}
