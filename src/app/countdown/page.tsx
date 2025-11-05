'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { countdownApi, inventoryApi, type CountdownEvent, type InventoryItem } from '../../lib/api';
import { Navigation } from '../../components/Navigation';

export default function CountdownManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await countdownApi.getAll();
      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching countdown events:', err);
      setError(err.message || 'Failed to fetch countdown events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this 7 days countdown event? This will also delete all associated rewards and claims.')) {
      return;
    }
    try {
      await countdownApi.delete(id);
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determine event status based on dates
  const getEventStatus = (event: CountdownEvent): 'running' | 'coming-soon' | 'complete' => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    // Complete: event has ended
    if (endDate < now || event.status === 'completed') {
      return 'complete';
    }

    // Coming Soon: event hasn't started yet
    if (startDate > now) {
      return 'coming-soon';
    }

    // Running: event is currently active (between start and end)
    if (event.is_currently_active && event.status === 'active' && event.is_active) {
      return 'running';
    }

    // Default to complete if not meeting other conditions
    return 'complete';
  };

  const getEventStatusBadge = (status: 'running' | 'coming-soon' | 'complete') => {
    switch (status) {
      case 'running':
        return (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
            🟢 Running
          </span>
        );
      case 'coming-soon':
        return (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            🔵 Coming Soon
          </span>
        );
      case 'complete':
        return (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            ⚫ Complete
          </span>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              7 Days Countdown Management
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage 7-day countdown events with daily rewards
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + Create 7 Days Countdown Event
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">No 7 days countdown events found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => {
              const eventStatus = getEventStatus(event);
              return (
                <div
                  key={event.id}
                  className={`rounded-lg border p-6 ${
                    eventStatus === 'running'
                      ? 'border-green-300 bg-green-50/30 dark:border-green-700 dark:bg-green-900/10'
                      : eventStatus === 'coming-soon'
                      ? 'border-blue-300 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-900/10'
                      : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                          {event.title}
                        </h2>
                        {getEventStatusBadge(eventStatus)}
                      </div>
                      <p className="mb-3 text-zinc-600 dark:text-zinc-400">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Start:</span>{' '}
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {formatDate(event.start_date)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">End:</span>{' '}
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {formatDate(event.end_date)}
                          </span>
                        </div>
                        {eventStatus === 'running' && (
                          <>
                            <div>
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">Days Remaining:</span>{' '}
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {event.days_remaining}
                              </span>
                            </div>
                            {event.current_day && (
                              <div>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">Current Day:</span>{' '}
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  Day {event.current_day}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {eventStatus === 'coming-soon' && (
                          <div>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Starts in:</span>{' '}
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {Math.ceil((new Date(event.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        )}
                        {eventStatus === 'complete' && (
                          <div>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Completed:</span>{' '}
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {formatDate(event.end_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                      {!event.is_active && (
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                {/* Rewards Grid */}
                <div className="mb-4">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Rewards (7 Days)
                  </h3>
                  <div className="grid gap-3 md:grid-cols-7">
                    {event.rewards
                      .sort((a, b) => a.day_number - b.day_number)
                      .map((reward) => (
                        <div
                          key={reward.id}
                          className={`group relative rounded-lg border-2 p-4 text-center transition-all hover:shadow-lg ${
                            reward.can_claim
                              ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                              : 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700/50'
                          }`}
                        >
                          {/* Reward Image */}
                          <div className="mb-3 flex items-center justify-center">
                            {reward.preview_url || reward.icon_url ? (
                              <img
                                src={reward.preview_url || reward.icon_url || ''}
                                alt={reward.reward_name}
                                className="h-16 w-16 rounded-lg object-cover border-2 border-zinc-300 dark:border-zinc-600"
                                onError={(e) => {
                                  // Fallback to icon if preview fails
                                  if (reward.icon_url && (e.target as HTMLImageElement).src !== reward.icon_url) {
                                    (e.target as HTMLImageElement).src = reward.icon_url || '';
                                  } else {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700">
                                <span className="text-2xl">
                                  {reward.reward_type === 'currency' ? '💰' : 
                                   reward.reward_type === 'experience' ? '⭐' : 
                                   reward.reward_type === 'badge' ? '🏅' : 
                                   reward.reward_type === 'title' ? '👑' : '📦'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Day Number */}
                          <div className="mb-1 font-bold text-zinc-900 dark:text-zinc-50">
                            Day {reward.day_number}
                          </div>

                          {/* Reward Name */}
                          <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 line-clamp-2">
                            {reward.reward_name}
                          </div>

                          {/* Reward Details */}
                          <div className="mb-2 space-y-1">
                            <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              <span className="font-medium capitalize">{reward.reward_type}</span>
                              {reward.reward_quantity > 1 && (
                                <span className="ml-1">× {reward.reward_quantity}</span>
                              )}
                            </div>
                            {reward.reward_rarity && (
                              <div className={`text-xs font-medium capitalize ${
                                reward.reward_rarity === 'legendary' ? 'text-purple-600 dark:text-purple-400' :
                                reward.reward_rarity === 'epic' ? 'text-blue-600 dark:text-blue-400' :
                                reward.reward_rarity === 'rare' ? 'text-green-600 dark:text-green-400' :
                                'text-zinc-600 dark:text-zinc-400'
                              }`}>
                                {reward.reward_rarity}
                              </div>
                            )}
                          </div>

                          {/* Status Indicators */}
                          <div className="mt-2 space-y-1">
                            {reward.can_claim && (
                              <div className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                                ✓ Available
                              </div>
                            )}
                            {reward.is_claimed && (
                              <div className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                ✓ Claimed
                              </div>
                            )}
                            {reward.reward_item_id && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                📦 Inventory Item
                              </div>
                            )}
                          </div>

                          {/* Hover Tooltip with Description */}
                          {reward.reward_description && (
                            <div className="absolute left-0 top-full z-10 mt-2 hidden w-64 rounded-lg bg-zinc-900 p-3 text-xs text-zinc-50 shadow-xl group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                              <div className="font-semibold mb-1">{reward.reward_name}</div>
                              <div className="text-zinc-300 dark:text-zinc-600">{reward.reward_description}</div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/countdown/${event.id}`)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => router.push(`/countdown/${event.id}/edit`)}
                    className="rounded-md bg-zinc-600 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCountdownModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

// Create Countdown Event Modal Component
function CreateCountdownModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'cancelled',
    is_active: true,
  });
  const [rewards, setRewards] = useState<Array<{
    day_number: number;
    reward_date: string;
    reward_name: string;
    reward_description: string;
    reward_type: 'item' | 'currency' | 'experience' | 'badge' | 'title';
    reward_item_id?: string | null;
    reward_quantity: number;
    reward_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
    is_active: boolean;
  }>>(
    Array.from({ length: 7 }, (_, i) => ({
      day_number: i + 1,
      reward_date: '',
      reward_name: '',
      reward_description: '',
      reward_type: 'currency' as const,
      reward_item_id: null,
      reward_quantity: 100,
      reward_rarity: 'common' as const,
      is_active: true,
    }))
  );
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate all rewards are filled
      for (const reward of rewards) {
        if (!reward.reward_date || !reward.reward_name || !reward.reward_description) {
          throw new Error(`Please fill in all fields for Day ${reward.day_number}`);
        }
        // If reward type is 'item', must have an inventory item selected
        if (reward.reward_type === 'item' && !reward.reward_item_id) {
          throw new Error(`Day ${reward.day_number}: Please select an inventory item for item rewards`);
        }
      }

      // Convert datetime-local to ISO format
      const convertToISO = (dateTimeLocal: string): string => {
        if (!dateTimeLocal) return '';
        // datetime-local format: "YYYY-MM-DDTHH:mm"
        // Convert to ISO: "YYYY-MM-DDTHH:mm:ss.sssZ"
        const date = new Date(dateTimeLocal);
        return date.toISOString();
      };

      await countdownApi.create({
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
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create 7 days countdown event');
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory items when modal opens
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setLoadingItems(true);
        const items = await inventoryApi.getAll();
        setInventoryItems(items);
      } catch (err) {
        console.error('Error fetching inventory items:', err);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchInventoryItems();
  }, []);

  const updateReward = (index: number, field: string, value: any) => {
    const newRewards = [...rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    
    // If changing reward_type to 'item', reset item_id if it was set
    if (field === 'reward_type' && value !== 'item') {
      newRewards[index].reward_item_id = null;
    }
    
    // If selecting an inventory item, auto-fill name and description
    if (field === 'reward_item_id' && value) {
      const selectedItem = inventoryItems.find(item => item.id === value);
      if (selectedItem) {
        newRewards[index].reward_name = selectedItem.item_name;
        newRewards[index].reward_description = selectedItem.item_description || '';
        newRewards[index].reward_rarity = selectedItem.rarity as any;
        newRewards[index].reward_quantity = 1;
      }
    }
    
    setRewards(newRewards);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Create 7 Days Countdown Event
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

          {/* Event Details */}
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
          </div>

          {/* Rewards Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Rewards (7 Days) *
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      Day {reward.day_number}
                    </h4>
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
                      <div className="md:col-span-2 lg:col-span-4">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Select Inventory Item * (Links reward to inventory)
                        </label>
                        {loadingItems ? (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">Loading items...</div>
                        ) : (
                          <select
                            value={reward.reward_item_id || ''}
                            onChange={(e) => updateReward(index, 'reward_item_id', e.target.value || null)}
                            required={reward.reward_type === 'item'}
                            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                          >
                            <option value="">-- Select an inventory item --</option>
                            {inventoryItems
                              .filter(item => item.is_active)
                              .map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.item_name} ({item.item_id}) - {item.item_type} - {item.rarity}
                                </option>
                              ))}
                          </select>
                        )}
                        {reward.reward_item_id && (
                          <div className="mt-2 rounded-md bg-blue-50 p-2 text-xs dark:bg-blue-900/20">
                            <span className="font-medium text-blue-800 dark:text-blue-400">✓ Linked to Inventory</span>
                            <p className="text-blue-600 dark:text-blue-300 mt-1">
                              {(() => {
                                const selectedItem = inventoryItems.find(item => item.id === reward.reward_item_id);
                                return selectedItem 
                                  ? `Item ID: ${selectedItem.item_id} | Type: ${selectedItem.item_type} | Rarity: ${selectedItem.rarity}`
                                  : 'Item details will be loaded';
                              })()}
                            </p>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Select an item from inventory. Reward will be delivered to user's inventory when claimed.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

