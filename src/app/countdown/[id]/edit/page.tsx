'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { countdownApi, type CountdownEvent, type CreateCountdownRewardDto } from '../../../../lib/api';
import { Navigation } from '../../../../components/Navigation';

export default function EditCountdownPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<CountdownEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'cancelled',
    is_active: true,
  });
  const [rewards, setRewards] = useState<CreateCountdownRewardDto[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchEvent();
    }
  }, [isAuthenticated, id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await countdownApi.getById(id);
      setEvent(data);
      
      // Populate form with existing data
      setFormData({
        title: data.title,
        description: data.description,
        start_date: convertToLocalDateTime(data.start_date),
        end_date: convertToLocalDateTime(data.end_date),
        status: data.status as any,
        is_active: data.is_active,
      });

      // Populate rewards
      const sortedRewards = [...data.rewards].sort((a, b) => a.day_number - b.day_number);
      setRewards(
        sortedRewards.map((r) => ({
          day_number: r.day_number,
          reward_date: convertToLocalDateTime(r.reward_date),
          reward_name: r.reward_name,
          reward_description: r.reward_description,
          reward_type: r.reward_type as any,
          reward_item_id: r.reward_item_id || null,
          reward_quantity: r.reward_quantity,
          reward_rarity: r.reward_rarity as any,
          is_active: r.is_active,
        }))
      );
    } catch (err: any) {
      console.error('Error fetching countdown event:', err);
      setError(err.message || 'Failed to fetch 7 days countdown event');
    } finally {
      setLoading(false);
    }
  };

  const convertToLocalDateTime = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    // Convert to YYYY-MM-DDTHH:mm format for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const convertToISO = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return '';
    const date = new Date(dateTimeLocal);
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate all rewards are filled
      for (const reward of rewards) {
        if (!reward.reward_date || !reward.reward_name || !reward.reward_description) {
          throw new Error(`Please fill in all fields for Day ${reward.day_number}`);
        }
      }

      await countdownApi.update(id, {
        title: formData.title,
        description: formData.description,
        start_date: convertToISO(formData.start_date),
        end_date: convertToISO(formData.end_date),
        status: formData.status,
        is_active: formData.is_active,
        rewards: rewards.map((r) => ({
          day_number: r.day_number,
          reward_date: convertToISO(r.reward_date),
          reward_name: r.reward_name,
          reward_description: r.reward_description,
          reward_type: r.reward_type,
          reward_item_id: r.reward_item_id || null,
          reward_quantity: r.reward_quantity,
          reward_rarity: r.reward_rarity,
          is_active: r.is_active,
        })),
      });
      router.push(`/countdown/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update 7 days countdown event');
    } finally {
      setSaving(false);
    }
  };

  const updateReward = (index: number, field: string, value: any) => {
    const newRewards = [...rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setRewards(newRewards);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading event...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
          <button
            onClick={() => router.push('/countdown')}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Back to 7 Days Countdown Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/countdown/${id}`)}
            className="mb-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Event Details
          </button>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Edit 7 Days Countdown Event
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Event Details */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Event Details
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Active
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Rewards Section */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Rewards (7 Days) *
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      Day {reward.day_number}
                    </h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Reward Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={reward.reward_date}
                        onChange={(e) => updateReward(index, 'reward_date', e.target.value)}
                        required
                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Reward Name *
                      </label>
                      <input
                        type="text"
                        value={reward.reward_name}
                        onChange={(e) => updateReward(index, 'reward_name', e.target.value)}
                        required
                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Type *
                      </label>
                      <select
                        value={reward.reward_type}
                        onChange={(e) => updateReward(index, 'reward_type', e.target.value)}
                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      >
                        <option value="currency">Currency</option>
                        <option value="experience">Experience</option>
                        <option value="badge">Badge</option>
                        <option value="title">Title</option>
                        <option value="item">Item</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={reward.reward_quantity}
                        onChange={(e) => updateReward(index, 'reward_quantity', parseInt(e.target.value))}
                        required
                        min={1}
                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={reward.reward_description}
                        onChange={(e) => updateReward(index, 'reward_description', e.target.value)}
                        required
                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Rarity *
                      </label>
                      <select
                        value={reward.reward_rarity}
                        onChange={(e) => updateReward(index, 'reward_rarity', e.target.value)}
                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      >
                        <option value="common">Common</option>
                        <option value="rare">Rare</option>
                        <option value="epic">Epic</option>
                        <option value="legendary">Legendary</option>
                        <option value="exclusive">Exclusive</option>
                      </select>
                    </div>
                    {reward.reward_type === 'item' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Item ID
                        </label>
                        <input
                          type="number"
                          value={reward.reward_item_id || ''}
                          onChange={(e) => updateReward(index, 'reward_item_id', e.target.value ? parseInt(e.target.value) : null)}
                          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={reward.is_active}
                          onChange={(e) => updateReward(index, 'is_active', e.target.checked)}
                          className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Active
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/countdown/${id}`)}
              className="rounded-md border border-zinc-300 px-6 py-2 dark:border-zinc-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-6 py-2 text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

