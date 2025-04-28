import { createSelector } from "@reduxjs/toolkit";

export const getTransactionType = (s) => s.createPost.transactionType;
export const getPropertyType = (s) => s.createPost.propertyType;

export const getCurrentStep = (s) => s.createPost.currentStep;
export const getSteps = (s) => s.createPost.steps;
