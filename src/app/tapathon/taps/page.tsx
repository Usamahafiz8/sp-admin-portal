'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { tapathonApi, type Tap, type CreateTapDto, type UpdateTapDto } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';

export default function TapsManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [taps, setTaps] = useState<Tap[]>([]);
  const [allTaps, setAllTaps] = useState<Tap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTap, setEditingTap] = useState<Tap | null>(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [selectedTaps, setSelectedTaps] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllTaps();
    }
  }, [isAuthenticated]);

  const fetchAllTaps = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all taps without limit - get all pages
      let allTapsData: Tap[] = [];
      let offset = 0;
      const limit = 100; // Fetch in batches of 100
      let hasMore = true;

      while (hasMore) {
        const data = await tapathonApi.getAllTaps({ limit, offset });
        if (data.taps && data.taps.length > 0) {
          allTapsData = [...allTapsData, ...data.taps];
          offset += limit;
          hasMore = data.taps.length === limit;
        } else {
          hasMore = false;
        }
      }

      setAllTaps(allTapsData);
      setTaps(allTapsData);
    } catch (err: any) {
      console.error('Error fetching taps:', err);
      setError(err.message || 'Failed to fetch taps');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allTaps];
    
    if (filterUserId.trim()) {
      filtered = filtered.filter(tap => 
        tap.user_id.toLowerCase().includes(filterUserId.toLowerCase().trim())
      );
    }
    
    setTaps(filtered);
  };

  const handleApplyFilters = () => {
    applyFilters();
  };

  const handleClearFilters = () => {
    setFilterUserId('');
    setTaps(allTaps);
  };

  const handleDeleteTap = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tap? This action cannot be undone.')) {
      return;
    }
    try {
      await tapathonApi.deleteTap(id);
      fetchAllTaps();
    } catch (err: any) {
      alert(err.message || 'Failed to delete tap');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaps.length === 0) {
      alert('Please select taps to delete');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedTaps.length} tap(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      await tapathonApi.deleteTaps(selectedTaps);
      setSelectedTaps([]);
      fetchAllTaps();
    } catch (err: any) {
      alert(err.message || 'Failed to delete taps');
    }
  };

  const handleEditTap = (tap: Tap) => {
    setEditingTap(tap);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTap(null);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      ios: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      android: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      web: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    };
    return colors[platform] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Taps Management</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage all tap records ({taps.length} shown, {allTaps.length} total)
            </p>
          </div>
          <div className="flex gap-2">
            {selectedTaps.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Delete Selected ({selectedTaps.length})
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              + Create Tap
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Filter by User ID
            </label>
            <input
              type="text"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              placeholder="Enter user ID..."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
            >
              Clear
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
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading taps...</div>
          </div>
        ) : taps.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">No taps found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Create Your First Tap
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
                        checked={selectedTaps.length === taps.length && taps.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaps(taps.map(t => t.id));
                          } else {
                            setSelectedTaps([]);
                          }
                        }}
                        className="rounded border-zinc-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Platform</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Created At</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {taps.map((tap) => (
                    <tr key={tap.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedTaps.includes(tap.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaps([...selectedTaps, tap.id]);
                            } else {
                              setSelectedTaps(selectedTaps.filter(id => id !== tap.id));
                            }
                          }}
                          className="rounded border-zinc-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                        {tap.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                        {tap.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPlatformColor(tap.platform)}`}>
                          {tap.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(tap.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTap(tap)}
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTap(tap.id)}
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
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <TapModal
          tap={editingTap}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            fetchAllTaps();
          }}
        />
      )}
    </div>
  );
}

// Tap Modal Component
function TapModal({
  tap,
  onClose,
  onSuccess,
}: {
  tap: Tap | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!tap;
  const [formData, setFormData] = useState<CreateTapDto>({
    user_id: tap?.user_id || '',
    platform: tap?.platform || 'web',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && tap?.id) {
        const updateData: UpdateTapDto = {
          platform: formData.platform,
        };
        await tapathonApi.updateTap(tap.id, updateData);
      } else {
        await tapathonApi.createTap(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} tap`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEditing ? 'Edit Tap' : 'Create New Tap'}
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
              Platform *
            </label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            >
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="web">Web</option>
            </select>
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
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Tap' : 'Create Tap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
