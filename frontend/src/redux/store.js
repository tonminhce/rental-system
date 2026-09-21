import { apiSlice } from "@api/apiSlice";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authSlice from "./features/auth/authSlice";
import createPostSlice from "./features/createPostSlice";
import { propertyApi } from "./features/properties/propertyApi";
import { landlordApi } from "./features/landlord/api";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import systemSlice from "./features/system/systemSlice";
import filterSlice from "./features/filter/filterSlice";

const persistConfig = {
  key: "root",
  storage,
  timeout: 2000,
  whitelist: ["auth", "system"],
};

const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  [propertyApi.reducerPath]: propertyApi.reducer,
  [landlordApi.reducerPath]: landlordApi.reducer,
  auth: authSlice,
  createPost: createPostSlice,
  system: systemSlice,
  filter: filterSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/PURGE", "persist/FLUSH"],
      },
    })
      .concat(apiSlice.middleware)
      .concat(propertyApi.middleware)
      .concat(landlordApi.middleware),
});

export const persistor = persistStore(store);
