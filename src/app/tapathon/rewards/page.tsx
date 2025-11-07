'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { tapathonApi, type TapReward, type CreateTapRewardDto, type UpdateTapRewardDto } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';

export default function TapRewardsManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [rewards, setRewards] = useState<TapReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReward, setEditingReward] = useState<TapReward | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterIsClaimed, setFilterIsClaimed] = useState<string>('');
  const [selectedRewards, setSelectedRewards] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRewards();
    }
  }, [isAuthenticated, page, filterUserId, filterIsClaimed]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * limit;
      const data = await tapathonApi.getAllTapRewards({
        limit,
        offset,
        user_id: filterUserId || undefined,
        is_claimed: filterIsClaimed ? filterIsClaimed === 'true' : undefined,
      });
      setRewards(data.rewards || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Error fetching tap rewards:', err);
      setError(err.message || 'Failed to fetch tap rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward? This action cannot be undone.')) {
      return;
    }
    try {
      await tapathonApi.deleteTapReward(id);
      fetchRewards();
    } catch (err: any) {
      alert(err.message || 'Failed to delete reward');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRewards.length === 0) {
      alert('Please select rewards to delete');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedRewards.length} reward(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      await tapathonApi.deleteTapRewards(selectedRewards);
      setSelectedRewards([]);
      fetchRewards();
    } catch (err: any) {
      alert(err.message || 'Failed to delete rewards');
    }
  };

  const handleEditReward = (reward: TapReward) => {
    setEditingReward(reward);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingReward(null);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
      rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      legendary: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      exclusive: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
    };
    return colors[rarity] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      currency: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      item: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      title: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      experience: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    };
    return colors[category] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  };

  const totalPages = Math.ceil(total / limit);

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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Tap Rewards Management</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage all tap rewards ({total} total)
            </p>
          </div>
          <div className="flex gap-2">
            {selectedRewards.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Delete Selected ({selectedRewards.length})
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              + Create Reward
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Filter by User ID
            </label>
            <input
              type="text"
              value={filterUserId}
              onChange={(e) => {
                setFilterUserId(e.target.value);
                setPage(1);
              }}
              placeholder="Enter user ID..."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Claim Status
            </label>
            <select
              value={filterIsClaimed}
              onChange={(e) => {
                setFilterIsClaimed(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            >
              <option value="">All</option>
              <option value="true">Claimed</option>
              <option value="false">Unclaimed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterUserId('');
                setFilterIsClaimed('');
                setPage(1);
              }}
              className="w-full rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading rewards...</div>
          </div>
        ) : rewards.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">No rewards found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Create Your First Reward
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <table className="w-full">
                <thead className="bg-zinc-100 dark:bg-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRewards.length === rewards.length && rewards.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRewards(rewards.map(r => r.reward_id));
                          } else {
                            setSelectedRewards([]);
                          }
                        }}
                        className="rounded border-zinc-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Reward Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Rarity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Earned</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {rewards.map((reward) => (
                    <tr key={reward.reward_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRewards.includes(reward.reward_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRewards([...selectedRewards, reward.reward_id]);
                            } else {
                              setSelectedRewards(selectedRewards.filter(id => id !== reward.reward_id));
                            }
                          }}
                          className="rounded border-zinc-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <div className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">
                            {reward.reward_name}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {reward.reward_description}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                        {reward.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {reward.reward_type.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(reward.reward_category)}`}>
                          {reward.reward_category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50 font-medium">
                        {reward.reward_quantity}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(reward.reward_rarity)}`}>
                          {reward.reward_rarity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {reward.is_claimed ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                            Claimed
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                            Unclaimed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(reward.earned_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditReward(reward)}
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReward(reward.reward_id)}
                            className="rounded-md bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Page {page} of {totalPages} ({total} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-md border border-zinc-300 px-4 py-2 disabled:opacity-50 dark:border-zinc-600"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-md border border-zinc-300 px-4 py-2 disabled:opacity-50 dark:border-zinc-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <TapRewardModal
          reward={editingReward}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            fetchRewards();
          }}
        />
      )}
    </div>
  );
}

