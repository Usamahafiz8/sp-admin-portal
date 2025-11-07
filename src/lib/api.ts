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
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error?.message || errorData.error || errorMessage;
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const text = await response.text();
        if (text) errorMessage = text.substring(0, 200);
      } catch {
        // Ignore
      }
    }
    throw new Error(errorMessage);
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
// Founder Pack API
// ============================================================================

// Founder Pack Community Goal Types
export interface FounderPackCommunityGoal {
  id: string;
  goal_name: string;
  goal_tier: number;
  target_sales_count: number;
  current_sales_count: number;
  reward_item_id: string;
  reward_item_type: 'emote' | 'currency' | 'accessory';
  reward_item_name: string;
  reward_quantity: number;
  is_active: boolean;
  is_achieved: boolean;
  achieved_date?: string | null;
  reward_icon_url?: string | null;
  reward_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFounderPackCommunityGoalDto {
  goal_name: string;
  goal_tier: number;
  target_sales_count: number;
  reward_item_id: string;
  reward_item_type: 'emote' | 'currency' | 'accessory';
  reward_item_name: string;
  reward_quantity?: number;
  is_active?: boolean;
  reward_icon_url?: string | null;
  reward_name?: string | null;
}

export interface UpdateFounderPackCommunityGoalDto {
  goal_name?: string;
  goal_tier?: number;
  target_sales_count?: number;
  current_sales_count?: number;
  reward_item_id?: string;
  reward_item_type?: 'emote' | 'currency' | 'accessory';
  reward_item_name?: string;
  reward_quantity?: number;
  is_active?: boolean;
  is_achieved?: boolean;
  reward_icon_url?: string | null;
  reward_name?: string | null;
}

export interface FounderPackSettings {
  id: string;
  founder_outfit_icon_url?: string | null;
  dino_gems_icon_url?: string | null;
  founder_frame_icon_url?: string | null;
  tier_1_reward_icon_url?: string | null;
  tier_2_reward_icon_url?: string | null;
  tier_3_reward_icon_url?: string | null;
  product_id?: string | null;
  price?: number | null;
  currency?: string | null;
  title?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Founder {
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

export interface FoundersListResponse {
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

export interface FoundersListQuery {
  page?: number;
  limit?: number;
  sort_by?: 'purchase_date' | 'user_id' | 'price';
  sort_order?: 'asc' | 'desc';
  platform?: 'ios' | 'android' | 'all';
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Founder Pack API
export const founderPackApi = {
  // Community Goals CRUD
  getAllCommunityGoals: async (): Promise<FounderPackCommunityGoal[]> => {
    try {
      const response = await apiRequest<{ success: boolean; data: FounderPackCommunityGoal[] } | FounderPackCommunityGoal[]>(
        '/founder-pack/community-goals/admin'
      );
      
      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      }
      
      if (response && typeof response === 'object' && 'success' in response) {
        const typedResponse = response as { success: boolean; data: FounderPackCommunityGoal[] };
        if (typedResponse.success && typedResponse.data) {
          return Array.isArray(typedResponse.data) ? typedResponse.data : [];
        }
        if (typedResponse.data && Array.isArray(typedResponse.data)) {
          return typedResponse.data;
        }
      }
      
      if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as any).data;
        if (Array.isArray(data)) {
          return data;
        }
      }
      
      return [];
    } catch (error: any) {
      console.error('Error fetching community goals:', error);
      throw error;
    }
  },

  getCommunityGoalById: async (id: string): Promise<FounderPackCommunityGoal> => {
    const response = await apiRequest<{ success: boolean; data: FounderPackCommunityGoal }>(
      `/founder-pack/community-goals/admin/${id}`
    );
    return response.data?.data || response.data || response;
  },

  createCommunityGoal: async (data: CreateFounderPackCommunityGoalDto): Promise<FounderPackCommunityGoal> => {
    try {
      const response = await apiRequest<{ success: boolean; data: FounderPackCommunityGoal } | FounderPackCommunityGoal>(
        '/founder-pack/community-goals/admin',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      
      if (Array.isArray(response)) {
        throw new Error('Unexpected array response');
      }
      
      if (response && typeof response === 'object' && 'success' in response) {
        const typedResponse = response as { success: boolean; data: FounderPackCommunityGoal };
        return typedResponse.data || typedResponse as any;
      }
      
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as any).data;
      }
      
      return response as FounderPackCommunityGoal;
    } catch (error: any) {
      console.error('Error creating community goal:', error);
      throw error;
    }
  },

