'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { countdownApi, type CountdownEvent } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';

export default function CountdownDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<CountdownEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error('Error fetching countdown event:', err);
      setError(err.message || 'Failed to fetch 7 days countdown event');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
      case 'rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'legendary':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'exclusive':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
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

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/countdown')}
            className="mb-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Countdown Events
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{event.title}</h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{event.description}</p>
            </div>
            <div className="flex gap-2">
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
        </div>

        {/* Event Info */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Start Date</div>
            <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {formatDate(event.start_date)}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">End Date</div>
            <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {formatDate(event.end_date)}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Days Remaining</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {event.days_remaining}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Current Day</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {event.current_day || '-'}
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Rewards (7 Days)
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {event.rewards
              .sort((a, b) => a.day_number - b.day_number)
              .map((reward) => (
                <div
                  key={reward.id}
                  className={`rounded-lg border-2 p-5 transition-all hover:shadow-lg ${
                    reward.can_claim
                      ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                      : 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700/50'
                  }`}
                >
                  {/* Reward Image */}
                  <div className="mb-4 flex items-center justify-center">
                    {reward.preview_url || reward.icon_url ? (
                      <img
                        src={reward.preview_url || reward.icon_url || ''}
                        alt={reward.reward_name}
                        className="h-24 w-24 rounded-lg object-cover border-2 border-zinc-300 dark:border-zinc-600"
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
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700">
                        <span className="text-4xl">
                          {reward.reward_type === 'currency' ? '💰' : 
                           reward.reward_type === 'experience' ? '⭐' : 
                           reward.reward_type === 'badge' ? '🏅' : 
                           reward.reward_type === 'title' ? '👑' : '📦'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      Day {reward.day_number}
                    </span>
                    {reward.can_claim && (
                      <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                        Available
                      </span>
                    )}
                    {reward.is_claimed && (
                      <span className="rounded-full bg-blue-200 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                        ✓ Claimed
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {reward.reward_name}
                  </h3>
                  {reward.reward_description && (
                    <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {reward.reward_description}
                    </p>
                  )}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getRarityColor(
                        reward.reward_rarity
                      )}`}
                    >
                      {reward.reward_rarity}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium capitalize text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {reward.reward_type}
                    </span>
                    {reward.reward_quantity > 1 && (
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                        × {reward.reward_quantity}
                      </span>
                    )}
                  </div>
                  {reward.reward_item_id && (
                    <div className="mb-2 text-xs text-blue-600 dark:text-blue-400">
                      📦 Linked to Inventory Item
                    </div>
                  )}
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Claimable: {formatDate(reward.reward_date)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => router.push(`/countdown/${id}/edit`)}
            className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Edit Event
          </button>
          <button
            onClick={() => router.push('/countdown')}
            className="rounded-md border border-zinc-300 px-6 py-2 dark:border-zinc-600"
          >
            Back to List
          </button>
        </div>
      </div>
    </div>
  );
}

