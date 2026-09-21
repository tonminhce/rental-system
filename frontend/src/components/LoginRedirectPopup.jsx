import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Stack,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function LoginRedirectPopup({ open, message, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 3,
          padding: 2,
          border: "1px solid var(--rt-border)",
          boxShadow: "0 16px 40px rgba(var(--rt-brand-rgb), 0.16)",
          minWidth: 320,
        },
      }}
    >
      <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.2}>
          <LockOutlinedIcon sx={{ color: "var(--rt-brand)" }} />
          {"Authentication Required"}
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <DialogContentText id="alert-dialog-description" sx={{ color: "text.secondary" }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 1 }}>
        <Button onClick={onClose} variant="contained" autoFocus sx={{ minWidth: 100 }}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
