import api from './api';

export const getProfile = async () => {
  return await api.get('/users/me');
};

export const updateProfile = async (data) => {
  return await api.patch('/users/profile', data);
};

export const setup2FA = async () => {
  return await api.post('/users/2fa/setup', {});
};

export const verify2FA = async (otp) => {
  return await api.post('/users/2fa/verify', { otp });
};
