import axios from 'axios';

const api = axios.create({
    // Alterado de 127.0.0.1 para localhost para casar com a origem do React
    baseURL: 'http://localhost:5000/api/v1' 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@AtasApp:token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Se der erro 401 e não estivermos na página de login, limpa tudo e atira para o login
        if (error.response && error.response.status === 401) {
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('@AtasApp:token');
                localStorage.removeItem('@AtasApp:usuario');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;