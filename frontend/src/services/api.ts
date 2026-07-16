import axios from 'axios';

// Create a configured Axios instance pointing to your FastAPI local port
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// 🔑 ROLE API CALLS
// ==========================================
export const roleAPI = {
  getAll: async () => {
    const res = await API.get('/roles');
    return res.data;
  },
  create: async (data: { name: string; can_create_project: boolean; can_edit_all_projects: boolean }) => {
    const res = await API.post('/roles', data);
    return res.data;
  },
  update: async (id: number, data: { name: string; can_create_project: boolean; can_edit_all_projects: boolean }) => {
    const res = await API.put(`/roles/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await API.delete(`/roles/${id}`);
    return res.data;
  },
};

// ==========================================
// 👤 USER API CALLS
// ==========================================
export const userAPI = {
  getAll: async () => {
    const res = await API.get('/users');
    return res.data;
  },
  // Sends registration details along with the temporary plain-text password
  create: async (data: { first_name: string; last_name: string; email: string; password: string; is_active: boolean; role_name: string }) => {
    const res = await API.post('/users', data);
    return res.data;
  },
  // Edits user directory details (does not touch or overwrite password hashes)
  update: async (id: number, data: { first_name: string; last_name: string; email: string; is_active: boolean; role_name: string }) => {
    const res = await API.put(`/users/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id: number) => {
    const res = await API.patch(`/users/${id}/toggle-status`);
    return res.data;
  },
  // Overwrites password with a secure new hash on the backend
  resetPassword: async (id: number, data: { new_password: string }) => {
    const res = await API.put(`/users/${id}/reset-password`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await API.delete(`/users/${id}`);
    return res.data;
  },
};

// ==========================================
// 💬 PERSISTENT NOTES API CALLS
// ==========================================
export const noteAPI = {
  getAll: async () => {
    const res = await API.get('/notes');
    return res.data;
  },
  create: async (data: { author: string; text: string; timestamp: string }) => {
    const res = await API.post('/notes', data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await API.delete(`/notes/${id}`);
    return res.data;
  },
};