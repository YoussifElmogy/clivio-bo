import axios from 'axios';
import Cookies from 'js-cookie';

const rawBase = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE_URL = rawBase.trim().replace(/\/$/, '');

export const ACCESS_TOKEN_KEY = 'idToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

export function clearAuthCookies() {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove('userData');
}

function redirectToLoginIfNeeded() {
  const path = window.location.pathname || '';
  if (!path.includes('/login')) {
    window.location.href = '/login';
  }
}

function isAuthLoginUrl(url) {
  return typeof url === 'string' && url.includes('/auth/login');
}

function isAuthRefreshUrl(url) {
  return typeof url === 'string' && url.includes('/auth/refresh');
}

let refreshPromise = null;

async function performRefresh() {
  const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const { data } = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const accessToken =
    data.accessToken || data.token || data.access_token;
  const newRefresh =
    data.refreshToken || data.refresh_token || refreshToken;

  if (!accessToken) {
    throw new Error('No access token in refresh response');
  }

  Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 7, sameSite: 'lax' });
  Cookies.set(REFRESH_TOKEN_KEY, newRefresh, { expires: 14, sameSite: 'lax' });

  return accessToken;
}

function getRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
});

apiClient.interceptors.request.use(config => {
  const token = Cookies.get(ACCESS_TOKEN_KEY);
  config.headers = config.headers || {};
  const url = config.url || '';
  if (token && !isAuthLoginUrl(url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Do not send X-Time-Zone unless the API CORS config lists it in
  // Access-Control-Allow-Headers (otherwise the browser blocks the request).
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const { response, config } = error;
    if (!config || !response) {
      return Promise.reject(error);
    }

    const status = response.status;
    const url = config.url || '';

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (isAuthLoginUrl(url)) {
      return Promise.reject(error);
    }

    if (isAuthRefreshUrl(url)) {
      clearAuthCookies();
      redirectToLoginIfNeeded();
      return Promise.reject(error);
    }

    if (config._retryAfterRefresh) {
      clearAuthCookies();
      redirectToLoginIfNeeded();
      return Promise.reject(error);
    }

    if (!Cookies.get(REFRESH_TOKEN_KEY)) {
      clearAuthCookies();
      redirectToLoginIfNeeded();
      return Promise.reject(error);
    }

    try {
      const accessToken = await getRefreshPromise();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
      config._retryAfterRefresh = true;
      return apiClient.request(config);
    } catch {
      clearAuthCookies();
      redirectToLoginIfNeeded();
      return Promise.reject(error);
    }
  }
);
