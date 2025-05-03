import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useCreateOrUpdateProfileMutation, useGetMyProfileQuery } from '@/redux/features/roommate/roommateApi';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { orange } from '@mui/material/colors';

export default function ProfileForm({ initialData, isEdit = false }) {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const [createOrUpdateProfile, { isLoading }] = useCreateOrUpdateProfileMutation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dataInitialized, setDataInitialized] = useState(false);
  
  const [formData, setFormData] = useState({
    gender: "Male",
    lifestyle: "Clean",
    pets: false,
    smoking: false,
    personality: "Introvert",
    age: 25,
    wakeUpTime: "07:00",
    bedTime: "23:00"
  });

  // Initialize form data from profile if editing
  useEffect(() => {
    if (initialData && !dataInitialized) {
      try {
        // Extract time values properly
        const wakeUpTime = initialData.wakeUpTime ? 
          (initialData.wakeUpTime.includes(':') ? initialData.wakeUpTime.substring(0, 5) : "07:00") : 
          "07:00";
          
        const bedTime = initialData.bedTime ? 
          (initialData.bedTime.includes(':') ? initialData.bedTime.substring(0, 5) : "23:00") : 
          "23:00";
        
        // Parse age to ensure it's a number
        const age = initialData.age ? parseInt(initialData.age) : 25;
        
        // Convert boolean values explicitly
        const pets = initialData.pets === true || initialData.pets === "true";
        const smoking = initialData.smoking === true || initialData.smoking === "true";
        
        const updatedFormData = {
          gender: initialData.gender || "Male",
          lifestyle: initialData.lifestyle || "Clean",
          pets: pets,
          smoking: smoking,
          personality: initialData.personality || "Introvert",
          age: age,
          wakeUpTime: wakeUpTime,
          bedTime: bedTime
        };
        
        setFormData(updatedFormData);
        setDataInitialized(true);
      } catch (error) {
        // If there's an error, still mark as initialized to prevent endless loops
        setDataInitialized(true);
      }
    }
  }, [initialData, dataInitialized]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await createOrUpdateProfile(formData).unwrap();
      
      setSnackbar({
        open: true,
        message: isEdit ? 'Profile updated successfully!' : 'Profile created successfully!',
        severity: 'success'
      });
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        router.push("/roommate");
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.data?.message || 'Failed to save profile. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Section card style for consistent UI
  const sectionCardStyle = {
    mb: 3,
    p: 3,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: '900px', mx: 'auto' }}>
      <Card sx={{ mb: 4, overflow: 'visible' }}>
        <CardHeader 
          title={
            <Typography variant="h5" sx={{ fontWeight: 600, color: orange[800] }}>
              {isEdit ? "Update Personal Profile" : "Create Roommate Profile"}
            </Typography>
          }
          sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
        />
        <CardContent sx={{ pt: 3 }}>
          {isEdit && !dataInitialized && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Loading your profile data...
            </Alert>
          )}
          
          {/* Basic Info Section */}
          <Paper elevation={0} sx={sectionCardStyle}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: orange[700], display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: orange[100], 
                color: orange[800], 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mr: 1,
                fontSize: '0.8rem', 
                fontWeight: 'bold' 
              }}>1</Box>
              Basic Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  InputProps={{ inputProps: { min: 18, max: 100 } }}
                  value={formData.age}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">Gender</FormLabel>
                  <RadioGroup
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    row
                  >
                    <FormControlLabel value="Male" control={<Radio />} label="Male" />
                    <FormControlLabel value="Female" control={<Radio />} label="Female" />
                    <FormControlLabel value="Other" control={<Radio />} label="Other" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="personality-label">Personality Type</InputLabel>
                  <Select
                    labelId="personality-label"
                    name="personality"
                    value={formData.personality}
                    onChange={handleChange}
                    label="Personality Type"
                  >
                    <MenuItem value="Introvert">Introvert</MenuItem>
                    <MenuItem value="Extrovert">Extrovert</MenuItem>
                    <MenuItem value="Ambivert">Ambivert</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Lifestyle Preferences Section */}
          <Paper elevation={0} sx={sectionCardStyle}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: orange[700], display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: orange[100], 
                color: orange[800], 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mr: 1,
                fontSize: '0.8rem', 
                fontWeight: 'bold' 
              }}>2</Box>
              Lifestyle Preferences
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="lifestyle-label">Cleanliness Level</InputLabel>
                  <Select
                    labelId="lifestyle-label"
                    name="lifestyle"
                    value={formData.lifestyle}
                    onChange={handleChange}
                    label="Cleanliness Level"
                  >
                    <MenuItem value="Clean">Clean</MenuItem>
                    <MenuItem value="Moderate">Moderate</MenuItem>
                    <MenuItem value="Messy">Messy</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Preferences
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="pets"
                          checked={formData.pets}
                          onChange={handleChange}
                        />
                      }
                      label="Pets Friendly"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="smoking"
                          checked={formData.smoking}
                          onChange={handleChange}
                        />
                      }
                      label="Smoking"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Schedule Section */}
          <Paper elevation={0} sx={sectionCardStyle}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: orange[700], display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: orange[100], 
                color: orange[800], 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mr: 1,
                fontSize: '0.8rem', 
                fontWeight: 'bold' 
              }}>3</Box>
              Daily Schedule
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Wake Up Time"
                  name="wakeUpTime"
                  type="time"
                  value={formData.wakeUpTime}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Your typical morning start time"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bed Time"
                  name="bedTime"
                  type="time"
                  value={formData.bedTime}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Your typical time to sleep"
                  required
                />
              </Grid>
            </Grid>
          </Paper>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Button 
          variant="outlined" 
          onClick={() => router.push("/roommate")}
          sx={{ px: 3 }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ 
            bgcolor: orange[600], 
            '&:hover': { bgcolor: orange[700] },
            px: 4,
            py: 1
          }}
        >
          {isLoading ? 'Saving...' : (isEdit ? 'Update Profile' : 'Create Profile')}
        </Button>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 