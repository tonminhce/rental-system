import NextLink from 'next/link';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Avatar,
  Stack,
} from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MessageIcon from '@mui/icons-material/Message';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LockOutlined from '@mui/icons-material/LockOutlined';
import formatTime from '@/utils/formatTime';

const InfoItem = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography
      variant="caption"
      sx={{
        color: 'var(--rt-muted)',
        fontWeight: 500,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        fontSize: '10px',
      }}
    >
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--rt-ink)', mt: 0.25 }}>
      {value || '—'}
    </Typography>
  </Box>
);

export default function ProfileDetail({ profile, isLoading, error }) {
  const router = useRouter();
  const [openContact, setOpenContact] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const requiresSignIn = error?.status === 401 || error?.status === 403;

  const notify = (msg, severity = "success") => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  /* There is no messaging endpoint on the backend, so this copies the draft for
     the visitor to paste into the listed email or phone number. */
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      notify("Message copied to your clipboard. Paste it to the contact above.");
    } catch {
      notify("Couldn’t copy your message. Select and copy it manually instead.", "warning");
    }
    setOpenContact(false);
    setMessageText("");
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box className="animate-fade-in" sx={{ textAlign: 'center', py: 8, maxWidth: 460, mx: 'auto' }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--rt-radius-md)',
            bgcolor: 'var(--rt-surface-tint)',
            color: 'var(--rt-brand)',
          }}
        >
          {requiresSignIn ? <LockOutlined /> : <MessageIcon />}
        </Box>
        <p className="eyebrow" style={{ justifyContent: 'center' }}>
          {requiresSignIn ? 'Sign in required' : 'Not available'}
        </p>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mt: 1.5, color: 'var(--rt-ink)' }}>
          {requiresSignIn ? 'Sign in to view this profile' : 'We couldn’t load this profile'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--rt-muted)', mt: 1.5 }}>
          {requiresSignIn
            ? 'Contact details are only shared with signed-in members.'
            : 'The profile may have been removed, or the link is out of date.'}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 4 }}>
          {requiresSignIn ? (
            <>
              <Button component={NextLink} href="/login" variant="contained">
                Sign in
              </Button>
              <Button component={NextLink} href="/roommate" variant="outlined" color="inherit">
                Back to profiles
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => router.push("/roommate")}>
              Back to Roommate List
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  const name = profile.user?.name || `Roommate #${profile.id}`;
  const initial = (name.replace(/[^a-zA-Z0-9]/g, "")[0] || "R").toUpperCase();

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Roommate Profile</Typography>
        <Button 
          variant="outlined" 
          color="inherit"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Box>

      <Card className="animate-fade-in-up">
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
            <Avatar
              sx={{
                bgcolor: 'var(--rt-brand-muted)',
                color: 'var(--rt-on-brand)',
                width: 46,
                height: 46,
                fontSize: '17px',
                fontWeight: 700,
              }}
            >
              {initial}
            </Avatar>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'var(--rt-ink)' }}>
              {name}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <InfoItem label="Age" value={profile.age} />
                </Grid>
                <Grid item xs={6}>
                  <InfoItem label="Gender" value={profile.gender} />
                </Grid>
              </Grid>

              <InfoItem label="Personality" value={profile.personality} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Lifestyle Preferences</Typography>
              
              <InfoItem label="Cleanliness" value={profile.lifestyle} />
              <InfoItem label="Pets" value={profile.pets ? "Pet-friendly" : "No pets"} />
              <InfoItem label="Smoking" value={profile.smoking ? "Smoker" : "Non-smoker"} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>Schedule</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <InfoItem label="Wake Up Time" value={formatTime(profile.wakeUpTime)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoItem label="Bed Time" value={formatTime(profile.bedTime)} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<MessageIcon />}
              onClick={() => setOpenContact(true)}
            >
              Contact This Roommate
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Contact Roommate Dialog */}
      <Dialog
        open={openContact}
        onClose={() => setOpenContact(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="roommate-contact-title"
      >
        <DialogTitle id="roommate-contact-title" sx={{ fontWeight: 600 }}>
          Contact {name}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {profile.user?.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon sx={{ color: 'var(--rt-muted)' }} />
                <Typography
                  component={NextLink}
                  href={`mailto:${profile.user.email}`}
                  variant="body2"
                  sx={{ color: 'var(--rt-brand)', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {profile.user.email}
                </Typography>
              </Box>
            )}
            {profile.user?.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon sx={{ color: 'var(--rt-muted)' }} />
                <Typography
                  component={NextLink}
                  href={`tel:${profile.user.phone}`}
                  variant="body2"
                  sx={{ color: 'var(--rt-brand)', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {profile.user.phone}
                </Typography>
              </Box>
            )}
            {!profile.user?.email && !profile.user?.phone && (
              <Typography variant="body2" sx={{ color: 'var(--rt-muted)' }}>
                No contact details were listed for this profile.
              </Typography>
            )}
            <TextField
              label="Your message or introduction"
              placeholder="Hi! I'm interested in teaming up as roommates. I have a similar schedule..."
              multiline
              rows={4}
              fullWidth
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenContact(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCopyMessage}
            variant="contained"
            disabled={!messageText.trim()}
          >
            Copy message
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}