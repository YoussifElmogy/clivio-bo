import { useCallback, useState } from 'react';
import { apiClient } from './apiClient';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(
    async (method, endpoint, data = null, options = {}) => {
      setLoading(true);
      setError(null);

      const isFormData = data instanceof FormData;
      const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      };

      try {
        const axiosConfig = {
          method,
          url: endpoint,
          headers,
          ...options,
        };

        if (method !== 'GET' && method !== 'HEAD' && data !== null && data !== undefined) {
          axiosConfig.data = data;
        }

        if (
          (method === 'POST' || method === 'PUT' || method === 'PATCH') &&
          isFormData &&
          options.onUploadProgress
        ) {
          axiosConfig.onUploadProgress = options.onUploadProgress;
        }
        if (axiosConfig.onUploadProgress === undefined) {
          delete axiosConfig.onUploadProgress;
        }

        const res = await apiClient.request(axiosConfig);
        return res.data;
      } catch (err) {
        const payload = err.response?.data ?? err;
        setError(payload);
        throw payload;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    get: (endpoint, options) => makeRequest('GET', endpoint, null, options),
    post: (endpoint, data, options) =>
      makeRequest('POST', endpoint, data, options),
    put: (endpoint, data, options) =>
      makeRequest('PUT', endpoint, data, options),
    patch: (endpoint, data, options) =>
      makeRequest('PATCH', endpoint, data, options),
    del: (endpoint, options) => makeRequest('DELETE', endpoint, null, options),
    loading,
    error,
    setLoading,
  };
};

export default useApi;
