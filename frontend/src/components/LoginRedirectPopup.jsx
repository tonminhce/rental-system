import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function LoginRedirectPopup({ open, message, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{
        style: {
          borderRadius: "8px",
          padding: "16px",
        },
      }}
    >
      <DialogTitle variant="error" id="alert-dialog-title">
        <Stack direction="row" alignItems="center" gap={1}>
          <ErrorOutlineIcon fontSize="large" color="primary" />
          {"Authentication Required"}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
