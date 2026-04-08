import axios from "axios";

// Базовый URL для всех запросов
const API_BASE_URL = "http://localhost:8000/api/v1";

// Создаём экземпляр axios (apiClient)
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// ========================
// Хелперы для работы с токенами
// ========================
export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem("access_token") || getCookie("access_token");
  },

  getRefreshToken() {
    return localStorage.getItem("refresh_token") || getCookie("refresh_token");
  },

  setTokens(accessToken, refreshToken, expiresAt) {
    // Сохраняем в localStorage
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("token_expires_at", expiresAt.toString());

    // Сохраняем в cookies (для большей надёжности)
    const accessExpires = new Date(expiresAt * 1000);
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

    setCookie("access_token", accessToken, accessExpires);
    setCookie("refresh_token", refreshToken, refreshExpires);
  },

  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");

    deleteCookie("access_token");
    deleteCookie("refresh_token");
  },

  isTokenExpired() {
    const expiresAt = localStorage.getItem("token_expires_at");
    if (!expiresAt) return true;
    return Date.now() >= parseInt(expiresAt) * 1000;
  },
};

// ========================
// Вспомогательные функции для работы с cookies
// ========================
function setCookie(name, value, expires) {
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

function getCookie(name) {
  const matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)",
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ========================
// Interceptors (перехватчики запросов и ответов)
// ========================

// 1. Request Interceptor — добавляем токен в каждый запрос
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 2. Response Interceptor — обработка ошибок (особенно 401)
apiClient.interceptors.response.use(
  (response) => response, // если всё хорошо — просто возвращаем ответ
  async (error) => {
    if (error.response?.status === 401) {
      // Токен недействителен → выходим из системы
      tokenStorage.clearTokens();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ========================
// Auth API — функции для авторизации
// ========================
export const authApi = {
  // Логин
  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append("grant_type", "password");
    formData.append("username", email);
    formData.append("password", password);
    formData.append("scope", "");
    formData.append("client_id", "string");
    formData.append("client_secret", "string");

    const response = await apiClient.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // После успешного логина сохраняем токены
    const { access_token, refresh_token, expires_at } = response.data;
    tokenStorage.setTokens(access_token, refresh_token, expires_at);

    return response.data;
  },

  async register(userData, token) {
    const response = await apiClient.post(`/auth/register/${token}`, userData);
    // После успешного логина сохраняем токены
    const { access_token, refresh_token, expires_at } = response.data;
    tokenStorage.setTokens(access_token, refresh_token, expires_at);

    return response.data;
  },

  async invitation(email) {
    const response = await apiClient.post(`/invitations`, { email: email });
    return response.data;
  },
};

export const saveTokens = (tokens) => {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);

  // Также в куки
  const accessMaxAge = tokens.expires_at - Math.floor(Date.now() / 1000);
  document.cookie = `access_token=${tokens.access_token}; path=/; max-age=${accessMaxAge}`;
  document.cookie = `refresh_token=${tokens.refresh_token}; path=/; max-age=2592000`; // 30 дней
};

// Проверить авторизацию
export const isAuthenticated = () => {
  return !!localStorage.getItem("access_token");
};

export default apiClient;
