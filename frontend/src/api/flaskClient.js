import axios from 'axios';

const flaskClient = axios.create({
    baseURL: import.meta.env.VITE_FLASK_API_URL || 'http://localhost:8000',
});

flaskClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default flaskClient;
