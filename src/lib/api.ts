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

// ============================================================================
// Countdown System Types and API
// ============================================================================

interface CountdownReward {
  id: string;
  day_number: number;
  reward_date: string;
  reward_name: string;
  reward_description: string;
  reward_type: 'item' | 'currency' | 'experience' | 'badge' | 'title';
  reward_item_id?: string | null; // UUID of inventory item
  reward_quantity: number;
  reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  is_active: boolean;
  can_claim: boolean;
  is_claimed: boolean;
  current_day?: number | null;
  icon_url?: string | null; // Icon image URL from inventory
  preview_url?: string | null; // Preview image URL from inventory
}

interface CountdownEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  is_active: boolean;
  rewards: CountdownReward[];
  total_days: number;
  days_remaining: number;
  is_currently_active: boolean;
  current_day: number | null;
}

interface CreateCountdownRewardDto {
  day_number: number;
  reward_date: string;
  reward_name: string;
  reward_description: string;
  reward_type: 'item' | 'currency' | 'experience' | 'badge' | 'title';
  reward_item_id?: string | null; // UUID of inventory item
  reward_quantity: number;
  reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  is_active?: boolean;
}

interface CreateCountdownEventDto {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  is_active?: boolean;
  rewards: CreateCountdownRewardDto[];
}

interface UpdateCountdownEventDto extends Partial<CreateCountdownEventDto> {}

