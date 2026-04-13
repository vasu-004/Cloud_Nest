import api from './api';

export const getMembers = async () => {
  return await api.get('/members');
};

export const createMember = async (memberData) => {
  return await api.post('/members', memberData);
};

export const updateMemberRole = async (id, role) => {
  return await api.patch(`/members/${id}`, { role });
};

export const deleteMember = async (id) => {
  return await api.delete(`/members/${id}`);
};
