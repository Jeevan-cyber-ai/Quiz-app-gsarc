
import axios from "axios";

const envUrl = import.meta.env?.VITE_API_URL;
const baseURL = envUrl || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : 'https://quiz-app-gsarc.onrender.com/api');

const api = axios.create({
  baseURL,
  withCredentials: true,
});

console.log("API Base URL:", baseURL); // For debugging

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // get JWT from storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors better
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error Response:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("API No Response:", error.request);
    } else {
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
