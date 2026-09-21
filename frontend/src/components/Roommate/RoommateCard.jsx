import NextLink from "next/link";
import { Box, Card, CardContent, CardActions, Typography, Grid, Chip, Button, Avatar } from "@mui/material";
import { styled } from "@mui/material/styles";
import PetsOutlined from "@mui/icons-material/PetsOutlined";
import SmokeFreeOutlined from "@mui/icons-material/SmokeFreeOutlined";
import SmokingRoomsOutlined from "@mui/icons-material/SmokingRoomsOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import formatTime from "@/utils/formatTime";

const StyledCard = styled(Card, { shouldForwardProp: (prop) => prop !== "isSuggestion" })(({ isSuggestion }) => ({
  border: isSuggestion ? "1.5px solid var(--rt-brand)" : "1px solid var(--rt-border)",
  borderRadius: "var(--rt-radius-md)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "var(--rt-paper)",
  transition:
    "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease",
  boxShadow: "0 2px 8px rgba(var(--rt-brand-rgb), 0.04)",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 14px 30px rgba(var(--rt-brand-rgb), 0.12)",
    borderColor: "var(--rt-brand)",
  },
}));

const traitChipSx = {
  fontSize: "11px",
  color: "var(--rt-brand-muted)",
  borderColor: "var(--rt-border-strong)",
  "& .MuiChip-icon": { color: "inherit", fontSize: 14 },
};

const InfoItem = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{ color: "var(--rt-muted)", fontWeight: 500, letterSpacing: "0.3px", textTransform: "uppercase", fontSize: "10px" }}
    >
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--rt-ink)", mt: 0.25 }}>
      {value || "—"}
    </Typography>
  </Box>
);

export default function RoommateCard({ profile, isSuggestion = false }) {
  if (!profile) return null;
  const name = profile.user?.name || `Roommate #${profile.id}`;
  const initial = (name.replace(/[^a-zA-Z0-9]/g, "")[0] || "R").toUpperCase();

  return (
    <StyledCard isSuggestion={isSuggestion}>
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                bgcolor: isSuggestion ? "var(--rt-brand)" : "var(--rt-brand-muted)",
                color: "var(--rt-on-brand)",
                width: 42,
                height: 42,
                fontSize: "16px",
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(var(--rt-brand-rgb), 0.2)",
                transition: "transform 0.25s ease",
                "&:hover": { transform: "scale(1.08)" },
              }}
            >
              {initial}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{ fontWeight: 700, color: "var(--rt-ink)", lineHeight: 1.2 }}
              >
                {name}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--rt-muted)", fontSize: "11px" }}>
                {profile.age} yrs · {profile.gender}
              </Typography>
            </Box>
          </Box>

          {isSuggestion && (
            <Chip
              label="Suggested"
              size="small"
              sx={{
                backgroundColor: "var(--rt-surface-tint)",
                color: "var(--rt-brand)",
                fontWeight: 700,
                fontSize: "11px",
                border: "1px solid var(--rt-border-strong)",
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            bgcolor: "var(--rt-surface)",
            p: 1.5,
            borderRadius: "var(--rt-radius)",
            border: "1px solid var(--rt-border)",
            mb: 2,
          }}
        >
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
            label={profile.pets ? "Pet friendly" : "No pets"}
            icon={<PetsOutlined />}
            size="small"
            variant="outlined"
            sx={traitChipSx}
          />
          <Chip
            label={profile.smoking ? "Smoking" : "Non-smoking"}
            icon={profile.smoking ? <SmokingRoomsOutlined /> : <SmokeFreeOutlined />}
            size="small"
            variant="outlined"
            sx={traitChipSx}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, borderTop: "1px solid var(--rt-border)" }}>
        <Button
          component={NextLink}
          href={`/roommate/${profile.id}`}
          fullWidth
          endIcon={<ArrowForwardOutlined sx={{ fontSize: 16 }} />}
          sx={{
            color: "var(--rt-brand)",
            fontWeight: 600,
            fontSize: "12px",
            textTransform: "none",
            py: 0.8,
            borderRadius: "var(--rt-radius-sm)",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": { bgcolor: "var(--rt-surface-tint)", color: "var(--rt-brand-hover)" },
          }}
        >
          View profile &amp; contact
        </Button>
      </CardActions>
    </StyledCard>
  );
}
