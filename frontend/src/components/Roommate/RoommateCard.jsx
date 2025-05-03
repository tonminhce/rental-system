import NextLink from "next/link";
import { Box, Card, CardContent, CardActions, Typography, Grid, Chip, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { grey, blue, orange } from '@mui/material/colors';

const StyledCard = styled(Card)(({ theme, isSuggestion }) => ({
  border: isSuggestion ? `2px solid ${blue[400]}` : `1px solid ${grey[300]}`,
  borderRadius: theme.spacing(1),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  }
}));

const InfoItem = ({ label, value }) => (
  <Box>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>{value}</Typography>
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

export default function RoommateCard({ profile, isSuggestion = false }) {
  if (!profile) return null;
  
  return (
    <StyledCard isSuggestion={isSuggestion}>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h3" fontWeight="bold">
            Roommate #{profile.id}
          </Typography>
          {isSuggestion && (
            <Chip 
              label={`Match Score: ${profile.totalScore}/10`} 
              size="small"
              sx={{ 
                backgroundColor: blue[50], 
                color: blue[800], 
                fontWeight: 500 
              }}
            />
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={6}>
            <InfoItem label="Age" value={profile.age} />
          </Grid>
          <Grid item xs={6}>
            <InfoItem label="Gender" value={profile.gender} />
          </Grid>
          
          <Grid item xs={6}>
            <InfoItem label="Lifestyle" value={profile.lifestyle} />
          </Grid>
          <Grid item xs={6}>
            <InfoItem label="Personality" value={profile.personality} />
          </Grid>
          
          <Grid item xs={6}>
            <InfoItem label="Wake Up Time" value={formatTime(profile.wakeUpTime)} />
          </Grid>
          <Grid item xs={6}>
            <InfoItem label="Bed Time" value={formatTime(profile.bedTime)} />
          </Grid>
        </Grid>

        <Box display="flex" gap={4} mt={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">Pets:</Typography>
            <Typography variant="body2" fontWeight={500}>{profile.pets ? "Yes" : "No"}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">Smoking:</Typography>
            <Typography variant="body2" fontWeight={500}>{profile.smoking ? "Yes" : "No"}</Typography>
          </Box>
        </Box>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          component={NextLink}
          href={`/roommate/${profile.id}`}
          sx={{ 
            color: orange[600],
            '&:hover': { bgcolor: 'transparent', color: orange[800] },
            textTransform: 'none',
          }}
        >
          View Details
        </Button>
      </CardActions>
    </StyledCard>
  );
} 