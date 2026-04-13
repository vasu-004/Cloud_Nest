import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getMembers = async () => {
  const token = localStorage.getItem('token');
  return await axios.get(`${API_URL}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createMember = async (memberData) => {
  const token = localStorage.getItem('token');
  return await axios.post(`${API_URL}/members`, memberData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateMemberRole = async (id, role) => {
  const token = localStorage.getItem('token');
  return await axios.patch(`${API_URL}/members/${id}`, { role }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteMember = async (id) => {
  const token = localStorage.getItem('token');
  return await axios.delete(`${API_URL}/members/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
