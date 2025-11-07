'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  founderPackApi, 
  type FounderPackCommunityGoal, 
  type CreateFounderPackCommunityGoalDto, 
  type UpdateFounderPackCommunityGoalDto 
} from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';
import { ImagePicker } from '../../../components/ImagePicker';

export default function CommunityGoalsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<FounderPackCommunityGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FounderPackCommunityGoal | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
    }
  }, [isAuthenticated]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching community goals...');
      const data = await founderPackApi.getAllCommunityGoals();
      console.log('Goals fetched:', data);
      setGoals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Failed to fetch goals';
      setError(errorMessage);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGoal(null);
    setShowModal(true);
  };

  const handleEdit = (goal: FounderPackCommunityGoal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal? This cannot be undone.')) {
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      console.log('Deleting goal:', id);
      const result = await founderPackApi.deleteCommunityGoal(id);
      console.log('Goal deleted successfully:', result);
      setSuccess('Goal deleted successfully!');
      await fetchGoals();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Failed to delete goal';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const handleSuccess = async () => {
    handleClose();
    setSuccess('Goal saved successfully!');
    await fetchGoals();
    setTimeout(() => setSuccess(null), 3000);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community Goals</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage founder pack community goals ({goals.length} total)</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/founder-pack')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Create Goal
            </button>
            <button
              onClick={async () => {
                try {
                  setError(null);
                  setSuccess(null);
                  const status = await founderPackApi.getCommunityGoalsStatus();
                  alert(`Total Founders: ${status.total_founders || 0}\nCurrent Goals: ${status.current_goals?.length || 0}\nAchieved Goals: ${status.achieved_goals?.length || 0}`);
                } catch (err: any) {
                  setError(err.message || 'Failed to fetch status');
                }
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📊 View Status
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading goals...</div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No community goals found</p>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const progress = goal.target_sales_count > 0 
                ? Math.min((goal.current_sales_count / goal.target_sales_count) * 100, 100) 
                : 0;
              
              return (
                <div
                  key={goal.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
                    goal.is_achieved
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : goal.is_active
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {goal.goal_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tier {goal.goal_tier}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {goal.is_achieved && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                          Achieved
                        </span>
                      )}
                      {goal.is_active && !goal.is_achieved && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {goal.current_sales_count.toLocaleString()} / {goal.target_sales_count.toLocaleString()}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {goal.reward_icon_url && (
                        <img
                          src={goal.reward_icon_url}
                          alt="Reward"
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {goal.reward_name || goal.reward_item_name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {goal.reward_item_type} • Qty: {goal.reward_quantity}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="font-medium">Item ID:</span> {goal.reward_item_id}</div>
                      <div><span className="font-medium">Type:</span> {goal.reward_item_type}</div>
                      {goal.achieved_date && (
                        <div className="col-span-2"><span className="font-medium">Achieved:</span> {new Date(goal.achieved_date).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      disabled={goal.is_achieved}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  
                  {/* Quick Update Current Sales */}
                  {!goal.is_achieved && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Quick Update Sales Count
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={goal.current_sales_count}
                          onChange={async (e) => {
                            const newCount = parseInt(e.target.value) || 0;
                            try {
                              await founderPackApi.updateCommunityGoal(goal.id, {
                                current_sales_count: newCount,
                              });
                              await fetchGoals();
                              setSuccess('Sales count updated!');
                              setTimeout(() => setSuccess(null), 2000);
                            } catch (err: any) {
                              setError(err.message || 'Failed to update');
                              setTimeout(() => setError(null), 3000);
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <GoalFormModal
          goal={editingGoal}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

// Form Modal Component
function GoalFormModal({
  goal,
  onClose,
  onSuccess,
}: {
  goal: FounderPackCommunityGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!goal;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const [formData, setFormData] = useState({
    goal_name: goal?.goal_name || '',
    goal_tier: goal?.goal_tier || 1,
    target_sales_count: goal?.target_sales_count || 1000,
    current_sales_count: goal?.current_sales_count || 0,
    reward_item_id: goal?.reward_item_id || '',
    reward_item_type: (goal?.reward_item_type || 'emote') as 'emote' | 'currency' | 'accessory',
    reward_item_name: goal?.reward_item_name || '',
    reward_quantity: goal?.reward_quantity || 1,
    is_active: goal?.is_active ?? false,
    is_achieved: goal?.is_achieved ?? false,
    reward_icon_url: goal?.reward_icon_url || '',
    reward_name: goal?.reward_name || '',
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        goal_name: goal.goal_name || '',
        goal_tier: goal.goal_tier || 1,
        target_sales_count: goal.target_sales_count || 1000,
        current_sales_count: goal.current_sales_count || 0,
        reward_item_id: goal.reward_item_id || '',
        reward_item_type: goal.reward_item_type || 'emote',
        reward_item_name: goal.reward_item_name || '',
        reward_quantity: goal.reward_quantity || 1,
        is_active: goal.is_active ?? false,
        is_achieved: goal.is_achieved ?? false,
        reward_icon_url: goal.reward_icon_url || '',
        reward_name: goal.reward_name || '',
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && goal?.id) {
        const updateData: UpdateFounderPackCommunityGoalDto = {
          goal_name: formData.goal_name.trim(),
          goal_tier: formData.goal_tier,
          target_sales_count: formData.target_sales_count,
          current_sales_count: formData.current_sales_count,
          reward_item_id: formData.reward_item_id.trim(),
          reward_item_type: formData.reward_item_type,
          reward_item_name: formData.reward_item_name.trim(),
          reward_quantity: formData.reward_quantity,
          is_active: formData.is_active,
          is_achieved: formData.is_achieved,
          reward_icon_url: formData.reward_icon_url?.trim() || null,
          reward_name: formData.reward_name?.trim() || null,
        };
        console.log('Updating goal:', goal.id, updateData);
        const result = await founderPackApi.updateCommunityGoal(goal.id, updateData);
        console.log('Goal updated successfully:', result);
      } else {
        const createData: CreateFounderPackCommunityGoalDto = {
          goal_name: formData.goal_name.trim(),
          goal_tier: formData.goal_tier,
          target_sales_count: formData.target_sales_count,
          reward_item_id: formData.reward_item_id.trim(),
          reward_item_type: formData.reward_item_type,
          reward_item_name: formData.reward_item_name.trim(),
          reward_quantity: formData.reward_quantity,
          is_active: formData.is_active,
          reward_icon_url: formData.reward_icon_url?.trim() || null,
          reward_name: formData.reward_name?.trim() || null,
        };
        console.log('Creating goal:', createData);
        const result = await founderPackApi.createCommunityGoal(createData);
        console.log('Goal created successfully:', result);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Error saving goal:', err);
      const errorMessage = err.message || err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} goal`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Basic Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={formData.goal_name}
                  onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                  required
                  placeholder="e.g., Tipping Hat Emote"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tier Number *
                </label>
                <input
                  type="number"
                  value={formData.goal_tier}
                  onChange={(e) => setFormData({ ...formData, goal_tier: parseInt(e.target.value) || 1 })}
                  min={1}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Sales *
                </label>
                <input
                  type="number"
                  value={formData.target_sales_count}
                  onChange={(e) => setFormData({ ...formData, target_sales_count: parseInt(e.target.value) || 0 })}
                  min={1}
                  required
                  placeholder="1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Sales
                  </label>
                  <input
                    type="number"
                    value={formData.current_sales_count}
                    onChange={(e) => setFormData({ ...formData, current_sales_count: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reward Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Reward Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reward Item ID *
                </label>
                <input
                  type="text"
                  value={formData.reward_item_id}
                  onChange={(e) => setFormData({ ...formData, reward_item_id: e.target.value })}
                  required
                  placeholder="e.g., tipping_hat_emote"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reward Type *
                </label>
                <select
                  value={formData.reward_item_type}
                  onChange={(e) => setFormData({ ...formData, reward_item_type: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="emote">Emote</option>
                  <option value="currency">Currency</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reward Name *
                </label>
                <input
                  type="text"
                  value={formData.reward_item_name}
                  onChange={(e) => setFormData({ ...formData, reward_item_name: e.target.value })}
                  required
                  placeholder="e.g., Tipping Hat Emote"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={formData.reward_quantity}
                  onChange={(e) => setFormData({ ...formData, reward_quantity: parseInt(e.target.value) || 1 })}
                  min={1}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Display Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.reward_name}
                    onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
                    placeholder="e.g., Tipping Hat Emote (Exclusive)"
                    maxLength={200}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.reward_name && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, reward_name: '' })}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reward Icon URL (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.reward_icon_url}
                    onChange={(e) => setFormData({ ...formData, reward_icon_url: e.target.value })}
                    placeholder="Enter icon URL or pick from images"
                    maxLength={500}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Pick Image
                  </button>
                  {formData.reward_icon_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, reward_icon_url: '' })}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {(formData.reward_icon_url || formData.reward_name) && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <div className="flex items-center gap-3">
                      {formData.reward_icon_url && (
                        <img
                          src={formData.reward_icon_url}
                          alt="Preview"
                          className="w-12 h-12 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formData.reward_name || 'No display name'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Status
            </h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
              </label>
              {isEditing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_achieved}
                    onChange={(e) => setFormData({ ...formData, is_achieved: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Achieved</span>
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>

        {/* Image Picker Modal */}
        {showImagePicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 p-4">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Reward Icon</h3>
                <button
                  onClick={() => setShowImagePicker(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <ImagePicker
                  value={formData.reward_icon_url || ''}
                  onChange={(url) => {
                    setFormData({ ...formData, reward_icon_url: url });
                    setShowImagePicker(false);
                  }}
                  label="Select Icon"
                  placeholder="Choose an image"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
