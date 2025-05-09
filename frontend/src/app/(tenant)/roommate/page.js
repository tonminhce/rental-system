"use client";

import { Box, Typography, Button, CircularProgress, Tab, Tabs, Alert, IconButton, Collapse } from '@mui/material';
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { useGetAllProfilesQuery, useGetRoommateSuggestionsQuery, useGetMyProfileQuery } from "@/redux/features/roommate/roommateApi";
import Link from "next/link";
import RoommateList from '@/components/Roommate/RoommateList';
import { orange } from '@mui/material/colors';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

export default function RoommatePage() {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [activeTab, setActiveTab] = useState('all');
  const [showDebug, setShowDebug] = useState(false);
  
  const { 
    data: allProfiles, 
    isLoading: isLoadingAll, 
    error: allError 
  } = useGetAllProfilesQuery();
  
  const {
    data: suggestions,
    isLoading: isLoadingSuggestions,
    error: suggestionsError
  } = useGetRoommateSuggestionsQuery(null, {
    skip: !isAuthenticated
  });

  const {
    data: myProfile,
    isLoading: isLoadingMyProfile,
  } = useGetMyProfileQuery(null, {
    skip: !isAuthenticated
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (isLoadingAll || (isLoadingSuggestions && isAuthenticated) || (isLoadingMyProfile && isAuthenticated)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Roommate Matching</Typography>
        <Button 
          component={Link}
          href="/roommate/profile"
          variant="contained"
          sx={{ 
            bgcolor: orange[600], 
            '&:hover': { bgcolor: orange[700] },
            textTransform: 'none',
            px: 3
          }}
        >
          {myProfile ? 'Update Personal Profile' : 'Create Roommate Profile'}
        </Button>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            TabIndicatorProps={{
              style: { backgroundColor: orange[600] }
            }}
            sx={{
              '& .MuiTab-root.Mui-selected': {
                color: orange[600],
                fontWeight: 'bold'
              }
            }}
          >
            <Tab label="All Profiles" value="all" />
            <Tab 
              label="Suggested Matches" 
              value="suggestions" 
              disabled={!isAuthenticated}
            />
          </Tabs>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          {activeTab === 'all' && (
            <RoommateList 
              profiles={allProfiles} 
              isError={allError}
              emptyMessage="No roommate profiles available at the moment."
            />
          )}
          
          {activeTab === 'suggestions' && (
            <RoommateList 
              profiles={suggestions} 
              isError={suggestionsError}
              emptyMessage="No roommate suggestions available. Please complete your profile to get personalized matches."
            />
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Having trouble with suggestions?</Typography>
          <IconButton size="small" onClick={() => setShowDebug(!showDebug)}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Collapse in={showDebug}>
          <Alert 
            severity="info" 
            action={
              <IconButton size="small" onClick={() => setShowDebug(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2">Debug Information</Typography>
            <Box component="pre" sx={{ fontSize: '0.75rem', mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
              {`API URL: ${process.env.NEXT_PUBLIC_RENTAL_SERVICE_BACKEND_ENDPOINT || 'Not configured'}
Authenticated: ${isAuthenticated ? 'Yes' : 'No'}
Has suggestions: ${suggestions?.length ? 'Yes' : 'No'}
Suggestions error: ${suggestionsError ? JSON.stringify(suggestionsError, null, 2) : 'None'}`}
            </Box>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => {
                fetch(`${process.env.NEXT_PUBLIC_RENTAL_SERVICE_BACKEND_ENDPOINT}/roommate/suggestions`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                  }
                })
                .then(res => res.json())
                .then(data => {
                  alert("Check console for API results");
                })
                .catch(err => {
                  alert("API call failed. Check console.");
                });
              }}
              sx={{ mt: 1 }}
            >
              Test API Directly
            </Button>
          </Alert>
        </Collapse>
      </Box>
    </Box>
  );
} 