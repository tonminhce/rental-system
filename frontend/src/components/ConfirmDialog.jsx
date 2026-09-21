import { HighlightOff } from "@mui/icons-material";
import { Button, Dialog, Stack, Typography } from "@mui/material";

const ConfirmDialog = ({ open, title, message, postTitle, onConfirm, onCancel }) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 2,
          border: "1px solid #e8ece1",
          boxShadow: "0 16px 40px rgba(35, 76, 62, 0.16)",
        },
      }}
    >
      <Stack direction="column" p={2} alignItems="center" textAlign="center">
        <HighlightOff sx={{ fontSize: 48, color: "#c94a29", mb: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#26372d", mb: 1 }}>
          {title || "Are you sure you want to delete this listing?"}
        </Typography>

        {postTitle && (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            {postTitle}
          </Typography>
        )}

        <Stack direction="row" spacing={2} mt={1} justifyContent="center" width="100%">
          <Button onClick={onCancel} variant="outlined" sx={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            sx={{ flex: 1, bgcolor: "#c94a29", "&:hover": { bgcolor: "#a83b1e" } }}
            autoFocus
          >
            Delete
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
};

export default ConfirmDialog;
