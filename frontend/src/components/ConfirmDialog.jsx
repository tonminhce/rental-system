import { HighlightOff } from "@mui/icons-material";
import { Button, Dialog, Stack, Typography } from "@mui/material";

const ConfirmDialog = ({ open, title, message, postTitle, onConfirm, onCancel }) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      role="alertdialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={message ? "confirm-dialog-description" : undefined}
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 2,
          border: "1px solid var(--rt-border)",
          boxShadow: "0 16px 40px rgba(var(--rt-brand-rgb), 0.16)",
        },
      }}
    >
      <Stack direction="column" p={2} alignItems="center" textAlign="center">
        <HighlightOff sx={{ fontSize: 48, color: "var(--rt-danger)", mb: 1 }} />
        <Typography
          id="confirm-dialog-title"
          variant="h6"
          sx={{ fontWeight: 600, color: "var(--rt-ink)", mb: 1 }}
        >
          {title || "Are you sure you want to delete this listing?"}
        </Typography>

        {message && (
          <Typography id="confirm-dialog-description" variant="body2" sx={{ color: "var(--rt-muted)", mb: 2 }}>
            {message}
          </Typography>
        )}

        {postTitle && (
          <Typography variant="body2" sx={{ color: "var(--rt-muted)", mb: 2 }}>
            {postTitle}
          </Typography>
        )}

        <Stack direction="row" spacing={2} mt={1} justifyContent="center" width="100%">
          <Button onClick={onCancel} variant="outlined" sx={{ flex: 1 }} autoFocus>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            sx={{ flex: 1, bgcolor: "var(--rt-danger)", "&:hover": { bgcolor: "var(--rt-danger-hover)" } }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
};

export default ConfirmDialog;
