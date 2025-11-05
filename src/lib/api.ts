// API utility functions for image management

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Image {
  id: string;
  title: string;
  description?: string | null;
  image_url: string;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  category?: string | null;
  tags?: string | null;
  is_published: boolean;
  status: string;
  width?: number | null;
  height?: number | null;
  file_size?: string | null;
  mime_type?: string | null;
  slug?: string | null;
  created_at: string;
  updated_at: string;
}

interface ImageListResponse {
  items: Image[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateImageDto {
  title: string;
  image_url: string;
}

interface UpdateImageDto {
  title?: string;
  image_url?: string;
  is_published?: boolean;
  status?: string;
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok && response.status !== 201) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Image Management API (Admin only - requires auth)
export const imageManagementApi = {
  // Get all images with filtering
  getAll: async (params?: {
    search?: string;
    category?: string;
    is_published?: boolean;
    status?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Promise<ImageListResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    const response = await apiRequest<ImageListResponse>(
      `/image-management${query ? `?${query}` : ''}`
    );
    return response.data;
  },

  // Get image by ID
  getById: async (id: string): Promise<Image> => {
    const response = await apiRequest<Image>(`/image-management/${id}`);
    return response.data;
  },

  // Create image
  create: async (data: CreateImageDto): Promise<Image> => {
    const response = await apiRequest<Image>('/image-management', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update image
  update: async (id: string, data: UpdateImageDto): Promise<Image> => {
    const response = await apiRequest<Image>(`/image-management/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete image
  delete: async (id: string): Promise<void> => {
    await apiRequest(`/image-management/${id}`, {
      method: 'DELETE',
    });
  },
};

// Public Image API (No auth required)
export const publicImageApi = {
  // Get all published images
  getAll: async (params?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Promise<ImageListResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Convert numbers to strings for URLSearchParams
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    const url = `${API_URL}/image-management/public${query ? `?${query}` : ''}`;
    console.log('Fetching public images from:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      const text = await response.text();
      throw new Error(`Failed to parse response: ${text.substring(0, 200)}`);
    }
    
    if (!response.ok) {
      // Handle error responses - check for nested error structure
      let errorMessage = `HTTP ${response.status}`;
      if (data) {
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.data && data.data.message) {
          errorMessage = data.data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      console.error('API Error Response:', data);
      throw new Error(errorMessage);
    }
    
    // Handle response structure - backend wraps in { success: true, data: {...} }
    if (data && data.success && data.data) {
      return data.data;
    }
    
    // If data is already the response structure (items array exists)
    if (data && (data.items || (Array.isArray(data) && data.length > 0))) {
      return data;
    }
    
    // Check if data.data exists and has items
    if (data && data.data && (data.data.items || Array.isArray(data.data))) {
      return data.data;
    }
    
    // Fallback
    return data.data || data;
  },

  // Get published image by ID
  getById: async (id: string): Promise<Image> => {
    const response = await fetch(`${API_URL}/image-management/public/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  },

  // Get published image by slug
  getBySlug: async (slug: string): Promise<Image> => {
    const response = await fetch(`${API_URL}/image-management/public/slug/${slug}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  },
};

export type { Image, ImageListResponse, CreateImageDto, UpdateImageDto };
