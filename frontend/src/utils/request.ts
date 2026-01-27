import axios, { AxiosRequestConfig } from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 30000
});

instance.interceptors.response.use(
  response => response,
  error => {
    const message = error?.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

type RequestConfig = AxiosRequestConfig;

const request = {
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return instance.get<T>(url, config).then(res => res.data);
  },
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.post<T>(url, data, config).then(res => res.data);
  },
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.put<T>(url, data, config).then(res => res.data);
  },
  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return instance.delete<T>(url, config).then(res => res.data);
  }
};

export default request;