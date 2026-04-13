import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getProfile = async () => {
  return await axios.get(`${API_URL}/users/me`, getHeaders());
};

export const updateProfile = async (data) => {
  return await axios.patch(`${API_URL}/users/profile`, data, getHeaders());
};

export const setup2FA = async () => {
  return await axios.post(`${API_URL}/users/2fa/setup`, {}, getHeaders());
};

export const verify2FA = async (otp) => {
  return await axios.post(`${API_URL}/users/2fa/verify`, { otp }, getHeaders());
};
