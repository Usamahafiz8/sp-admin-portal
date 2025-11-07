'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { tapathonApi, type TapathonCommunityGoal, type CreateTapathonCommunityGoalDto, type UpdateTapathonCommunityGoalDto } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';
import { ImagePicker } from '../../../components/ImagePicker';

export default function CommunityGoalsManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<TapathonCommunityGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TapathonCommunityGoal | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllGoals();
    }
  }, [isAuthenticated]);

  const fetchAllGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all goals without limit - get all pages
      let allGoalsData: TapathonCommunityGoal[] = [];
      let offset = 0;
      const limit = 100; // Fetch in batches of 100
      let hasMore = true;

      while (hasMore) {
        const data = await tapathonApi.getAllCommunityGoals({ limit, offset });
        if (data.goals && data.goals.length > 0) {
          allGoalsData = [...allGoalsData, ...data.goals];
          offset += limit;
          hasMore = data.goals.length === limit;
        } else {
          hasMore = false;
        }
      }

      setGoals(allGoalsData);
    } catch (err: any) {
      console.error('Error fetching community goals:', err);
      setError(err.message || 'Failed to fetch community goals');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this community goal? This action cannot be undone.')) {
      return;
    }
    try {
      await tapathonApi.deleteCommunityGoal(id);
      fetchAllGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to delete community goal');
    }
  };

  const handleEditGoal = (goal: TapathonCommunityGoal) => {
    console.log('Editing goal:', goal);
    setEditingGoal(goal);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingGoal(null);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Community Goals Management</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage community goal tiers ({goals.length} total)
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + Create Goal
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading goals...</div>
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">No community goals found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`rounded-lg border-2 p-6 ${
                    goal.is_completed
                      ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                      : (goal.is_active === true || goal.is_active === 1)
                      ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                      : 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700/50'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {goal.tier_name}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Tier {goal.tier_number}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {goal.is_completed && (
                        <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                          Completed
                        </span>
                      )}
                      {(goal.is_active === true || goal.is_active === 1) && !goal.is_completed && (
                        <span className="rounded-full bg-blue-200 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {formatNumber(goal.current_taps)} / {formatNumber(goal.target_taps)}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {goal.progress_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-full bg-blue-600 transition-all dark:bg-blue-400"
                        style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>Target Taps:</span>
                      <span className="font-medium">{formatNumber(goal.target_taps)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Taps:</span>
                      <span className="font-medium">{formatNumber(goal.current_taps)}</span>
                    </div>
                    {goal.completed_at && (
                      <div className="flex justify-between">
                        <span>Completed At:</span>
                        <span className="font-medium">{formatDate(goal.completed_at)}</span>
                      </div>
                    )}
                    {(goal.reward_name || (goal as any)?.RewardName) && (
                      <div className="mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-600">
                        <div className="flex items-center gap-2">
                          {(goal.reward_icon_url || (goal as any)?.RewardIcon) && (
                            <img
                              src={goal.reward_icon_url || (goal as any)?.RewardIcon || ''}
                              alt="Reward icon"
                              className="h-8 w-8 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-zinc-900 dark:text-zinc-50">
                              {goal.reward_name || (goal as any)?.RewardName}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CommunityGoalModal
          goal={editingGoal}
          onClose={handleCloseModal}
          onSuccess={async () => {
            handleCloseModal();
            // Small delay to ensure API has processed the update
            await new Promise(resolve => setTimeout(resolve, 300));
            await fetchAllGoals();
          }}
        />
      )}
    </div>
  );
}

// Community Goal Modal Component
function CommunityGoalModal({
  goal,
  onClose,
  onSuccess,
}: {
  goal: TapathonCommunityGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!goal;
  // Handle is_active which might come as 1/0 (number) or boolean
  const normalizeIsActive = (value: any): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    return Boolean(value);
  };

  // Get reward name from either reward_name or RewardName field
  const getRewardName = (goal: TapathonCommunityGoal | null): string => {
    if (!goal) return '';
    return (goal as any)?.reward_name || (goal as any)?.RewardName || '';
  };

  const [formData, setFormData] = useState<CreateTapathonCommunityGoalDto & UpdateTapathonCommunityGoalDto>({
    tier_number: goal?.tier_number || 1,
    target_taps: goal?.target_taps || 1000000,
    tier_name: goal?.tier_name || '',
    is_completed: goal?.is_completed || false,
    current_taps: goal?.current_taps || 0,
    is_active: goal ? normalizeIsActive(goal.is_active) : true,
    reward_name: getRewardName(goal),
  });
  // Get reward icon from either reward_icon_url or RewardIcon field
  const getRewardIcon = (goal: TapathonCommunityGoal | null): string => {
    if (!goal) return '';
    return goal.reward_icon_url || (goal as any)?.RewardIcon || '';
  };

  const [rewardIconUrl, setRewardIconUrl] = useState(getRewardIcon(goal));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRewardIconModal, setShowRewardIconModal] = useState(false);

  // Update form data when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        tier_number: goal.tier_number || 1,
        target_taps: goal.target_taps || 1000000,
        tier_name: goal.tier_name || '',
        is_completed: goal.is_completed || false,
        current_taps: goal.current_taps || 0,
        is_active: normalizeIsActive(goal.is_active),
        reward_name: getRewardName(goal),
      });
      setRewardIconUrl(getRewardIcon(goal));
    } else {
      // Reset form when creating new goal
      setFormData({
        tier_number: 1,
        target_taps: 1000000,
        tier_name: '',
        is_completed: false,
        current_taps: 0,
        is_active: true,
        reward_name: '',
      });
      setRewardIconUrl('');
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && goal?.id) {
        // Prepare update data - include all fields that can be updated
        const updateData: UpdateTapathonCommunityGoalDto = {
          tier_number: formData.tier_number,
          target_taps: formData.target_taps,
          tier_name: formData.tier_name,
          is_completed: formData.is_completed !== undefined ? formData.is_completed : false,
          current_taps: formData.current_taps !== undefined ? formData.current_taps : 0,
          is_active: formData.is_active !== undefined ? formData.is_active : true,
          // Handle reward_name: always send it (empty string becomes null to clear it)
          reward_name: formData.reward_name?.trim() || null,
          // Handle reward_icon_url: always send it (empty string becomes null to clear it)
          reward_icon_url: rewardIconUrl?.trim() || null,
        };

        console.log('Updating community goal:', goal.id, updateData);
        
        // Update all fields in a single API call
        const updatedGoal = await tapathonApi.updateCommunityGoal(goal.id, updateData);
        console.log('Goal updated successfully:', updatedGoal);
      } else {
        // Create new goal
        const createData = {
          tier_number: formData.tier_number,
          target_taps: formData.target_taps,
          tier_name: formData.tier_name,
        };
        console.log('Creating community goal:', createData);
        await tapathonApi.createCommunityGoal(createData);
      }
      
      // Success - close modal and refresh
      onSuccess();
    } catch (err: any) {
      console.error('Error saving community goal:', err);
      const errorMessage = err.message || err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} community goal`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEditing ? 'Edit Community Goal' : 'Create New Community Goal'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tier Number *
              </label>
              <input
                type="number"
                value={formData.tier_number}
                onChange={(e) => setFormData({ ...formData, tier_number: parseInt(e.target.value) || 1 })}
                min={1}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
              {isEditing && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Warning: Changing tier number may affect other goals
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Target Taps *
              </label>
              <input
                type="number"
                value={formData.target_taps}
                onChange={(e) => setFormData({ ...formData, target_taps: parseInt(e.target.value) || 0 })}
                min={1}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tier Name *
              </label>
              <input
                type="text"
                value={formData.tier_name}
                onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                required
                placeholder="e.g., Bronze Tier"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            {isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Current Taps
                  </label>
                  <input
                    type="number"
                    value={formData.current_taps}
                    onChange={(e) => setFormData({ ...formData, current_taps: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Current number of taps achieved for this tier
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Status
                  </label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_completed || false}
                        onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Completed
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active ?? true}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Active
                      </span>
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Reward Name
                  </label>
                  <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.reward_name || ''}
                    onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
                      placeholder={'e.g., "100 Dino-Dough" or "Buddy Founder Badge" (Exclusive)'}
                      maxLength={200}
                      className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                  />
                    {formData.reward_name && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, reward_name: '' })}
                        className="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 whitespace-nowrap"
                        title="Clear reward name"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Name of the reward for this tier (optional). Leave empty to remove the reward name.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Reward Icon URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={rewardIconUrl}
                      onChange={(e) => setRewardIconUrl(e.target.value)}
                      placeholder="Enter icon URL or select from images"
                      maxLength={500}
                      className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRewardIconModal(true)}
                      className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 whitespace-nowrap"
                    >
                      Pick Image
                    </button>
                    {rewardIconUrl && (
                      <button
                        type="button"
                        onClick={() => setRewardIconUrl('')}
                        className="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 whitespace-nowrap"
                        title="Clear icon URL"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    URL for the reward icon image (optional). Leave empty to remove the icon.
                  </p>
                  {(rewardIconUrl || formData.reward_name) && (
                    <div className="mt-3 rounded-lg border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-700/50">
                      <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Preview:</p>
                      <div className="flex items-center gap-3">
                  {rewardIconUrl && (
                      <img
                        src={rewardIconUrl}
                            alt="Reward icon preview"
                            className="h-12 w-12 rounded-lg object-cover border border-zinc-300 dark:border-zinc-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                        )}
                        <div className="flex-1">
                          {formData.reward_name ? (
                            <div className="font-medium text-zinc-900 dark:text-zinc-50">
                              {formData.reward_name}
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                              No reward name set
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>

        {/* Image Picker Modal */}
        {showRewardIconModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70">
            <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-zinc-800 m-4 max-h-[90vh] overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Select Reward Icon</h3>
                <button
                  onClick={() => setShowRewardIconModal(false)}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ImagePicker
                value={rewardIconUrl}
                onChange={(url) => {
                  setRewardIconUrl(url);
                  setShowRewardIconModal(false);
                }}
                label="Select Icon"
                placeholder="Choose an image"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

