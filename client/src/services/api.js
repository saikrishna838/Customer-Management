import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable credentials for CORS
});

// Customer API calls
export const customerAPI = {
    // Get all customers with optional search and pagination
    getAll: (params = {}) => api.get('/customers', { params }),
    
    // Get a specific customer by ID
    getById: (id) => api.get(`/customers/${id}`),
    
    // Create a new customer
    create: (customerData) => api.post('/customers', customerData),
    
    // Update a customer
    update: (id, customerData) => api.put(`/customers/${id}`, customerData),
    
    // Delete a customer
    delete: (id) => api.delete(`/customers/${id}`),
};

// Address API calls
export const addressAPI = {
    // Get all addresses for a customer
    getByCustomerId: (customerId) => api.get(`/customers/${customerId}/addresses`),
    
    // Create a new address for a customer
    create: (customerId, addressData) => api.post(`/customers/${customerId}/addresses`, addressData),
    
    // Update an address
    update: (id, addressData) => api.put(`/addresses/${id}`, addressData),
    
    // Delete an address
    delete: (id) => api.delete(`/addresses/${id}`),
};

// Handle API errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;
