import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import RoommateList from './RoommateList';

export default function RoommateTabs({ 
  allProfiles, 
  suggestions, 
  allError, 
  suggestionsError, 
  isAuthenticated 
}) {
  const [activeTab, setActiveTab] = useState('all');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="roommate tabs"
        >
          <Tab label="All Profiles" value="all" />
          <Tab 
            label="Suggested Matches" 
            value="suggestions" 
            disabled={!isAuthenticated}
          />
        </Tabs>
      </Box>
      
      <Box sx={{ mt: 2 }}>
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
  );
} 