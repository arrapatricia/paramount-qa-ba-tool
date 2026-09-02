import axios from 'axios';

// Central API Base URL
export const API_BASE_URL = 'http://127.0.0.1:8000';

// Configured Axios Instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// 🔑 ROLE API CALLS
// ==========================================
export interface RoleData {
  name: string;
  is_active: boolean;
  // Project Permissions
  project_create: boolean;
  project_read: boolean;
  project_update: boolean;
  project_delete: boolean;
  // QA Test Suite Permissions
  qa_suite_create: boolean;
  qa_suite_read: boolean;
  qa_suite_update: boolean;
  qa_suite_delete: boolean;
}

export const roleAPI = {
  getAll: async () => {
    const res = await API.get('/roles');
    return res.data;
  },
  create: async (data: RoleData) => {
    const res = await API.post('/roles', data);
    return res.data;
  },
  update: async (id: number, data: RoleData) => {
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
  create: async (data: { first_name: string; last_name: string; email: string; password: string; is_active: boolean; role_name: string }) => {
    const res = await API.post('/users', data);
    return res.data;
  },
  update: async (id: number, data: { first_name: string; last_name: string; email: string; is_active: boolean; role_name: string }) => {
    const res = await API.put(`/users/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id: number) => {
    const res = await API.patch(`/users/${id}/toggle-status`);
    return res.data;
  },
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
// 📝 NOTES API CALLS
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

// ==========================================
// 🧪 QA TEST SUITE API CALLS
// ==========================================
export const qaSuiteAPI = {
  getAll: async () => {
    const res = await API.get('/qa-suites');
    return res.data;
  },
  create: async (data: { 
    title: string; 
    description: string; 
    priority: string; 
    suite_type?: string; 
    jira_ticket?: string; 
    project_id?: number | null;
    assigned_qa?: string;
  }) => {
    const res = await API.post('/qa-suites', data);
    return res.data;
  },
};

// ==========================================
// 📊 TEST PLAN & RUN API CALLS
// ==========================================
export interface TestRunData {
  id?: string;
  run_id: string;
  suite_id: number;
  plan_id?: string;
  runner_type: 'Manual' | 'Robot Framework';
  passed_count: number;
  failed_count: number;
  total_count: number;
  status: 'Passed' | 'Failed' | 'In Progress';
  execution_logs?: string;
  created_at?: string;
}

export const testPlanAPI = {
  getAll: async () => {
    const res = await API.get('/test-plans');
    return res.data;
  },
  create: async (data: any) => {
    const res = await API.post('/test-plans', data);
    return res.data;
  },
};

export const testRunAPI = {
  getAll: async () => {
    const res = await API.get('/test-runs');
    return res.data;
  },
  create: async (data: TestRunData) => {
    const res = await API.post('/test-runs', data);
    return res.data;
  },
};

// ==========================================
// 📜 DOCUMENT VERSIONING API CALLS
// ==========================================
export interface DocumentVersion {
  id: string;
  versionNumber: number;
  versionName: string;
  title: string;
  content: string;
  publishedBy: string;
  publishedAt: string;
  changelogNote?: string;
}

export const docVersionAPI = {
  getVersions: async (projectId: string | number): Promise<DocumentVersion[]> => {
    try {
      const response = await API.get(`/projects/${projectId}/versions`);
      return response.data;
    } catch {
      // Fallback to local storage if API endpoint is unavailable
      const saved = localStorage.getItem(`qa_doc_versions_${projectId}`);
      return saved ? JSON.parse(saved) : [];
    }
  },

  saveVersion: async (projectId: string | number, versionData: Omit<DocumentVersion, 'id'>): Promise<DocumentVersion> => {
    const newVersion: DocumentVersion = {
      ...versionData,
      id: `ver-${Date.now()}`
    };
    try {
      const response = await API.post(`/projects/${projectId}/versions`, newVersion);
      return response.data;
    } catch {
      // Fallback to local storage
      const existing = JSON.parse(localStorage.getItem(`qa_doc_versions_${projectId}`) || '[]');
      const updated = [newVersion, ...existing];
      localStorage.setItem(`qa_doc_versions_${projectId}`, JSON.stringify(updated));
      return newVersion;
    }
  }
};