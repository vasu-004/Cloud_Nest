// src/services/authService.js - Auth API calls
import api from './api';

export const signup = async (data) => {
  return api.post('/auth/signup', data);
};

export const login = async (data) => {
  return api.post('/auth/login', data);
};

export const getMe = async () => {
  return api.get('/auth/me');
};

export const verifyPin = async (data) => {
  return api.post('/auth/verify-pin', data);
};

export const updatePin = async (data) => {
  return api.post('/auth/update-pin', data);
};

export const sendOTP = async (data) => {
  return api.post('/auth/send-otp', data);
};

export const verifyOTP = async (data) => {
  return api.post('/auth/verify-otp', data);
};

