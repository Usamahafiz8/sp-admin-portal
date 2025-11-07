'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { tapathonApi, type CommunityGoal, type CreateCommunityGoalDto, type UpdateCommunityGoalDto } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';
import { ImagePicker } from '../../../components/ImagePicker';

export default function CommunityGoalsManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<CommunityGoal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CommunityGoal | null>(null);
  const [showIconModal, setShowIconModal] = useState(false);
  const [selectedGoalForIcon, setSelectedGoalForIcon] = useState<CommunityGoal | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
    }
  }, [isAuthenticated, page]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * limit;
      const data = await tapathonApi.getAllCommunityGoals({ limit, offset });
      setGoals(data.goals || []);
      setTotal(data.total || 0);
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
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to delete community goal');
    }
  };

  const handleEditGoal = (goal: CommunityGoal) => {
    setEditingGoal(goal);
    setShowCreateModal(true);
  };

  const handleUpdateIcon = (goal: CommunityGoal) => {
    setSelectedGoalForIcon(goal);
    setShowIconModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingGoal(null);
  };

  const handleCloseIconModal = () => {
    setShowIconModal(false);
    setSelectedGoalForIcon(null);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Community Goals Management</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage community goal tiers ({total} total)
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
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading community goals...</div>
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
                      : goal.is_active
                      ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                      : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {goal.tier_name}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Tier {goal.tier_number}
                      </p>
                    </div>
                    {goal.is_completed && (
                      <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {goal.current_taps.toLocaleString()} / {goal.target_taps.toLocaleString()}
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
                      <span>Status:</span>
                      <span className={`font-medium ${goal.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {goal.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {goal.completed_at && (
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span>{formatDate(goal.completed_at)}</span>
                      </div>
                    )}
                    {goal.reward_icon_url && (
                      <div className="mt-2">
                        <img
                          src={goal.reward_icon_url}
                          alt="Reward icon"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleUpdateIcon(goal)}
                      className="flex-1 rounded-md bg-purple-600 px-3 py-2 text-sm text-white transition-colors hover:bg-purple-700"
                    >
                      Icon
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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
                    className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-600"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-600"
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
        <CommunityGoalModal
          goal={editingGoal}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            fetchGoals();
          }}
        />
      )}

      {/* Icon Update Modal */}
      {showIconModal && selectedGoalForIcon && (
        <IconUpdateModal
          goal={selectedGoalForIcon}
          onClose={handleCloseIconModal}
          onSuccess={() => {
            handleCloseIconModal();
            fetchGoals();
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
  goal: CommunityGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!goal;
  const [formData, setFormData] = useState<CreateCommunityGoalDto | UpdateCommunityGoalDto>({
    tier_number: goal?.tier_number || 1,
    target_taps: goal?.target_taps || 1000000,
    tier_name: goal?.tier_name || '',
    ...(isEditing ? {
      is_completed: goal?.is_completed,
      current_taps: goal?.current_taps,
      is_active: goal?.is_active,
    } : {}),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && goal?.id) {
        await tapathonApi.updateCommunityGoal(goal.id, formData as UpdateCommunityGoalDto);
      } else {
        await tapathonApi.createCommunityGoal(formData as CreateCommunityGoalDto);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} community goal`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

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
              disabled={isEditing}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
            />
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

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tier Name *
            </label>
            <input
              type="text"
              value={formData.tier_name}
              onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
              required
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
                  value={(formData as UpdateCommunityGoalDto).current_taps || 0}
                  onChange={(e) => setFormData({ ...formData, current_taps: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(formData as UpdateCommunityGoalDto).is_completed || false}
                    onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Completed</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(formData as UpdateCommunityGoalDto).is_active !== undefined ? (formData as UpdateCommunityGoalDto).is_active : true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Active</span>
                </label>
              </div>
            </>
          )}

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
      </div>
    </div>
  );
}

// Icon Update Modal Component
function IconUpdateModal({
  goal,
  onClose,
  onSuccess,
}: {
  goal: CommunityGoal;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [iconUrl, setIconUrl] = useState(goal.reward_icon_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await tapathonApi.updateCommunityGoalRewardIcon(goal.id, { icon_url: iconUrl });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update icon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Update Reward Icon
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Reward Icon URL
            </label>
            <ImagePicker
              value={iconUrl}
              onChange={setIconUrl}
              label=""
              placeholder="Select icon image from Image Management"
            />
          </div>

          {iconUrl && (
            <div className="flex justify-center">
              <img
                src={iconUrl}
                alt="Reward icon preview"
                className="h-24 w-24 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

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
              className="flex-1 rounded-md bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Icon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

