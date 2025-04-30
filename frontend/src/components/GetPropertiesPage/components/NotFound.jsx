import { Stack, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Stack spacing={2} justifyContent="flex-start" alignItems="flex-start">
      <Typography variant="h4" gutterBottom>
        Oops! Looks like there aren&apos;t any properties matching your search.
      </Typography>

      <Typography>Remove some filters to find more properties.</Typography>

    </Stack>
  );
}
