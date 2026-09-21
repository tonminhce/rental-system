import { Box, Grid, Typography, Alert } from '@mui/material';
import RoommateCard from './RoommateCard';

export default function RoommateList({ profiles, isError, emptyMessage }) {
  if (isError) {
    return (
      <Alert severity="warning" sx={{ my: 2, borderRadius: 2, bgcolor: '#fef7e0', color: '#7a5a00' }}>
        Unable to load profiles right now. Please try again in a moment.
      </Alert>
    );
  }

  if (!profiles?.length) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center',
          py: 8,
          px: 3,
          border: '1px dashed #d0d7c7',
          borderRadius: 3,
          bgcolor: '#faf9f5',
          animation: 'fadeInUp 0.4s ease-out both',
        }}
      >
        <Typography variant="subtitle1" sx={{ color: '#234c3e', mb: 1, fontWeight: 600 }}>
          {emptyMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Find your ideal roommate with shared schedules, lifestyles, and habits.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {profiles.map((profile, index) => (
        <Grid 
          item 
          xs={12} 
          sm={6} 
          md={4} 
          key={profile.id}
          sx={{
            animation: 'fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: `${Math.min(index * 60, 400)}ms`,
          }}
        >
          <RoommateCard 
            profile={profile} 
            isSuggestion={Boolean(emptyMessage?.includes('suggestion'))}
          />
        </Grid>
      ))}
    </Grid>
  );
} 