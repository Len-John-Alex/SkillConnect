const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// In-memory access token — never stored in localStorage
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

/**
 * Fetch wrapper that automatically attaches the Bearer token
 * and handles JSON request/response.
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // send/receive HttpOnly cookies
  });

  // Attempt to parse JSON — some responses may be empty
  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.code = data.code;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

let isRefreshing = false;

/**
 * Try to refresh the access token using the HttpOnly refresh cookie.
 * Returns the user object on success, null on auth failure (401/403), or 'network_error' on network failure.
 */
export async function refreshAuth() {
  if (isRefreshing) {
    return null;
  }
  isRefreshing = true;
  try {
    const data = await apiFetch('/auth/refresh', { method: 'POST' });
    setAccessToken(data.accessToken);
    return data.user;
  } catch (err) {
    // Only clear token if server explicitly rejected auth (401/403)
    if (err.status === 401 || err.status === 403) {
      clearAccessToken();
      return null;
    }
    // Network or server error — do not log out user immediately
    console.warn('[refreshAuth] Network or server error during token refresh:', err.message);
    return 'network_error';
  } finally {
    isRefreshing = false;
  }
}

// ─── Auth API ─────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  
  register: (data) => apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  
  me: () => apiFetch('/auth/me'),
  
  refresh: () => apiFetch('/auth/refresh', { method: 'POST' }),
};

function buildQuery(params = {}) {
  const filtered = Object.entries(params).filter(
    ([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null'
  );
  if (filtered.length === 0) return '';
  return `?${new URLSearchParams(filtered).toString()}`;
}

// ─── Skills API ───────────────────────────────────────────────────
export const skillsApi = {
  list: (params = {}) => apiFetch(`/skills${buildQuery(params)}`),
  
  get: (id) => apiFetch(`/skills/${id}`),
  
  create: (data) => apiFetch('/skills', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ─── Opportunities API ────────────────────────────────────────────
export const opportunitiesApi = {
  list: (params = {}) => apiFetch(`/opportunities${buildQuery(params)}`),
  
  get: (id) => apiFetch(`/opportunities/${id}`),
  
  create: (data) => apiFetch('/opportunities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => apiFetch(`/opportunities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiFetch(`/opportunities/${id}`, {
    method: 'DELETE',
  }),
  
  myList: (params = {}) => apiFetch(`/opportunities/my/list${buildQuery(params)}`),
};

// ─── Applications API ─────────────────────────────────────────────
export const applicationsApi = {
  list: (params = {}) => apiFetch(`/applications${buildQuery(params)}`),
  
  get: (id) => apiFetch(`/applications/${id}`),
  
  create: (data) => apiFetch('/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateStatus: (id, status) => apiFetch(`/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  
  withdraw: (id) => apiFetch(`/applications/${id}/withdraw`, {
    method: 'PATCH',
  }),
};

// ─── Students API ─────────────────────────────────────────────────
export const studentsApi = {
  getProfile: () => apiFetch('/students/me/profile'),
  
  updateProfile: (data) => apiFetch('/students/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  listSkills: () => apiFetch('/students/me/skills'),
  
  addSkill: (data) => apiFetch('/students/me/skills', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateSkill: (skillId, data) => apiFetch(`/students/me/skills/${skillId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  removeSkill: (skillId) => apiFetch(`/students/me/skills/${skillId}`, {
    method: 'DELETE',
  }),
  
  getSkillProgress: () => apiFetch('/students/me/skill-progress'),
  
  updateSkillProgress: (data) => apiFetch('/students/me/skill-progress', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  listProjects: () => apiFetch('/students/me/projects'),
  
  createProject: (data) => apiFetch('/students/me/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateProject: (id, data) => apiFetch(`/students/me/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  deleteProject: (id) => apiFetch(`/students/me/projects/${id}`, {
    method: 'DELETE',
  }),
};

// ─── Companies API ────────────────────────────────────────────────
export const companiesApi = {
  getProfile: () => apiFetch('/companies/me/profile'),
  
  updateProfile: (data) => apiFetch('/companies/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  getPublicProfile: (id) => apiFetch(`/companies/${id}`),
};

// ─── Learning Resources API ───────────────────────────────────────
export const learningResourcesApi = {
  list: (params = {}) => apiFetch(`/learning-resources${buildQuery(params)}`),
  
  getBySkill: (skillId) => apiFetch(`/learning-resources/skill/${skillId}`),
  
  create: (data) => apiFetch('/learning-resources', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiFetch(`/learning-resources/${id}`, {
    method: 'DELETE',
  }),
};

// ─── Institutions API ─────────────────────────────────────────────
export const institutionsApi = {
  list: (params = {}) => apiFetch(`/institutions${buildQuery(params)}`),
  
  get: (id) => apiFetch(`/institutions/${id}`),
};

// ─── Health API ───────────────────────────────────────────────────
export const healthApi = {
  check: () => apiFetch('/health'),
};

export default {
  auth: authApi,
  skills: skillsApi,
  opportunities: opportunitiesApi,
  applications: applicationsApi,
  students: studentsApi,
  companies: companiesApi,
  institutions: institutionsApi,
  learningResources: learningResourcesApi,
  health: healthApi,
};