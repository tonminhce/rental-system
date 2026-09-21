import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
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
  Stack,
} from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MessageIcon from '@mui/icons-material/Message';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const InfoItem = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography color="text.secondary" variant="body2">{label}</Typography>
    <Typography variant="body1" fontWeight={500}>{value}</Typography>
  </Box>
);

// Format time from "HH:MM:SS" to "HH:MM AM/PM" format
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  // Handle case where the time might already be formatted
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  try {
    // Parse the time string 
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    
    // Convert to 12-hour format
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${formattedHour}:${minutes} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original if parsing fails
  }
};

export default function ProfileDetail({ profile, isLoading, error }) {
  const router = useRouter();
  const [openContact, setOpenContact] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const handleSendMessage = () => {
    setOpenContact(false);
    setMessageText("");
    setSnackbarMsg("Message sent to roommate! They will be notified.");
    setSnackbarOpen(true);
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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Failed to load roommate profile
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {error?.data?.message || "The profile you're looking for might not exist or there was an error loading it."}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push("/roommate")}
        >
          Back to Roommate List
        </Button>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Roommate Profile</Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Box>

      <Card className="animate-fade-in-up">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              Roommate #{profile.id}
            </Typography>
            <Chip 
              label={`Compatibility Score: ${profile.totalScore}/10`}
              color="primary"
              variant="outlined"
            />
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
      <Dialog open={openContact} onClose={() => setOpenContact(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>
          Contact Roommate #{profile.id}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {profile.User?.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon color="action" />
                <Typography variant="body2">{profile.User.email}</Typography>
              </Box>
            )}
            {profile.User?.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon color="action" />
                <Typography variant="body2">{profile.User.phone}</Typography>
              </Box>
            )}
            <TextField
              label="Your message or introduction"
              placeholder="Hi! I'm interested in teaming up as roommates. I have a similar schedule..."
              multiline
              rows={4}
              fullWidth
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenContact(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage} 
            variant="contained" 
            disabled={!messageText.trim()}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}