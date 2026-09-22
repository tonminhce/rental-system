import { Stack, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Stack spacing={2} justifyContent="flex-start" alignItems="flex-start">
      <Typography variant="h6" gutterBottom>
        No homes match these filters.
      </Typography>

      <Typography>Remove some filters to find more properties.</Typography>
    </Stack>
  );
}
