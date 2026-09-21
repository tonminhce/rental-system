import NextLink from "next/link";
import { Box, Card, CardContent, CardActions, Typography, Grid, Chip, Button, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ isSuggestion }) => ({
  border: isSuggestion ? '1.5px solid #234c3e' : '1px solid #e2e6dc',
  borderRadius: '12px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease',
  boxShadow: '0 2px 8px rgba(35, 76, 62, 0.04)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 14px 30px rgba(35, 76, 62, 0.12)',
    borderColor: '#234c3e',
  }
}));

const InfoItem = ({ label, value }) => (
  <Box>
    <Typography variant="caption" sx={{ color: '#7a8275', fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase', fontSize: '10px' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, color: '#25382b', mt: 0.25 }}>
      {value || '—'}
    </Typography>
  </Box>
);

const formatTime = (timeString) => {
  if (!timeString) return '';
  if (timeString.includes('AM') || timeString.includes('PM')) return timeString;
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  } catch {
    return timeString;
  }
};

export default function RoommateCard({ profile, isSuggestion = false }) {
  if (!profile) return null;
  const name = profile.user?.name || `Roommate #${profile.id}`;
  const initial = (name.replace(/[^a-zA-Z0-9]/g, '')[0] || 'R').toUpperCase();

  return (
    <StyledCard isSuggestion={isSuggestion}>
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar 
              sx={{ 
                bgcolor: isSuggestion ? '#234c3e' : '#496b56', 
                color: '#ffffff',
                width: 42, 
                height: 42, 
                fontSize: '16px', 
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(35, 76, 62, 0.2)',
                transition: 'transform 0.25s ease',
                '&:hover': { transform: 'scale(1.08)' }
              }}
            >
              {initial}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, color: '#1f2e23', lineHeight: 1.2 }}>
                {name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#73806e', fontSize: '11px' }}>
                {profile.age} yrs · {profile.gender}
              </Typography>
            </Box>
          </Box>

          {isSuggestion && (
            <Chip 
              label={`Score ${profile.totalScore}/10`} 
              size="small"
              sx={{ 
                backgroundColor: '#edf5ee', 
                color: '#234c3e', 
                fontWeight: 700,
                fontSize: '11px',
                border: '1px solid #cce0cf',
              }}
            />
          )}
        </Box>

        <Box sx={{ bgcolor: '#fbfbf9', p: 1.5, borderRadius: '8px', border: '1px solid #eef1ea', mb: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <InfoItem label="Lifestyle" value={profile.lifestyle} />
            </Grid>
            <Grid item xs={6}>
              <InfoItem label="Personality" value={profile.personality} />
            </Grid>
            <Grid item xs={6}>
              <InfoItem label="Wake Up" value={formatTime(profile.wakeUpTime)} />
            </Grid>
            <Grid item xs={6}>
              <InfoItem label="Bed Time" value={formatTime(profile.bedTime)} />
            </Grid>
          </Grid>
        </Box>

        <Box display="flex" gap={1.5} flexWrap="wrap">
          <Chip 
            label={profile.pets ? "🐾 Pet friendly" : "No pets"} 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '11px', color: '#556653', borderColor: '#d7ded1' }}
          />
          <Chip 
            label={profile.smoking ? "Smoking" : "🚭 Non-smoking"} 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '11px', color: '#556653', borderColor: '#d7ded1' }}
          />
        </Box>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0, borderTop: '1px solid #f0f3eb' }}>
        <Button 
          component={NextLink}
          href={`/roommate/${profile.id}`}
          fullWidth
          sx={{ 
            color: '#234c3e',
            fontWeight: 600,
            fontSize: '12px',
            textTransform: 'none',
            py: 0.8,
            borderRadius: '6px',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': { bgcolor: '#edf2ea', color: '#163329', transform: 'translateX(3px)' },
          }}
        >
          View Compatibility & Contact →
        </Button>
      </CardActions>
    </StyledCard>
  );
} 