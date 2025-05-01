import { Box, Grid, Typography, Alert } from '@mui/material';
import RoommateCard from './RoommateCard';

export default function RoommateList({ profiles, isError, emptyMessage }) {
  if (isError) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        Failed to load roommate profiles. Please try again later.
      </Alert>
    );
  }

  if (!profiles?.length) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center',
          p: 3,
          border: 1,
          borderColor: 'grey.300',
          borderRadius: 1,
          bgcolor: 'grey.50'
        }}
      >
        <Typography>{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {profiles.map((profile) => (
        <Grid item xs={12} sm={6} md={4} key={profile.id}>
          <RoommateCard 
            profile={profile} 
            isSuggestion={emptyMessage.includes('suggestion')}
          />
        </Grid>
      ))}
    </Grid>
  );
} 