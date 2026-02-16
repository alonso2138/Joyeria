import { JewelryItem, AnalyticsEvent, EventType, AdminUserCredentials, CustomRequest, CustomRequestPayload, Organization } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Helper para construir URLs de imágenes correctamente
export const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/placeholder-image.jpg';

  // Si la URL ya es absoluta (http:// o https://), devolverla tal cual
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Si la URL es relativa (empieza con /api/), construir la URL completa
  if (imageUrl.startsWith('/api/')) {
    // Remover /api del principio ya que API_BASE_URL ya lo incluye
    const relativePath = imageUrl.replace('/api/', '/');
    return `${API_BASE_URL}${relativePath}`;
  }

  // Para cualquier otro caso, asumir que es una ruta relativa
  return `${API_BASE_URL}${imageUrl}`;
};

// --- HELPER FOR API REQUESTS ---
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || 'API request failed');
  }
  // For DELETE requests which might not have a body
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

// --- PUBLIC API FUNCTIONS ---

export const getJewelryItems = async (filters: { search?: string; hashtag?: string; catalogId?: string }): Promise<JewelryItem[]> => {
  const query = new URLSearchParams();
  if (filters.search) query.append('search', filters.search);
  if (filters.hashtag) query.append('hashtag', filters.hashtag);
  if (filters.catalogId) query.append('catalogId', filters.catalogId);

  return apiRequest(`/jewelry?${query.toString()}`);
};

export const getFeaturedJewelryItems = async (catalogId?: string): Promise<JewelryItem[]> => {
  const query = new URLSearchParams();
  if (catalogId) query.append('catalogId', catalogId);
  return apiRequest(`/jewelry/featured?${query.toString()}`);
};

export const getJewelryBySlug = async (slug: string): Promise<JewelryItem | undefined> => {
  return apiRequest(`/jewelry/slug/${slug}`);
};

export const getJewelryById = async (id: string): Promise<JewelryItem | undefined> => {
  return apiRequest(`/jewelry/${id}`);
};

export const getUniqueHashtags = async (): Promise<string[]> => {
  return apiRequest('/jewelry/hashtags');
};

let sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

export const logEvent = async (type: EventType, jewelryId: string): Promise<void> => {
  const event: AnalyticsEvent = {
    type,
    jewelryId,
    sessionId,
    timestamp: new Date().toISOString(),
  };
  // In a real app, this would send to an analytics endpoint.
  // For now, we'll just log it client-side.
  console.log('EVENT LOGGED:', event);
};

// --- ADMIN API FUNCTIONS (PROTECTED) ---

export const loginAdmin = async (credentials: AdminUserCredentials): Promise<{ token: string } | null> => {
  try {
    return await apiRequest('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch (error) {
    console.error('API: Admin login failed', error);
    return null;
  }
};

export const createJewelryItem = async (itemData: FormData, token: string): Promise<JewelryItem> => {
  return apiRequest('/jewelry', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: itemData,
  });
}

export const updateJewelryItem = async (id: string, updates: FormData, token: string): Promise<JewelryItem> => {
  return apiRequest(`/jewelry/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: updates,
  });
};

export const deleteJewelryItem = async (id: string, token: string): Promise<{ success: true }> => {
  await apiRequest(`/jewelry/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return { success: true };
};

// --- CUSTOM REQUESTS (PERSONALIZACI��N) ---

export const createCustomRequest = async (payload: CustomRequestPayload): Promise<{ id: string; createdAt: string }> => {
  return apiRequest('/custom-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};


export const fetchCustomRequests = async (token: string): Promise<CustomRequest[]> => {
  return apiRequest('/custom-requests', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

// --- CAMPAIGN CONFIG API ---

export const getCampaignConfig = async (tag?: string): Promise<any> => {
  const query = new URLSearchParams();
  if (tag) query.append('tag', tag);
  return apiRequest(`/config?${query.toString()}`);
};

export const updateCampaignConfig = async (config: any, token: string): Promise<any> => {
  return apiRequest('/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(config),
  });
};

export const getDemos = async (token: string): Promise<Record<string, any>> => {
  return apiRequest('/config/demos', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
};

export const upsertDemo = async (demoData: any, token: string): Promise<any> => {
  return apiRequest('/config/demos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(demoData),
  });
};

export const deleteDemo = async (tag: string, token: string): Promise<any> => {
  return apiRequest(`/config/demos/${tag}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
};

// --- WIDGET API ---
export const validateWidgetApiKey = async (apiKey: string): Promise<{ valid: boolean; orgName?: string; message?: string }> => {
  try {
    return await apiRequest('/widget/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
  } catch (error: any) {
    return { valid: false, message: error.message };
  }
};

export const getOrganizations = async (token: string): Promise<Organization[]> => {
  return apiRequest('/widget/organizations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const createOrganizationAPI = async (orgData: Partial<Organization>, token: string): Promise<Organization> => {
  return apiRequest('/widget/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orgData),
  });
};

export const updateOrganizationAPI = async (id: string, orgData: Partial<Organization>, token: string): Promise<Organization> => {
  return apiRequest(`/widget/organizations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orgData),
  });
};

export const deleteOrganizationAPI = async (id: string, token: string): Promise<void> => {
  return apiRequest(`/widget/organizations/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const logWidgetEvent = async (apiKey: string, type: string, metadata?: any) => {
  try {
    return await apiRequest('/widget/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, type, metadata }),
    });
  } catch (error) {
    console.error('Failed to log widget event:', error);
  }
};
export const createAutoDemoAPI = async (name: string): Promise<{ success: boolean; tag: string }> => {
  return apiRequest('/trigger/create-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
};
