import axios from 'axios';

// Axios instance banayein jo .env file se backend URL lega
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Yeh har request ke saath automatically authentication token jod dega
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Authentication Service ---
export const authService = {
  requestOtp: (email) => apiClient.post('/users/login/request-otp', { email }),
  verifyOtp: (email, otp) => apiClient.post('/users/login/verify-otp', { email, otp }),
  decodeToken: (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error('Invalid token:', e);
      return null;
    }
  }
};

// --- User Service ---
export const userService = {
  createUser: (userData) => apiClient.post('/users/', userData),
  getAllUsers: () => apiClient.get('/users/'),
  updateUserRole: (userId, role) => apiClient.put(`/users/${userId}/role`, { role }),
  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),
};

// --- Job Service ---
export const jobService = {
  createJob: (jobData) => apiClient.post('/jobs/', jobData),
  parseJdFromPdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/jobs/parse-from-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  generateJdWithAi: (data) => apiClient.post('/jobs/generate-jd-with-ai', data),
};

// --- ADD THESE NEW SERVICES ---

// Service for all Department-related API calls
export const departmentService = {
    /**
     * Creates a new department. (Admin only)
     * @param {object} deptData - e.g., { department_name: "Engineering" }
     */
    createDepartment: (deptData) => apiClient.post('/departments/', deptData),

    /**
     * Fetches a list of all existing departments.
     */
    getAllDepartments: () => apiClient.get('/departments/'),
};

// Service for all Portfolio-related API calls
export const portfolioService = {
    /**
     * Creates a new portfolio. (Admin only)
     * @param {object} portfolioData - e.g., { portfolio_name: "Cloud Services", department_id: 1 }
     */
    createPortfolio: (portfolioData) => apiClient.post('/portfolios/', portfolioData),
    
    /**
     * Fetches a list of all existing portfolios.
     */
    getAllPortfolios: () => apiClient.get('/portfolios/'),
};