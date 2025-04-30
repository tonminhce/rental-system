import { createSlice, current } from "@reduxjs/toolkit";

const createPostSlice = createSlice({
  name: "createPost",
  initialState: {
    currentStep: 0,
    steps: 0,
    isCurrentStepCompleted: false,

    transactionType: "sale",
    propertyType: "house",
    addressId: null,

    address: null,
    displayedAddress: "",
    location: null,

    title: "",
    description: "",

    images: [],

    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    price: 0,
    priceSuggestion: 0,
  },
  reducers: {
    initialSteps: (state, action) => {
      state.steps = action.payload;
    },
    goNext: (state, action) => {
      if (state.currentStep < state.steps && state.isCurrentStepCompleted) {
        state.currentStep += 1;
        state.isCurrentStepCompleted = false;
      }
    },
    goBack: (state, action) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },
    setIsStepCompleted: (state, action) => {
      state.isCurrentStepCompleted = action.payload;
    },
    setTransactionType: (state, action) => {
      state.transactionType = action.payload;
    },
    setPropertyType: (state, action) => {
      state.propertyType = action.payload;
    },
    setAddressId: (state, action) => {
      state.addressId = action.payload;
    },
    setAddress: (state, action) => {
      state.address = action.payload;
    },
    setDisplayedAddress: (state, action) => {
      state.displayedAddress = action.payload;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setTitle: (state, action) => {
      state.title = action.payload;
    },
    setDescription: (state, action) => {
      state.description = action.payload;
    },
    updateAddress: (state, action) => {
      state.address = Object.assign(state.address, action.payload);
    },
    setImages: (state, action) => {
      state.images = action.payload;
    },

    addSingleImage: (state, action) => {
      state.images = [...state.images, action.payload];
    },

    removeSingleImage: (state, action) => {
      state.images = state.images.filter((image) => image.id !== action.payload);
    },

    addMultipleImages: (state, action) => {
      state.images = [...state.images, ...action.payload];
    },

    setBedrooms: (state, action) => {
      state.bedrooms = action.payload;
    },

    setBathrooms: (state, action) => {
      state.bathrooms = action.payload;
    },

    setPrice: (state, action) => {
      state.price = action.payload;
    },

    setArea: (state, action) => {
      state.area = action.payload;
    },

    setPriceSuggestion: (state, action) => {
      state.priceSuggestion = action.payload;
    },
  },
});

export const {
  setTransactionType,
  setPropertyType,
  setAddressId,
  initialSteps,
  goNext,
  goBack,
  setIsStepCompleted,
  setAddress,
  updateAddress,
  setLocation,
  setTitle,
  setDescription,
  addSingleImage,
  addMultipleImages,
  removeSingleImage,
  setArea,
  setBedrooms,
  setBathrooms,
  setDisplayedAddress,
  setPrice,
  setPriceSuggestion,
} = createPostSlice.actions;
export default createPostSlice.reducer;