  updateCommunityGoal: async (id: string, data: UpdateFounderPackCommunityGoalDto): Promise<FounderPackCommunityGoal> => {
    try {
      const response = await apiRequest<{ success: boolean; data: FounderPackCommunityGoal } | FounderPackCommunityGoal>(
        `/founder-pack/community-goals/admin/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      
      if (Array.isArray(response)) {
        throw new Error('Unexpected array response');
      }
      
      if (response && typeof response === 'object' && 'success' in response) {
        const typedResponse = response as { success: boolean; data: FounderPackCommunityGoal };
        return typedResponse.data || typedResponse as any;
      }
      
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as any).data;
      }
      
      return response as FounderPackCommunityGoal;
    } catch (error: any) {
      console.error('Error updating community goal:', error);
      throw error;
    }
  },

  deleteCommunityGoal: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest<{ success: boolean; message: string }>(
      `/founder-pack/community-goals/admin/${id}`,
      {
        method: 'DELETE',
      }
    );
    return response.data || response;
  },

  // Founders List
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

  // Settings
  getSettings: async (): Promise<FounderPackSettings> => {
    try {
      const response = await apiRequest<FounderPackSettings | { success: boolean; data: FounderPackSettings }>(
        '/founder-pack/admin/settings'
      );
      
      if (response && typeof response === 'object' && 'success' in response) {
        const typedResponse = response as { success: boolean; data: FounderPackSettings };
        return typedResponse.data || typedResponse as any;
      }
      
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as any).data;
      }
      
      return response as FounderPackSettings;
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      throw error;
    }
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

  updateContentIcon: async (itemId: 'founder_outfit' | 'dino_gems' | 'founder_frame', iconUrl: string): Promise<{ success: boolean; message: string; data: { item_id: string; icon_url: string } }> => {
    const response = await apiRequest<{ success: boolean; message: string; data: { item_id: string; icon_url: string } }>(
      '/founder-pack/contents/icon',
      {
        method: 'PUT',
        body: JSON.stringify({ item_id: itemId, icon_url: iconUrl }),
      }
    );
    return response.data || response;
  },

  updateRewardIcon: async (tier: 1 | 2 | 3, iconUrl: string): Promise<{ success: boolean; message: string; data: { tier: number; icon_url: string } }> => {
    const response = await apiRequest<{ success: boolean; message: string; data: { tier: number; icon_url: string } }>(
      '/founder-pack/community-goals/reward-icon',
      {
        method: 'PUT',
        body: JSON.stringify({ tier, icon_url: iconUrl }),
      }
    );
    return response.data || response;
  },

  // User Status & IAP
  getUserStatus: async (userId?: string): Promise<any> => {
    const url = userId ? `/founder-pack/user-status?userId=${userId}` : '/founder-pack/user-status';
    const response = await apiRequest<any>(url);
    return response.data || response;
  },

  getIAPStatus: async (userId: string): Promise<any> => {
    const response = await apiRequest<any>(`/founder-pack/iap/status/${userId}`);
    return response.data || response;
  },

  // Rewards Management
  getPrelaunchRewards: async (userId: string): Promise<any> => {
    const response = await apiRequest<any>(`/founder-pack/rewards/prelaunch/${userId}`);
    return response.data || response;
  },

  grantRewards: async (userId: string): Promise<any> => {
    const response = await apiRequest<any>(
      `/founder-pack/rewards/grant/${userId}`,
      {
        method: 'POST',
      }
    );
    return response.data || response;
  },

  getAvailableRewards: async (): Promise<any[]> => {
    const response = await apiRequest<{ success: boolean; data: any[] } | any[]>(
      '/founder-pack/community-goals/available-rewards'
    );
    if (Array.isArray(response)) {
      return response;
    }
    if (response && typeof response === 'object' && 'success' in response) {
      return (response as any).data || [];
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data || [];
    }
    return [];
  },

  claimReward: async (goalId: string): Promise<any> => {
    const response = await apiRequest<any>(
      '/founder-pack/community-goals/claim-reward',
      {
        method: 'POST',
        body: JSON.stringify({ goal_id: goalId }),
      }
    );
    return response.data || response;
  },

  // Community Goals Status
  getCommunityGoalsStatus: async (): Promise<any> => {
    const response = await apiRequest<any>('/founder-pack/community-goals/status');
    return response.data || response;
  },

  updateCommunityGoalsProgress: async (updates: { goal_id: string; current_sales_count: number }[]): Promise<any> => {
    const response = await apiRequest<any>(
      '/founder-pack/community-goals/update',
      {
        method: 'POST',
        body: JSON.stringify({ updates }),
      }
    );
    return response.data || response;
  },

  // Founder Pack Details
  getFounderPackDetails: async (): Promise<any> => {
    const response = await apiRequest<any>('/founder-pack/details');
    return response.data || response;
  },
};

// Tapathon Types
export interface Tap {
  id: string;
  user_id: string;
  platform: 'ios' | 'android' | 'web';
  created_at: Date;
  updated_at: Date;
}

export interface TapListResponse {
  taps: Tap[];
  total: number;
}

export interface CreateTapDto {
  user_id?: string;
  platform: 'ios' | 'android' | 'web';
}

export interface UpdateTapDto {
  platform?: 'ios' | 'android' | 'web';
}

export interface TapathonCommunityGoal {
  id: string;
  tier_number: number;
  target_taps: number;
  tier_name: string;
  is_completed: boolean;
  completed_at: Date | null;
  current_taps: number;
  is_active: boolean | number; // Can be boolean or 1/0 (number)
  progress_percentage: number;
  created_at: Date;
  updated_at: Date;
  reward_icon_url?: string | null;
  reward_name?: string | null;
  // API response may use different field names
  RewardIcon?: string | null;
  RewardName?: string | null;
  isCollected?: boolean;
}

export interface TapathonCommunityGoalListResponse {
  goals: TapathonCommunityGoal[];
  total: number;
}

export interface CreateTapathonCommunityGoalDto {
  tier_number: number;
  target_taps: number;
  tier_name: string;
}

export interface UpdateTapathonCommunityGoalDto {
  tier_number?: number;
  target_taps?: number;
  tier_name?: string;
  is_completed?: boolean;
  current_taps?: number;
  is_active?: boolean;
  reward_name?: string;
  reward_icon_url?: string | null;
}

export interface UpdateTapathonCommunityGoalRewardIconDto {
  icon_url: string;
}

export interface TapReward {
  reward_id: string;
  user_id: string;
  session_id?: string | null;
  reward_type: 'score_milestone' | 'combo_achievement' | 'session_completion' | 'leaderboard_position' | 'daily_bonus' | 'frenzy_bonus';
  reward_name: string;
  reward_description: string;
  reward_category: 'currency' | 'item' | 'badge' | 'title' | 'experience';
  reward_item_id: string;
  reward_quantity: number;
  reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  score_threshold: number;
  combo_threshold: number;
  is_claimed: boolean;
  claimed_date?: string | null;
  earned_date: string;
  score_earned_at?: number | null;
  combo_earned_at?: number | null;
  is_frenzy_reward: boolean;
  community_goal_id?: string;
  community_goal_tier?: number;
  community_goal_name?: string;
}

export interface TapRewardListResponse {
  rewards: TapReward[];
  total: number;
}

export interface CreateTapRewardDto {
  user_id?: string;
  session_id?: string;
  reward_type: 'score_milestone' | 'combo_achievement' | 'session_completion' | 'leaderboard_position' | 'daily_bonus' | 'frenzy_bonus';
  reward_name: string;
  reward_description: string;
  reward_category: 'currency' | 'item' | 'badge' | 'title' | 'experience';
  reward_item_id: string;
  reward_quantity: number;
  reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  score_threshold?: number;
  combo_threshold?: number;
  score_earned_at?: number;
  combo_earned_at?: number;
  is_frenzy_reward?: boolean;
  reward_metadata?: string;
}

export interface UpdateTapRewardDto {
  session_id?: string;
  reward_type?: 'score_milestone' | 'combo_achievement' | 'session_completion' | 'leaderboard_position' | 'daily_bonus' | 'frenzy_bonus';
  reward_name?: string;
  reward_description?: string;
  reward_category?: 'currency' | 'item' | 'badge' | 'title' | 'experience';
  reward_item_id?: string;
  reward_quantity?: number;
  reward_rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  score_threshold?: number;
  combo_threshold?: number;
  is_claimed?: boolean;
  score_earned_at?: number;
  combo_earned_at?: number;
  is_frenzy_reward?: boolean;
  reward_metadata?: string;
}

// Tapathon API
export const tapathonApi = {
  // Taps CRUD
  getAllTaps: async (params?: { limit?: number; offset?: number; user_id?: string }): Promise<TapListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    const query = queryParams.toString();
    const response = await apiRequest<TapListResponse>(`/tap/taps${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getTapById: async (id: string): Promise<Tap> => {
    const response = await apiRequest<Tap>(`/tap/taps/${id}`);
    return response.data || response;
  },

  getTapsByUserId: async (userId: string, params?: { limit?: number; offset?: number }): Promise<TapListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    const response = await apiRequest<TapListResponse>(`/tap/taps/user/${userId}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  createTap: async (data: CreateTapDto): Promise<Tap> => {
    const response = await apiRequest<Tap>('/tap/taps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  updateTap: async (id: string, data: UpdateTapDto): Promise<Tap> => {
    const response = await apiRequest<Tap>(`/tap/taps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  deleteTap: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest<{ success: boolean; message: string }>(`/tap/taps/${id}`, {
      method: 'DELETE',
    });
    return response.data || response;
  },

  deleteTaps: async (tapIds: string[]): Promise<{ success: boolean; message: string; deleted_count: number }> => {
    const response = await apiRequest<{ success: boolean; message: string; deleted_count: number }>('/tap/taps', {
      method: 'DELETE',
      body: JSON.stringify({ tap_ids: tapIds }),
    });
    return response.data || response;
  },

  // Community Goals CRUD
  getAllCommunityGoals: async (params?: { limit?: number; offset?: number }): Promise<TapathonCommunityGoalListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    const response = await apiRequest<TapathonCommunityGoalListResponse>(`/tap/community-goals/all${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getCommunityGoalById: async (id: string): Promise<TapathonCommunityGoal> => {
    const response = await apiRequest<TapathonCommunityGoal>(`/tap/community-goals/${id}`);
    return response.data || response;
  },

  getCommunityGoalByTier: async (tierNumber: number): Promise<TapathonCommunityGoal> => {
    const response = await apiRequest<TapathonCommunityGoal>(`/tap/community-goals/tier/${tierNumber}`);
    return response.data || response;
  },

  createCommunityGoal: async (data: CreateTapathonCommunityGoalDto): Promise<TapathonCommunityGoal> => {
    const response = await apiRequest<TapathonCommunityGoal>('/tap/community-goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  updateCommunityGoal: async (id: string, data: UpdateTapathonCommunityGoalDto): Promise<TapathonCommunityGoal> => {
    const response = await apiRequest<TapathonCommunityGoal>(`/tap/community-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  updateCommunityGoalRewardIcon: async (id: string, data: UpdateTapathonCommunityGoalRewardIconDto): Promise<any> => {
    const response = await apiRequest<any>(`/tap/community-goals/${id}/reward-icon`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  deleteCommunityGoal: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest<{ success: boolean; message: string }>(`/tap/community-goals/${id}`, {
      method: 'DELETE',
    });
    return response.data || response;
  },

  // Tap Rewards CRUD
  getAllTapRewards: async (params?: { limit?: number; offset?: number; user_id?: string; is_claimed?: boolean }): Promise<TapRewardListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.is_claimed !== undefined) queryParams.append('is_claimed', params.is_claimed.toString());
    const query = queryParams.toString();
    const response = await apiRequest<TapRewardListResponse>(`/tap/rewards/all${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  getTapRewardById: async (id: string): Promise<TapReward> => {
    const response = await apiRequest<TapReward>(`/tap/rewards/${id}`);
    return response.data || response;
  },

  getTapRewardsByUserId: async (userId: string, params?: { limit?: number; offset?: number; is_claimed?: boolean }): Promise<TapRewardListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.is_claimed !== undefined) queryParams.append('is_claimed', params.is_claimed.toString());
    const query = queryParams.toString();
    const response = await apiRequest<TapRewardListResponse>(`/tap/rewards/user/${userId}${query ? `?${query}` : ''}`);
    return response.data || response;
  },

  createTapReward: async (data: CreateTapRewardDto): Promise<TapReward> => {
    const response = await apiRequest<TapReward>('/tap/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  updateTapReward: async (id: string, data: UpdateTapRewardDto): Promise<TapReward> => {
    const response = await apiRequest<TapReward>(`/tap/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  deleteTapReward: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest<{ success: boolean; message: string }>(`/tap/rewards/${id}`, {
      method: 'DELETE',
    });
    return response.data || response;
  },

  deleteTapRewards: async (rewardIds: string[]): Promise<{ success: boolean; message: string; deleted_count: number }> => {
    const response = await apiRequest<{ success: boolean; message: string; deleted_count: number }>('/tap/rewards', {
      method: 'DELETE',
      body: JSON.stringify({ reward_ids: rewardIds }),
    });
    return response.data || response;
  },
};
