'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { countdownApi, type CountdownEvent, type CountdownReward } from '../../lib/api';
import { Navigation } from '../../components/Navigation';

export default function DailyRewardsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [userClaims, setUserClaims] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'claims'>('rewards');
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchUserClaims();
    }
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use user details endpoint to get personalized claim status
      const data = await countdownApi.getUserDetails();
      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching countdown events:', err);
      setError(err.message || 'Failed to fetch countdown events');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserClaims = async () => {
    try {
      setClaimsLoading(true);
      const data = await countdownApi.getUserClaims();
      setUserClaims(data);
    } catch (err: any) {
      console.error('Error fetching user claims:', err);
    } finally {
      setClaimsLoading(false);
    }
  };

  const handleClaimReward = async (event: CountdownEvent, reward: CountdownReward) => {
    if (!reward.can_claim || reward.is_claimed) {
      return;
    }

    if (!confirm(`Claim ${reward.reward_name}?`)) {
      return;
    }

    try {
      setClaimingReward(reward.id);
      await countdownApi.claimReward(event.id, reward.day_number);
      // Refresh both events and claims
      await fetchEvents();
      await fetchUserClaims();
      alert(`Successfully claimed ${reward.reward_name}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to claim reward');
    } finally {
      setClaimingReward(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getRewardTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      currency: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      experience: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      title: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      item: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    };
    return colors[type] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  const activeEvents = events.filter(e => e.is_currently_active && e.is_active);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              7 Days Daily Rewards
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              View and claim your daily rewards from active countdown events
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'rewards'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
            }`}
          >
            Daily Rewards ({activeEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'claims'
                ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
            }`}
          >
            My Claims ({userClaims?.total_claims || 0})
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {activeTab === 'rewards' ? (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading rewards...</div>
              </div>
            ) : activeEvents.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  No active countdown events available
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                          {event.title}
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">{event.description}</p>
                        <div className="mt-2 flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                          <span>Start: {formatDate(event.start_date)}</span>
                          <span>End: {formatDate(event.end_date)}</span>
                          <span>Days Remaining: {event.days_remaining}</span>
                          {event.current_day && <span>Current Day: {event.current_day}</span>}
                        </div>
                      </div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Active
                      </span>
                    </div>

                    {/* Rewards Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {event.rewards
                        .sort((a, b) => a.day_number - b.day_number)
                        .map((reward) => (
                          <div
                            key={reward.id}
                            className={`rounded-lg border-2 p-4 ${
                              reward.can_claim && !reward.is_claimed
                                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                                : reward.is_claimed
                                ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                                : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-700/50'
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                Day {reward.day_number}
                              </span>
                              {reward.is_claimed && (
                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                                  ✓ Claimed
                                </span>
                              )}
                              {reward.can_claim && !reward.is_claimed && (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-400">
                                  Available
                                </span>
                              )}
                              {!reward.can_claim && !reward.is_claimed && (
                                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                                  Locked
                                </span>
                              )}
                            </div>

                            <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">
                              {reward.reward_name}
                            </h3>
                            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                              {reward.reward_description}
                            </p>

                            <div className="mb-3 flex flex-wrap gap-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                                  reward.reward_rarity
                                )}`}
                              >
                                {reward.reward_rarity}
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${getRewardTypeColor(
                                  reward.reward_type
                                )}`}
                              >
                                {reward.reward_type}
                              </span>
                              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                Qty: {reward.reward_quantity}
                              </span>
                            </div>

                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                              Available: {formatDateTime(reward.reward_date)}
                            </div>

                            {reward.can_claim && !reward.is_claimed && (
                              <button
                                onClick={() => handleClaimReward(event, reward)}
                                disabled={claimingReward === reward.id}
                                className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                              >
                                {claimingReward === reward.id ? 'Claiming...' : 'Claim Reward'}
                              </button>
                            )}
                            {!reward.can_claim && !reward.is_claimed && (
                              <div className="w-full rounded-md bg-zinc-200 px-4 py-2 text-center text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                                Not Available Yet
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* User Claims View */}
            {claimsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading your claims...</div>
              </div>
            ) : !userClaims || userClaims.total_claims === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  You haven't claimed any rewards yet
                </p>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  View Available Rewards
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-4 rounded-lg bg-white p-4 dark:bg-zinc-800">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Total Claims: {userClaims.total_claims}
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userClaims.claims.map((claim: any) => (
                    <div
                      key={claim.id}
                      className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {claim.countdown_event_title}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                          Day {claim.day_number}
                        </span>
                      </div>

                      <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">
                        {claim.reward_name}
                      </h3>
                      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {claim.reward_description}
                      </p>

                      <div className="mb-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                            claim.reward_rarity
                          )}`}
                        >
                          {claim.reward_rarity}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getRewardTypeColor(
                            claim.reward_type
                          )}`}
                        >
                          {claim.reward_type}
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Qty: {claim.reward_quantity}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Claimed: {formatDateTime(claim.claimed_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

