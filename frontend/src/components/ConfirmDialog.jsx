import { HighlightOff } from "@mui/icons-material";
import { Button, Dialog, Stack, Typography } from "@mui/material";

const ConfirmDialog = ({ open, title, message, postTitle, onConfirm, onCancel }) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <Stack direction="column" p={3} alignItems="center">
        <HighlightOff sx={{ fontSize: 40 }} color="error" />
        <Typography variant="h5" color="error" gutterBottom>
          Are you sure you want to delete post?
        </Typography>

        <Typography variant="body1">{postTitle}</Typography>

        <Stack direction="row" spacing={2} mt={2} justifyContent="flex-end">
          <Button onClick={onCancel} color="inherit" variant="contained">
            Cancel
          </Button>
          <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
};

export default ConfirmDialog;
