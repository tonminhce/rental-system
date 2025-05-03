import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Box
} from '@mui/material';
import { useChangePasswordMutation } from '@/redux/features/auth/authApiSlice';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const ChangePasswordDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [changePassword, { isLoading }] = useChangePasswordMutation();
  
  // Reset states when dialog opens or closes
  useEffect(() => {
    if (!open) {
      // Reset form and states when dialog closes
      setTimeout(() => {
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setError('');
        setSuccess('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }, 300); // Small delay to ensure animation completes
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async () => {
    // Basic validations
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError('New password cannot be the same as the current password');
      return;
    }

    try {
      const result = await changePassword(formData).unwrap();
      setSuccess(result.data.message || 'Password changed successfully');

      // Close after a delay or let user close manually
      setTimeout(() => {
        if (open) onClose();
      }, 2000);

    } catch (err) {
      const errorMessage = err.data?.message || 'An error occurred while changing password';
      setError(errorMessage);
    }
  };
  
  const handleClose = () => {
    onClose();
  };

  const toggleShowPassword = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TextField
          margin="dense"
          name="currentPassword"
          label="Current Password"
          type={showCurrentPassword ? "text" : "password"}
          fullWidth
          value={formData.currentPassword}
          onChange={handleChange}
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => toggleShowPassword('current')}
                  edge="end"
                >
                  {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          name="newPassword"
          label="New Password"
          type={showNewPassword ? "text" : "password"}
          fullWidth
          value={formData.newPassword}
          onChange={handleChange}
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => toggleShowPassword('new')}
                  edge="end"
                >
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          name="confirmPassword"
          label="Confirm New Password"
          type={showConfirmPassword ? "text" : "password"}
          fullWidth
          value={formData.confirmPassword}
          onChange={handleChange}
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => toggleShowPassword('confirm')}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={handleClose} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Change Password'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog; 