import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  centerLat: null,
  centerLng: null,
  radius: 5,
  propertyType: '',
  transactionType: 'rent',
  minPrice: null,
  maxPrice: null,
  minArea: null,
  maxArea: null,
  bounds: null,
  page: 1,
  limit: 10
};

export const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    updateFilter: (state, action) => {
      return { ...state, ...action.payload };
    },
    setLocationFilter: (state, action) => {
      const { centerLat, centerLng, bounds } = action.payload;
      state.centerLat = centerLat;
      state.centerLng = centerLng;
      state.bounds = bounds;
    },
    clearFilters: () => initialState,
  },
});

export const { updateFilter, setLocationFilter, clearFilters } = filterSlice.actions;

export default filterSlice.reducer; 