// Tap Reward Modal Component
function TapRewardModal({
  reward,
  onClose,
  onSuccess,
}: {
  reward: TapReward | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!reward;
  const [formData, setFormData] = useState<CreateTapRewardDto & UpdateTapRewardDto>({
    user_id: reward?.user_id || '',
    session_id: reward?.session_id || '',
    reward_type: reward?.reward_type || 'daily_bonus',
    reward_name: reward?.reward_name || '',
    reward_description: reward?.reward_description || '',
    reward_category: reward?.reward_category || 'currency',
    reward_item_id: reward?.reward_item_id || '',
    reward_quantity: reward?.reward_quantity || 1,
    reward_rarity: reward?.reward_rarity || 'common',
    score_threshold: reward?.score_threshold || 0,
    combo_threshold: reward?.combo_threshold || 0,
    score_earned_at: reward?.score_earned_at || undefined,
    combo_earned_at: reward?.combo_earned_at || undefined,
    is_frenzy_reward: reward?.is_frenzy_reward || false,
    is_claimed: reward?.is_claimed || false,
    reward_metadata: reward?.community_goal_id ? JSON.stringify({ goal_id: reward.community_goal_id }) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && reward?.reward_id) {
        const updateData: UpdateTapRewardDto = {
          session_id: formData.session_id || undefined,
          reward_type: formData.reward_type,
          reward_name: formData.reward_name,
          reward_description: formData.reward_description,
          reward_category: formData.reward_category,
          reward_item_id: formData.reward_item_id,
          reward_quantity: formData.reward_quantity,
          reward_rarity: formData.reward_rarity,
          score_threshold: formData.score_threshold,
          combo_threshold: formData.combo_threshold,
          is_claimed: formData.is_claimed,
          score_earned_at: formData.score_earned_at,
          combo_earned_at: formData.combo_earned_at,
          is_frenzy_reward: formData.is_frenzy_reward,
          reward_metadata: formData.reward_metadata || undefined,
        };
        await tapathonApi.updateTapReward(reward.reward_id, updateData);
      } else {
        const createData: CreateTapRewardDto = {
          user_id: formData.user_id || undefined,
          session_id: formData.session_id || undefined,
          reward_type: formData.reward_type,
          reward_name: formData.reward_name,
          reward_description: formData.reward_description,
          reward_category: formData.reward_category,
          reward_item_id: formData.reward_item_id,
          reward_quantity: formData.reward_quantity,
          reward_rarity: formData.reward_rarity,
          score_threshold: formData.score_threshold,
          combo_threshold: formData.combo_threshold,
          score_earned_at: formData.score_earned_at,
          combo_earned_at: formData.combo_earned_at,
          is_frenzy_reward: formData.is_frenzy_reward,
          reward_metadata: formData.reward_metadata || undefined,
        };
        await tapathonApi.createTapReward(createData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} reward`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEditing ? 'Edit Tap Reward' : 'Create New Tap Reward'}
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
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  User ID (optional)
                </label>
                <input
                  type="text"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  placeholder="Leave empty to use authenticated user"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Session ID (optional)
              </label>
              <input
                type="text"
                value={formData.session_id}
                onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reward Type *
              </label>
              <select
                value={formData.reward_type}
                onChange={(e) => setFormData({ ...formData, reward_type: e.target.value as any })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="score_milestone">Score Milestone</option>
                <option value="combo_achievement">Combo Achievement</option>
                <option value="session_completion">Session Completion</option>
                <option value="leaderboard_position">Leaderboard Position</option>
                <option value="daily_bonus">Daily Bonus</option>
                <option value="frenzy_bonus">Frenzy Bonus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reward Category *
              </label>
              <select
                value={formData.reward_category}
                onChange={(e) => setFormData({ ...formData, reward_category: e.target.value as any })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="currency">Currency</option>
                <option value="item">Item</option>
                <option value="badge">Badge</option>
                <option value="title">Title</option>
                <option value="experience">Experience</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reward Name *
              </label>
              <input
                type="text"
                value={formData.reward_name}
                onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reward Description *
              </label>
              <textarea
                value={formData.reward_description}
                onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
                required
                rows={2}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Item ID *
              </label>
              <input
                type="text"
                value={formData.reward_item_id}
                onChange={(e) => setFormData({ ...formData, reward_item_id: e.target.value })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.reward_quantity}
                onChange={(e) => setFormData({ ...formData, reward_quantity: parseInt(e.target.value) || 1 })}
                required
                min={1}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Rarity *
              </label>
              <select
                value={formData.reward_rarity}
                onChange={(e) => setFormData({ ...formData, reward_rarity: e.target.value as any })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Score Threshold
              </label>
              <input
                type="number"
                value={formData.score_threshold || 0}
                onChange={(e) => setFormData({ ...formData, score_threshold: parseInt(e.target.value) || 0 })}
                min={0}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Combo Threshold
              </label>
              <input
                type="number"
                value={formData.combo_threshold || 0}
                onChange={(e) => setFormData({ ...formData, combo_threshold: parseInt(e.target.value) || 0 })}
                min={0}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            {isEditing && (
              <div className="md:col-span-2 flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_claimed || false}
                    onChange={(e) => setFormData({ ...formData, is_claimed: e.target.checked })}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Is Claimed
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_frenzy_reward || false}
                    onChange={(e) => setFormData({ ...formData, is_frenzy_reward: e.target.checked })}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Is Frenzy Reward
                  </span>
                </label>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reward Metadata (JSON)
              </label>
              <textarea
                value={formData.reward_metadata || ''}
                onChange={(e) => setFormData({ ...formData, reward_metadata: e.target.value })}
                placeholder='{"goal_id": "..."}'
                rows={2}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
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
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Reward' : 'Create Reward'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

