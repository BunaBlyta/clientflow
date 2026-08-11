import type { Client, Invoice, Project } from './types';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const baseUrl = configuredBaseUrl || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  if (!response.ok) {
    throw new ApiError(body?.error || 'Something went wrong.', response.status);
  }

  return body as T;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
  token: string;
}

export function loginRequest(email: string, password: string) {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function projectRequest(projectId: string, token: string) {
  return request<Project>(`/api/projects/${encodeURIComponent(projectId)}`, {}, token);
}

export function projectsRequest(token: string) {
  return request<Project[]>('/api/projects', {}, token);
}

export function invoicesRequest(token: string, projectId?: string) {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  return request<Invoice[]>(`/api/invoices${query}`, {}, token);
}

export function invoiceRequest(invoiceId: string, token: string) {
  return request<Invoice>(`/api/invoices/${encodeURIComponent(invoiceId)}`, {}, token);
}

export interface CheckoutResponse {
  checkoutSessionId: string;
  checkoutUrl: string;
}

export function checkoutRequest(invoiceId: string, token: string) {
  return request<CheckoutResponse>('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ invoiceId }),
  }, token);
}

export function clientFromUser(user: LoginResponse['user']): Client {
  return {
    id: user.id,
    name: user.name,
    companyName: user.name,
    email: user.email,
  };
}
