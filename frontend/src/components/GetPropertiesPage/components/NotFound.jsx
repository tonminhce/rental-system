import { Alert, Button, Chip, Stack, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Stack spacing={2} justifyContent="flex-start" alignItems="flex-start">
      <Typography variant="h4" gutterBottom>
        Oops! Looks like there aren&apos;t any properties matching your search.
      </Typography>

      <Typography>Remove some filters to find more properties:</Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip label="Dormitory" onDelete={() => alert("Deleted")} />
        <Chip label="Dormitory" onDelete={() => alert("Deleted")} />
        <Chip label="Clear all filters" onDelete={() => alert("Deleted")} />
        <Chip label="Clear all filters" onDelete={() => alert("Deleted")} />
        <Chip label="Dormitory" onDelete={() => alert("Deleted")} />
        <Chip label="Dormitory" onDelete={() => alert("Deleted")} />
      </Stack>
      <Button variant="outlined" color="secondary">
        Reset all filters
      </Button>
    </Stack>
  );
}