// Countdown Management API (Admin only - requires auth)
export const countdownApi = {
  // Get all countdown events (admin view)
  getAll: async (): Promise<CountdownEvent[]> => {
    const response = await apiRequest<CountdownEvent[]>('/countdown/admin/events');
    return response.data;
  },

  // Get countdown event by ID
  getById: async (id: string): Promise<CountdownEvent> => {
    const response = await apiRequest<CountdownEvent>(`/countdown/${id}`);
    return response.data;
  },

  // Create countdown event
  create: async (data: CreateCountdownEventDto): Promise<CountdownEvent> => {
    const response = await apiRequest<CountdownEvent>('/countdown/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update countdown event
  update: async (id: string, data: UpdateCountdownEventDto): Promise<CountdownEvent> => {
    const response = await apiRequest<CountdownEvent>(`/countdown/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete countdown event
  delete: async (id: string): Promise<void> => {
    await apiRequest(`/countdown/admin/events/${id}`, {
      method: 'DELETE',
    });
  },

  // Claim a reward (user endpoint)
  claimReward: async (countdown_event_id: string, day_number: number): Promise<any> => {
    const response = await apiRequest<any>('/countdown/claim', {
      method: 'POST',
      body: JSON.stringify({
        countdown_event_id,
        day_number,
      }),
    });
    return response.data;
  },

  // Get user claims
  getUserClaims: async (): Promise<any> => {
    const response = await apiRequest<any>('/countdown/user/claims');
    return response.data;
  },

  // Get user countdown details
  getUserDetails: async (): Promise<CountdownEvent[]> => {
    const response = await apiRequest<CountdownEvent[]>('/countdown/user/details');
    return response.data;
  },
};

export type {
  CountdownEvent,
  CountdownReward,
  CreateCountdownEventDto,
  CreateCountdownRewardDto,
  UpdateCountdownEventDto,
};

// ============================================================================
// Inventory Management Types and API
// ============================================================================

interface InventoryCategory {
  id: string;
  main_category: 'rewards' | 'shop';
  sub_category: string;
  description?: string | null;
  is_active: boolean;
  display_order?: number | null;
  metadata?: any;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface InventoryItem {
  id: string;
  item_id: string;
  item_name: string;
  item_description: string;
  category_id: string;
  main_category: 'rewards' | 'shop';
  sub_category: string;
  item_type: 'badge' | 'outfit' | 'currency' | 'item' | 'title' | 'experience' | 'frenzy_points' | 'accessory' | 'emote' | 'frame';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive' | 'easter_exclusive';
  icon_url?: string | null;
  preview_url?: string | null;
  is_tradeable: boolean;
  is_sellable: boolean;
  sell_price?: number | null;
  is_active: boolean;
  is_limited_edition: boolean;
  limited_edition_until?: string | null;
  requires_premium: boolean;
  requires_founder_pack: boolean;
  quantity?: number | null;
  max_quantity?: number | null;
  min_level_required?: number | null;
  item_metadata?: any;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  category?: InventoryCategory;
}

interface CreateInventoryCategoryDto {
  main_category: 'rewards' | 'shop';
  sub_category: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
  metadata?: any;
}

interface UpdateInventoryCategoryDto extends Partial<CreateInventoryCategoryDto> {}

interface CreateInventoryItemDto {
  item_id: string;
  item_name: string;
  item_description?: string;
  category_id: string;
  main_category: 'rewards' | 'shop';
  sub_category: string;
  item_type: 'badge' | 'outfit' | 'currency' | 'item' | 'title' | 'experience' | 'frenzy_points' | 'accessory' | 'emote' | 'frame';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive' | 'easter_exclusive';
  icon_url?: string;
  preview_url?: string;
  is_tradeable: boolean;
  is_sellable: boolean;
  sell_price?: number;
  is_active?: boolean;
  is_limited_edition?: boolean;
  limited_edition_until?: string;
  requires_premium?: boolean;
  requires_founder_pack?: boolean;
  quantity?: number;
  max_quantity?: number;
  min_level_required?: number;
  item_metadata?: any;
}

interface UpdateInventoryItemDto extends Partial<CreateInventoryItemDto> {}

// Inventory Category Management API (Admin only - requires auth)
export const inventoryCategoryApi = {
  // Get all categories
  getAll: async (main_category?: string): Promise<InventoryCategory[]> => {
    const queryParams = new URLSearchParams();
    if (main_category) queryParams.append('main_category', main_category);
    const query = queryParams.toString();
    const url = `/inventory/admin/categories${query ? `?${query}` : ''}`;
    const response = await apiRequest<InventoryCategory[]>(url);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get category by ID
  getById: async (id: string): Promise<InventoryCategory> => {
    const response = await apiRequest<InventoryCategory>(`/inventory/admin/categories/${id}`);
    return response.data;
  },

  // Create category
  create: async (data: CreateInventoryCategoryDto): Promise<InventoryCategory> => {
    const response = await apiRequest<InventoryCategory>('/inventory/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update category
  update: async (id: string, data: UpdateInventoryCategoryDto): Promise<InventoryCategory> => {
    const response = await apiRequest<InventoryCategory>(`/inventory/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete category
  delete: async (id: string): Promise<void> => {
    await apiRequest(`/inventory/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Inventory Management API (Admin only - requires auth)
export const inventoryApi = {
  // Get all items (admin view)
  getAll: async (main_category?: string, sub_category?: string, rarity?: string): Promise<InventoryItem[]> => {
    const queryParams = new URLSearchParams();
    if (main_category) queryParams.append('main_category', main_category);
    if (sub_category) queryParams.append('sub_category', sub_category);
    if (rarity) queryParams.append('rarity', rarity);
    const query = queryParams.toString();
    const url = `/inventory/admin/items${query ? `?${query}` : ''}`;
    const response = await apiRequest<InventoryItem[]>(url);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get item by ID
  getById: async (id: string): Promise<InventoryItem> => {
    const response = await apiRequest<InventoryItem>(`/inventory/items/${id}`);
    return response.data;
  },

  // Create item
  create: async (data: CreateInventoryItemDto): Promise<InventoryItem> => {
    const response = await apiRequest<InventoryItem>('/inventory/admin/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update item
  update: async (id: string, data: UpdateInventoryItemDto): Promise<InventoryItem> => {
    const response = await apiRequest<InventoryItem>(`/inventory/admin/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete item
  delete: async (id: string): Promise<void> => {
    await apiRequest(`/inventory/admin/items/${id}`, {
      method: 'DELETE',
    });
  },
};

export type {
  InventoryItem,
  InventoryCategory,
  CreateInventoryItemDto,
  CreateInventoryCategoryDto,
  UpdateInventoryItemDto,
  UpdateInventoryCategoryDto,
};

// ============================================================================
// Admin Management Types and API
// ============================================================================

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: string;
  created_at: string;
}

interface UpdateUserRoleDto {
  role: 'user' | 'admin' | 'super_admin';
}

// Admin Management API (Super Admin only - requires auth)
export const adminApi = {
  // Get all users (Super Admin only)
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await apiRequest<any>('/admin/users');
    // Backend returns { message: '...', data: [...] }
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    // Fallback: check if data is directly in response
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  },

  // Get user by ID (Super Admin only)
  getUserById: async (userId: string): Promise<AdminUser> => {
    const response = await apiRequest<any>(`/admin/users/${userId}`);
    // Backend returns { message: '...', data: {...} }
    if (response.data) {
      return response.data;
    }
    return response;
  },

  // Update user role (Super Admin only)
  updateUserRole: async (userId: string, role: 'user' | 'admin' | 'super_admin'): Promise<AdminUser> => {
    const response = await apiRequest<any>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    // Backend returns { message: '...', data: {...} }
    if (response.data) {
      return response.data;
    }
    return response;
  },
};

export type { AdminUser, UpdateUserRoleDto };

// ============================================================================
// Easter Egg Types and API
// ============================================================================

interface EasterEgg {
  easter_egg_id: string;
  code: string;
  reward_name: string;
  reward_description: string;
  reward_category: 'currency' | 'item' | 'badge' | 'title' | 'experience' | 'frenzy_points';
  reward_item_id: string;
  reward_quantity: number;
  reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive' | 'easter_exclusive';
  is_active: boolean;
  max_redemptions: number;
  current_redemptions: number;
  expires_at?: string | null;
  is_limited_time: boolean;
  is_seasonal: boolean;
  season_name?: string | null;
  requires_premium: boolean;
  requires_founder_pack: boolean;
  hint_text?: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateEasterEggDto {
  code: string;
  reward_name: string;
  reward_description: string;
  reward_category: 'currency' | 'item' | 'badge' | 'title' | 'experience' | 'frenzy_points';
  reward_item_id: string;
  reward_quantity: number;
  reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive' | 'easter_exclusive';
  max_redemptions?: number;
  expires_at?: string;
  is_limited_time?: boolean;
  is_seasonal?: boolean;
  season_name?: string;
  requires_premium?: boolean;
  requires_founder_pack?: boolean;
  hint_text?: string;
  easter_egg_metadata?: string;
  admin_notes?: string;
}

interface RedeemEasterEggDto {
  code: string;
  platform?: 'ios' | 'android' | 'web';
  device_info?: {
    device_model: string;
    os_version: string;
    app_version: string;
    screen_resolution?: string;
    device_id?: string;
  };
  redemption_metadata?: string;
}

interface EasterEggRedemption {
  redemption_id: string;
  user_id: string;
  easter_egg_id: string;
  code: string;
  redeemed_at: string;
  is_claimed: boolean;
  claimed_at?: string;
  platform: 'ios' | 'android' | 'web';
  reward_details: {
    reward_name: string;
    reward_description: string;
    reward_category: string;
    reward_item_id: string;
    reward_quantity: number;
    reward_rarity: string;
  };
}

interface EasterEggStats {
  total_easter_eggs: number;
  active_easter_eggs: number;
  total_redemptions: number;
  unique_users_redeemed: number;
  most_popular_easter_egg: {
    easter_egg_id: string;
    code: string;
    reward_name: string;
    redemptions: number;
  };
  recent_redemptions: EasterEggRedemption[];
  seasonal_stats: {
    current_season: string | null;
    seasonal_easter_eggs: number;
    seasonal_redemptions: number;
  };
}

interface UserEasterEggHistory {
  user_id: string;
  total_redemptions: number;
  total_rewards_claimed: number;
  unique_easter_eggs: number;
  recent_redemptions: EasterEggRedemption[];
  favorite_categories: { category: string; count: number }[];
  rarity_breakdown: { rarity: string; count: number }[];
}

interface CodeValidationResponse {
  valid: boolean;
  code: string;
  reward_name?: string;
  reward_description?: string;
  reward_rarity?: string;
  expires_at?: string | null;
  max_redemptions?: number;
  current_redemptions?: number;
  message?: string;
}

// Easter Egg API
export const easterEggApi = {
  // Public endpoints
  redeem: async (data: RedeemEasterEggDto): Promise<EasterEggRedemption> => {
    const response = await apiRequest<EasterEggRedemption>('/easter-egg/redeem', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  getAvailable: async (): Promise<EasterEgg[]> => {
    const response = await apiRequest<EasterEgg[]>('/easter-egg/available');
    return Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
  },

  validateCode: async (code: string): Promise<CodeValidationResponse> => {
    const response = await apiRequest<CodeValidationResponse>(`/easter-egg/validate/${code}`);
    return response.data || response;
  },

  getUserHistory: async (): Promise<UserEasterEggHistory> => {
    const response = await apiRequest<UserEasterEggHistory>('/easter-egg/history');
    return response.data || response;
  },

  // Admin endpoints
  create: async (data: CreateEasterEggDto): Promise<EasterEgg> => {
    const response = await apiRequest<EasterEgg>('/easter-egg/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  generateCode: async (): Promise<{ code: string }> => {
    const response = await apiRequest<{ code: string }>('/easter-egg/admin/generate-code');
    return response.data || response;
  },

  getStats: async (): Promise<EasterEggStats> => {
    const response = await apiRequest<EasterEggStats>('/easter-egg/admin/stats');
    return response.data || response;
  },

  deactivate: async (easterEggId: string): Promise<EasterEgg> => {
    const response = await apiRequest<EasterEgg>(`/easter-egg/admin/${easterEggId}/deactivate`, {
      method: 'POST',
    });
    return response.data || response;
  },
};

export type {
  EasterEgg,
  CreateEasterEggDto,
  RedeemEasterEggDto,
  EasterEggRedemption,
  EasterEggStats,
  UserEasterEggHistory,
  CodeValidationResponse,
};

// ============================================================================
// Community Goals Types and API
// ============================================================================

interface CommunityGoal {
  goal_id: string;
  goal_name: string;
  goal_description: string;
  goal_type: 'tapathon_score' | 'frenzy_sessions' | 'easter_egg_redemptions' | 'poll_votes' | 'user_registrations' | 'founder_pack_sales' | 'custom';
  target_value: number;
  current_value: number;
  completion_percentage: number;
  is_active: boolean;
  is_achieved: boolean;
  is_global: boolean;
  start_date: string;
  end_date: string;
  achieved_date?: string;
  requires_premium: boolean;
  requires_founder_pack: boolean;
  category?: string;
  tags?: string[];
  participants_count: number;
  contributors_count: number;
  time_remaining_seconds: number;
  created_at: string;
  updated_at: string;
}

interface CommunityGoalProgress {
  progress_id: string;
  user_id: string;
  goal_id: string;
  contribution_value: number;
  contribution_date: string;
  cumulative_value: number;
  user_percentage: number;
  platform: 'ios' | 'android' | 'web';
  goal_details: {
    goal_name: string;
    goal_type: string;
    target_value: number;
    current_value: number;
    completion_percentage: number;
  };
}

interface CommunityGoalReward {
  reward_id: string;
  user_id: string;
  goal_id: string;
  reward_type: 'milestone' | 'achievement' | 'participation' | 'top_contributor' | 'early_bird';
  reward_name: string;
  reward_description: string;
  reward_category: 'currency' | 'item' | 'badge' | 'title' | 'experience' | 'frenzy_points';
  reward_item_id: string;
  reward_quantity: number;
  reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive' | 'community_exclusive';
  reward_tier: number;
  threshold_percentage: number;
  is_claimed: boolean;
  claimed_date?: string;
  earned_date: string;
  contribution_value?: number;
  is_global_reward: boolean;
}

interface CommunityGoalRewardConfig {
  reward_type: 'milestone' | 'achievement' | 'participation' | 'top_contributor' | 'early_bird';
  threshold_percentage?: number; // For milestone rewards (20, 40, 60, 80, 100)
  reward_name: string;
  reward_description: string;
  reward_category: 'currency' | 'item' | 'badge' | 'title' | 'experience' | 'frenzy_points';
  reward_item_id: string; // Can be inventory item ID or currency/item identifier
  reward_quantity: number;
  reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive' | 'community_exclusive';
  reward_tier?: number;
}

interface CreateCommunityGoalDto {
  goal_name: string;
  goal_description: string;
  goal_type: 'tapathon_score' | 'frenzy_sessions' | 'easter_egg_redemptions' | 'poll_votes' | 'user_registrations' | 'founder_pack_sales' | 'custom';
  target_value: number;
  is_global?: boolean;
  start_date: string;
  end_date: string;
  requires_premium?: boolean;
  requires_founder_pack?: boolean;
  category?: string;
  tags?: string[];
  reward_configs?: CommunityGoalRewardConfig[]; // Custom reward configurations
  goal_metadata?: string;
  admin_notes?: string;
}

interface ContributeToGoalDto {
  goal_id: string;
  contribution_value: number;
  platform?: 'ios' | 'android' | 'web';
  device_info?: {
    device_model: string;
    os_version: string;
    app_version: string;
    screen_resolution?: string;
    device_id?: string;
  };
  progress_metadata?: string;
}

interface CommunityGoalStats {
  total_goals: number;
  active_goals: number;
  achieved_goals: number;
  total_participants: number;
  total_contributions: number;
  most_popular_goal: {
    goal_id: string;
    goal_name: string;
    goal_type: string;
    participants_count: number;
    completion_percentage: number;
  } | null;
  recent_achievements: CommunityGoal[];
  category_breakdown: {
    category: string;
    goals_count: number;
    participants_count: number;
    completion_rate: number;
  }[];
  top_contributors: {
    user_id: string;
    total_contributions: number;
    goals_participated: number;
    rewards_earned: number;
  }[];
}

// Community Goals API
export const communityGoalsApi = {
  // Public endpoints
  getActiveGoals: async (): Promise<CommunityGoal[]> => {
    const response = await apiRequest<CommunityGoal[]>('/community-goals/active');
    return Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
  },

  getGoalById: async (goalId: string): Promise<CommunityGoal> => {
    const response = await apiRequest<CommunityGoal>(`/community-goals/${goalId}`);
    return response.data || response;
  },

  contribute: async (data: ContributeToGoalDto): Promise<CommunityGoalProgress> => {
    const response = await apiRequest<CommunityGoalProgress>('/community-goals/contribute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  getUserProgress: async (): Promise<CommunityGoalProgress[]> => {
    const response = await apiRequest<CommunityGoalProgress[]>('/community-goals/user/progress');
    return Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
  },

  getUserRewards: async (): Promise<CommunityGoalReward[]> => {
    const response = await apiRequest<CommunityGoalReward[]>('/community-goals/user/rewards');
    return Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
  },

  claimReward: async (rewardId: string): Promise<CommunityGoalReward> => {
    const response = await apiRequest<CommunityGoalReward>(`/community-goals/rewards/${rewardId}/claim`, {
      method: 'POST',
    });
    return response.data || response;
  },

  // Admin endpoints
  createGoal: async (data: CreateCommunityGoalDto): Promise<CommunityGoal> => {
    const response = await apiRequest<CommunityGoal>('/community-goals/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  getStats: async (): Promise<CommunityGoalStats> => {
    const response = await apiRequest<CommunityGoalStats>('/community-goals/admin/stats');
    return response.data || response;
  },
};

export type {
  CommunityGoal,
  CommunityGoalProgress,
  CommunityGoalReward,
  CreateCommunityGoalDto,
  ContributeToGoalDto,
  CommunityGoalStats,
  CommunityGoalRewardConfig,
};

// ============================================================================
// Founder Pack Types and API
// ============================================================================

interface PackItem {
  item_id: string;
  item_name: string;
  item_type: 'outfit' | 'currency' | 'profile_frame' | 'emote' | 'accessory';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  quantity?: number;
  icon_url: string;
}

interface PackInfo {
  product_id: string;
  price: number;
  currency: string;
  localized_price: string;
  title: string;
  description: string;
}

interface UserStatus {
  has_purchased: boolean;
  purchase_date?: string;
  is_founder: boolean;
}

interface CommunityGoalRewardFP {
  item_id: string;
  item_name: string;
  item_type: 'emote' | 'currency' | 'accessory';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  quantity?: number;
}

interface CommunityGoalFP {
  tier: number;
  name: string;
  target_sales: number;
  current_sales: number;
  is_achieved: boolean;
  achieved_date?: string;
  reward: CommunityGoalRewardFP;
}

interface AchievedGoal {
  tier: number;
  name: string;
  achieved_date: string;
}

interface CommunityGoalsFP {
  total_founders: number;
  current_goal: CommunityGoalFP;
  next_goal: CommunityGoalFP;
  achieved_goals: AchievedGoal[];
}

interface FounderPackDetails {
  pack_info: PackInfo;
  contents: PackItem[];
  user_status: UserStatus;
  community_goals: CommunityGoalsFP;
}

interface PurchaseInfo {
  purchase_id: string;
  purchase_date: string;
  platform: 'ios' | 'android';
  transaction_id: string;
  price_paid: number;
  currency: string;
}

interface Entitlement {
  entitlement_id: string;
  item_id: string;
  item_name: string;
  item_type: 'outfit' | 'currency' | 'profile_frame' | 'emote' | 'accessory';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  quantity: number;
  granted: boolean;
  grant_date: string;
  source: 'founder_pack_base' | 'community_goal_tier_1' | 'community_goal_tier_2' | 'community_goal_tier_3';
}

interface CommunityGoalEligibility {
  goal_tier: number;
  goal_name: string;
  is_achieved: boolean;
  achieved_date?: string;
  current_progress?: string;
  user_contributed: boolean;
}

interface UserFounderStatus {
  user_id: string;
  is_founder: boolean;
  purchase_info?: PurchaseInfo;
  entitlements: Entitlement[];
  community_goals_eligible: CommunityGoalEligibility[];
}

interface Milestone {
  tier: number;
  target: number;
  reward: string;
  status: 'UNLOCKED' | 'IN_PROGRESS' | 'LOCKED';
  achieved_date?: string;
  progress_percentage: number;
}

interface CommunityGoalsStatus {
  total_packs_sold: number;
  milestones: Milestone[];
  current_tier: number;
  unlocked_count: number;
  total_milestones: number;
}

interface Founder {
  user_id: string;
  username: string;
  purchase_id: string;
  purchase_date: string;
  platform: 'ios' | 'android';
  transaction_id: string;
  price_paid: number;
  currency: string;
  purchase_status: string;
}

interface FoundersListResponse {
  founders: Founder[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_founders: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  summary: {
    total_founders: number;
    total_revenue: number;
    platform_breakdown: {
      ios: number;
      android: number;
    };
    currency_breakdown: Record<string, number>;
  };
}

interface FoundersListQuery {
  page?: number;
  limit?: number;
  sort_by?: 'purchase_date' | 'user_id' | 'price';
  sort_order?: 'asc' | 'desc';
  platform?: 'ios' | 'android' | 'all';
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface IAPStatus {
  has_purchased: boolean;
  purchase_status?: string;
  purchase_date?: string;
  transaction_id?: string;
}

interface RewardsPrelaunch {
  user_id: string;
  founder_pack_rewards: Entitlement[];
  community_goal_rewards: Entitlement[];
  total_rewards: number;
}

interface AvailableCommunityGoalReward {
  goal_id: string;
  goal_tier: number;
  goal_name: string;
  achieved_date: string;
  reward: {
    item_id: string;
    item_name: string;
    item_type: string;
    quantity: number;
    rarity: string;
  };
  is_claimed: boolean;
  claimed_date: string | null;
  entitlement_id: string | null;
}

interface ClaimCommunityGoalRewardResponse {
  success: boolean;
  reward: {
    entitlement_id: string;
    goal_id: string;
    goal_tier: number;
    goal_name: string;
    reward: {
      item_id: string;
      item_name: string;
      item_type: string;
      quantity: number;
      rarity: string;
    };
    claimed_date: string;
  };
}

interface RewardsGrant {
  user_id: string;
  success: boolean;
  total_granted: number;
  granted_rewards: Array<{
    item_id: string;
    item_name: string;
    item_type: string;
    quantity: number;
    source: string;
    granted_date: string;
  }>;
  founder_pack_rewards_count: number;
  community_goal_rewards_count: number;
  grant_date: string;
}

// Founder Pack API
export const founderPackApi = {
  // Public endpoints
  getDetails: async (): Promise<FounderPackDetails> => {
    const response = await apiRequest<FounderPackDetails>('/founder-pack/details');
    return response.data || response;
  },

  getUserStatus: async (): Promise<UserFounderStatus> => {
    const response = await apiRequest<UserFounderStatus>('/founder-pack/user-status');
    return response.data || response;
  },

  getCommunityGoalsStatus: async (): Promise<CommunityGoalsStatus> => {
    const response = await apiRequest<CommunityGoalsStatus>('/founder-pack/community-goals/status');
    return response.data || response;
  },

  getIAPStatus: async (userId: string): Promise<IAPStatus> => {
    const response = await apiRequest<IAPStatus>(`/founder-pack/iap/status/${userId}`);
    return response.data || response;
  },

  getPrelaunchRewards: async (userId: string): Promise<RewardsPrelaunch> => {
    const response = await apiRequest<RewardsPrelaunch>(`/founder-pack/rewards/prelaunch/${userId}`);
    return response.data || response;
  },

  grantRewards: async (userId: string): Promise<RewardsGrant> => {
    const response = await apiRequest<RewardsGrant>(`/founder-pack/rewards/grant/${userId}`, {
      method: 'POST',
    });
    return response.data || response;
  },

  // Admin endpoints
  getFoundersList: async (query?: FoundersListQuery): Promise<FoundersListResponse> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sort_by) params.append('sort_by', query.sort_by);
    if (query?.sort_order) params.append('sort_order', query.sort_order);
    if (query?.platform) params.append('platform', query.platform);
    if (query?.date_from) params.append('date_from', query.date_from);
    if (query?.date_to) params.append('date_to', query.date_to);
    if (query?.search) params.append('search', query.search);

    const queryString = params.toString();
    const url = `/founder-pack/founders-list${queryString ? `?${queryString}` : ''}`;
    const response = await apiRequest<{ success: boolean; data: FoundersListResponse }>(url);
    return response.data?.data || response.data || response;
  },

  getAvailableCommunityGoalRewards: async (): Promise<AvailableCommunityGoalReward[]> => {
    const response = await apiRequest<{ success: boolean; data: AvailableCommunityGoalReward[] }>(
      '/founder-pack/community-goals/available-rewards'
    );
    return response.data?.data || response.data || [];
  },

  claimCommunityGoalReward: async (goalId: string): Promise<ClaimCommunityGoalRewardResponse> => {
    const response = await apiRequest<ClaimCommunityGoalRewardResponse>(
      '/founder-pack/community-goals/claim-reward',
      {
        method: 'POST',
        body: JSON.stringify({ goal_id: goalId }),
      }
    );
    return response.data || response;
  },

  // Admin: Founder Pack Settings
  getSettings: async (): Promise<FounderPackSettings> => {
    const response = await apiRequest<FounderPackSettings>('/founder-pack/admin/settings');
    return response.data || response;
  },

  updateSettings: async (settings: Partial<FounderPackSettings>): Promise<{ success: boolean; message: string; settings: FounderPackSettings }> => {
    const response = await apiRequest<{ success: boolean; message: string; settings: FounderPackSettings }>(
      '/founder-pack/admin/settings',
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );
    return response.data || response;
  },
};

export type {
  FounderPackDetails,
  UserFounderStatus,
  CommunityGoalsStatus,
  FoundersListResponse,
  FoundersListQuery,
  IAPStatus,
  RewardsPrelaunch,
  RewardsGrant,
  PackItem,
  PackInfo,
  UserStatus,
  Entitlement,
  Milestone,
  Founder,
  AvailableCommunityGoalReward,
  ClaimCommunityGoalRewardResponse,
};
