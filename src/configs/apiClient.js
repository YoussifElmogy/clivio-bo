import axios from 'axios';
import Cookies from 'js-cookie';
import { readTenantApiBaseUrl, TENANT_API_BASE_URL_KEY } from '../config/tenantStorage';

export const ACCESS_TOKEN_KEY = 'idToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_ID_KEY = 'userId';

function normalizeBaseUrl(value) {
  return String(value ?? '')
    .trim()
    .replace(/\/$/, '');
}

export function getEnvFallbackApiBaseUrl() {
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || '');
}

function readStoredApiBaseUrl() {
  return normalizeBaseUrl(readTenantApiBaseUrl());
}

let runtimeApiBaseUrl = readStoredApiBaseUrl() || getEnvFallbackApiBaseUrl();

export function getApiBaseUrl() {
  return runtimeApiBaseUrl;
}

/** @deprecated Prefer getApiBaseUrl() — kept for legacy imports. */
export function getAPI_BASE_URL() {
  return getApiBaseUrl();
}

export const API_BASE_URL = getEnvFallbackApiBaseUrl();

export function setApiBaseUrl(url) {
  const next = normalizeBaseUrl(url) || getEnvFallbackApiBaseUrl();
  runtimeApiBaseUrl = next;
  apiClient.defaults.baseURL = next || undefined;
}

export function clearAuthCookies() {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove(USER_ID_KEY);
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

function normalizeRole(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function getUserDataCookie() {
  try {
    const raw = Cookies.get('userData');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function appendDoctorIdQueryIfNeeded(config) {
  const method = String(config.method || 'GET').toUpperCase();
  if (method !== 'GET') return;

  const userData = getUserDataCookie();
  if (normalizeRole(userData?.role) !== 'doctor') return;

  const doctorId = Cookies.get(USER_ID_KEY) || userData?.id;
  if (doctorId == null || String(doctorId).trim() === '') return;

  if (config.params instanceof URLSearchParams) {
    if (!config.params.has('doctor_id')) config.params.set('doctor_id', String(doctorId));
    return;
  }

  if (config.params && typeof config.params === 'object') {
    if (config.params.doctor_id == null || config.params.doctor_id === '') {
      config.params.doctor_id = String(doctorId);
    }
    return;
  }

  const url = String(config.url || '');
  if (!url) return;
  const [path, query = ''] = url.split('?');
  const qs = new URLSearchParams(query);
  if (!qs.has('doctor_id')) qs.set('doctor_id', String(doctorId));
  config.url = `${path}?${qs.toString()}`;
}

let refreshPromise = null;

async function performRefresh() {
  const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const base = getApiBaseUrl();
  const { data } = await axios.post(
    `${base}/auth/refresh`,
    { refresh: refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const accessToken =
    data.access || data.accessToken || data.token || data.access_token;
  const newRefresh =
    data.refresh || data.refreshToken || data.refresh_token || refreshToken;

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
  baseURL: runtimeApiBaseUrl || undefined,
});

apiClient.interceptors.request.use(config => {
  config.baseURL = getApiBaseUrl() || undefined;
  const token = Cookies.get(ACCESS_TOKEN_KEY);
  config.headers = config.headers || {};
  const url = config.url || '';
  if (token && !isAuthLoginUrl(url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!isAuthLoginUrl(url) && !isAuthRefreshUrl(url)) {
    appendDoctorIdQueryIfNeeded(config);
  }
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

export { TENANT_API_BASE_URL_KEY };
