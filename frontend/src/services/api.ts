import axios from 'axios';
import { 
  User, 
  Form, 
  Response, 
  FormSummary, 
  LoginCredentials, 
  RegisterData, 
  CreateFormData, 
  SubmitResponseData,
  PaginatedResponse 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Forms API
export const formsAPI = {
  create: async (data: CreateFormData) => {
    const response = await api.post('/forms', data);
    return response.data;
  },

  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/forms', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/forms/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateFormData>) => {
    const response = await api.put(`/forms/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/forms/${id}`);
    return response.data;
  },

  getByPublicUrl: async (publicUrl: string) => {
    const response = await api.get(`/forms/public/${publicUrl}`);
    return response.data;
  },
};

// Responses API
export const responsesAPI = {
  submit: async (data: SubmitResponseData) => {
    const response = await api.post('/responses', data);
    return response.data;
  },

  getByForm: async (formId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/responses/form/${formId}`, { params });
    return response.data;
  },

  getSummary: async (formId: string) => {
    const response = await api.get(`/responses/form/${formId}/summary`);
    return response.data;
  },

  exportCSV: async (formId: string) => {
    const response = await api.get(`/responses/form/${formId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/responses/${id}`);
    return response.data;
  },
};

export default api; 