import axios from 'axios';

const nodeClient = axios.create({
    baseURL: import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api',
});

nodeClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default nodeClient;
