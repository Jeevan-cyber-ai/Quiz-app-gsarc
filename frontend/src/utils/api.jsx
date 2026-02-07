
import axios from "axios";

const api = axios.create({
  baseURL: "https://quiz-app-gsarc.onrender.com/api",
  withCredentials: true,
});



api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // get JWT from storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
