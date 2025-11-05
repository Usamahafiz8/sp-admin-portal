'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  communityGoalsApi,
  type CommunityGoal,
  type CommunityGoalProgress,
  type CommunityGoalReward,
  type CreateCommunityGoalDto,
  type CommunityGoalStats,
  type CommunityGoalRewardConfig,
} from '../../lib/api';
import { Navigation } from '../../components/Navigation';

export default function CommunityGoalsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
  const [goals, setGoals] = useState<CommunityGoal[]>([]);
  const [userProgress, setUserProgress] = useState<CommunityGoalProgress[]>([]);
  const [userRewards, setUserRewards] = useState<CommunityGoalReward[]>([]);
  const [stats, setStats] = useState<CommunityGoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveGoals();
      if (activeTab === 'user') {
        fetchUserProgress();
        fetchUserRewards();
      } else {
        fetchStats();
      }
    }
  }, [isAuthenticated, activeTab]);

  const fetchActiveGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communityGoalsApi.getActiveGoals();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err.message || 'Failed to fetch community goals');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const data = await communityGoalsApi.getUserProgress();
      setUserProgress(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching user progress:', err);
    }
  };

  const fetchUserRewards = async () => {
    try {
      const data = await communityGoalsApi.getUserRewards();
      setUserRewards(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching user rewards:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await communityGoalsApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
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

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Ended';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'community_exclusive':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'exclusive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'currency':
        return '💰';
      case 'item':
        return '📦';
      case 'badge':
        return '🏅';
      case 'title':
        return '👑';
      case 'experience':
        return '⭐';
      case 'frenzy_points':
        return '⚡';
      default:
        return '🎁';
    }
  };

  const getGoalTypeIcon = (goalType: string) => {
    switch (goalType) {
      case 'tapathon_score':
        return '🎯';
      case 'frenzy_sessions':
        return '⚡';
      case 'easter_egg_redemptions':
        return '🥚';
      case 'poll_votes':
        return '📊';
      case 'user_registrations':
        return '👥';
      case 'founder_pack_sales':
        return '💎';
      default:
        return '🎯';
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Community Goals</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Participate in community goals and claim your rewards
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'admin' && (
              <>
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-700"
                >
                  View Stats
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  + Create Goal
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('user')}
              className={`border-b-2 px-4 py-2 font-medium transition-colors ${
                activeTab === 'user'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              User View
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`border-b-2 px-4 py-2 font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              Admin Management
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {activeTab === 'admin' ? (
          <AdminTab
            goals={goals}
            loading={loading}
            onRefresh={fetchActiveGoals}
            getGoalTypeIcon={getGoalTypeIcon}
            formatDate={formatDate}
            formatTimeRemaining={formatTimeRemaining}
          />
        ) : (
          <UserTab
            goals={goals}
            userProgress={userProgress}
            userRewards={userRewards}
            loading={loading}
            onRefresh={fetchActiveGoals}
            onRefreshProgress={fetchUserProgress}
            onRefreshRewards={fetchUserRewards}
            getRarityColor={getRarityColor}
            getCategoryIcon={getCategoryIcon}
            getGoalTypeIcon={getGoalTypeIcon}
            formatDate={formatDate}
            formatTimeRemaining={formatTimeRemaining}
          />
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateGoalModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchActiveGoals();
              fetchStats();
            }}
          />
        )}

        {/* Stats Modal */}
        {showStatsModal && stats && (
          <StatsModal stats={stats} onClose={() => setShowStatsModal(false)} formatDate={formatDate} />
        )}
      </div>
    </div>
  );
}

// Admin Tab Component
function AdminTab({
  goals,
  loading,
  onRefresh,
  getGoalTypeIcon,
  formatDate,
  formatTimeRemaining,
}: {
  goals: CommunityGoal[];
  loading: boolean;
  onRefresh: () => void;
  getGoalTypeIcon: (type: string) => string;
  formatDate: (date: string) => string;
  formatTimeRemaining: (seconds: number) => string;
}) {
  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading goals...</div>
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">No community goals found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <div
              key={goal.goal_id}
              className={`rounded-lg border-2 p-5 ${
                goal.is_achieved
                  ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                  : goal.is_active
                  ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                  : 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700/50'
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{getGoalTypeIcon(goal.goal_type)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        {goal.goal_name}
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                        {goal.goal_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {goal.goal_description}
                  </p>
                </div>
                {goal.is_achieved && (
                  <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                    Achieved
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {goal.completion_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full bg-blue-600 transition-all dark:bg-blue-400"
                    style={{ width: `${Math.min(goal.completion_percentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mb-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Participants:</span>
                  <span className="font-medium">{goal.participants_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Status:</span>
                  <span className={`font-medium ${goal.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {goal.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {goal.is_active && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Time Remaining:</span>
                    <span className="font-medium">{formatTimeRemaining(goal.time_remaining_seconds)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={onRefresh}
                className="w-full rounded-md bg-zinc-600 px-3 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
              >
                Refresh
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// User Tab Component
function UserTab({
  goals,
  userProgress,
  userRewards,
  loading,
  onRefresh,
  onRefreshProgress,
  onRefreshRewards,
  getRarityColor,
  getCategoryIcon,
  getGoalTypeIcon,
  formatDate,
  formatTimeRemaining,
}: {
  goals: CommunityGoal[];
  userProgress: CommunityGoalProgress[];
  userRewards: CommunityGoalReward[];
  loading: boolean;
  onRefresh: () => void;
  onRefreshProgress: () => void;
  onRefreshRewards: () => void;
  getRarityColor: (rarity: string) => string;
  getCategoryIcon: (category: string) => string;
  getGoalTypeIcon: (type: string) => string;
  formatDate: (date: string) => string;
  formatTimeRemaining: (seconds: number) => string;
}) {
  const [contributionValues, setContributionValues] = useState<Record<string, number>>({});
  const [contributing, setContributing] = useState<string | null>(null);
  const [contributionError, setContributionError] = useState<Record<string, string>>({});
  const [contributionSuccess, setContributionSuccess] = useState<Record<string, string>>({});
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  const handleContribute = async (goalId: string) => {
    const contributionValue = contributionValues[goalId] || 1;
    if (!contributionValue || contributionValue < 1) {
      setContributionError({
        ...contributionError,
        [goalId]: 'Please enter a valid contribution value',
      });
      return;
    }

    try {
      setContributing(goalId);
      setContributionError({ ...contributionError, [goalId]: '' });
      setContributionSuccess({ ...contributionSuccess, [goalId]: '' });
      await communityGoalsApi.contribute({
        goal_id: goalId,
        contribution_value: contributionValue,
        platform: 'web',
      });
      setContributionSuccess({
        ...contributionSuccess,
        [goalId]: `Successfully contributed ${contributionValue}!`,
      });
      setContributionValues({ ...contributionValues, [goalId]: 1 });
      await onRefresh();
      await onRefreshProgress();
      await onRefreshRewards();
    } catch (err: any) {
      console.error('Error contributing:', err);
      setContributionError({
        ...contributionError,
        [goalId]: err.message || 'Failed to contribute',
      });
    } finally {
      setContributing(null);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      setClaimingReward(rewardId);
      await communityGoalsApi.claimReward(rewardId);
      await onRefreshRewards();
    } catch (err: any) {
      console.error('Error claiming reward:', err);
      alert(err.message || 'Failed to claim reward');
    } finally {
      setClaimingReward(null);
    }
  };

  const unclaimedRewards = userRewards.filter((r) => !r.is_claimed);
  const claimedRewards = userRewards.filter((r) => r.is_claimed);

  return (
    <div className="space-y-6">
      {/* Active Goals */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Active Community Goals ({goals.length})
        </h2>
        {loading ? (
          <div className="text-center text-zinc-600 dark:text-zinc-400">Loading...</div>
        ) : goals.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No active community goals available</p>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const userProgressForGoal = userProgress.find((p) => p.goal_id === goal.goal_id);
              return (
                <div
                  key={goal.goal_id}
                  className={`rounded-lg border-2 p-4 ${
                    goal.is_achieved
                      ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                      : 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xl">{getGoalTypeIcon(goal.goal_type)}</span>
                        <div>
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                            {goal.goal_name}
                          </h3>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {goal.goal_description}
                          </p>
                        </div>
                      </div>
                    </div>
                    {goal.is_achieved && (
                      <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                        ✓ Achieved
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {goal.completion_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-full bg-blue-600 transition-all dark:bg-blue-400"
                        style={{ width: `${Math.min(goal.completion_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* User Contribution */}
                  {userProgressForGoal && (
                    <div className="mb-3 rounded-lg bg-zinc-100 p-2 text-xs dark:bg-zinc-700">
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Your Contribution:</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {userProgressForGoal.cumulative_value.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Your Percentage:</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {userProgressForGoal.user_percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Contribution Form */}
                  {goal.is_active && !goal.is_achieved && (
                    <>
                      <div className="mb-3 flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={contributionValues[goal.goal_id] || 1}
                          onChange={(e) =>
                            setContributionValues({
                              ...contributionValues,
                              [goal.goal_id]: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                        />
                        <button
                          onClick={() => handleContribute(goal.goal_id)}
                          disabled={contributing === goal.goal_id}
                          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400"
                        >
                          {contributing === goal.goal_id ? 'Contributing...' : 'Contribute'}
                        </button>
                      </div>
                      {contributionError[goal.goal_id] && (
                        <div className="mb-2 text-xs text-red-600 dark:text-red-400">
                          {contributionError[goal.goal_id]}
                        </div>
                      )}
                      {contributionSuccess[goal.goal_id] && (
                        <div className="mb-2 text-xs text-green-600 dark:text-green-400">
                          {contributionSuccess[goal.goal_id]}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>
                      {goal.participants_count} participants • {formatTimeRemaining(goal.time_remaining_seconds)} left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Rewards */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          My Rewards ({userRewards.length})
        </h2>
        {unclaimedRewards.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Unclaimed Rewards ({unclaimedRewards.length})
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {unclaimedRewards.map((reward) => (
                <div
                  key={reward.reward_id}
                  className="rounded-lg border-2 border-green-400 bg-green-50 p-4 dark:border-green-600 dark:bg-green-900/20"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(reward.reward_category)}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {reward.reward_name}
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {reward.reward_description}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                        reward.reward_rarity
                      )}`}
                    >
                      {reward.reward_rarity}
                    </span>
                  </div>
                  <div className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {reward.reward_category} × {reward.reward_quantity}
                  </div>
                  <button
                    onClick={() => handleClaimReward(reward.reward_id)}
                    disabled={claimingReward === reward.reward_id}
                    className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-zinc-400"
                  >
                    {claimingReward === reward.reward_id ? 'Claiming...' : 'Claim Reward'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {claimedRewards.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Claimed Rewards ({claimedRewards.length})
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {claimedRewards.map((reward) => (
                <div
                  key={reward.reward_id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-700"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(reward.reward_category)}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {reward.reward_name}
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {reward.reward_description}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                        reward.reward_rarity
                      )}`}
                    >
                      {reward.reward_rarity}
                    </span>
                  </div>
                  <div className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Claimed on {formatDate(reward.claimed_date || reward.earned_date)}
                  </div>
                  <div className="rounded-md bg-green-100 px-2 py-1 text-center text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                    ✓ Claimed
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {userRewards.length === 0 && (
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            No rewards yet. Contribute to community goals to earn rewards!
          </p>
        )}
      </div>
    </div>
  );
}

// Create Goal Modal
function CreateGoalModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateCommunityGoalDto>({
    goal_name: '',
    goal_description: '',
    goal_type: 'custom',
    target_value: 1000,
    is_global: true,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    requires_premium: false,
    requires_founder_pack: false,
    reward_configs: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRewardConfig, setShowRewardConfig] = useState(false);
  const [newReward, setNewReward] = useState<Partial<CommunityGoalRewardConfig>>({
    reward_type: 'participation',
    reward_name: '',
    reward_description: '',
    reward_category: 'currency',
    reward_item_id: '',
    reward_quantity: 1,
    reward_rarity: 'common',
    reward_tier: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await communityGoalsApi.createGoal({
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      });
      onSuccess();
    } catch (err: any) {
      console.error('Error creating goal:', err);
      setError(err.message || 'Failed to create community goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-zinc-800">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Create Community Goal
        </h2>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Goal Name *
            </label>
            <input
              type="text"
              value={formData.goal_name}
              onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Goal Description *
            </label>
            <textarea
              value={formData.goal_description}
              onChange={(e) => setFormData({ ...formData, goal_description: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Goal Type *
              </label>
              <select
                value={formData.goal_type}
                onChange={(e) => setFormData({ ...formData, goal_type: e.target.value as any })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                required
              >
                <option value="tapathon_score">Tapathon Score</option>
                <option value="frenzy_sessions">Frenzy Sessions</option>
                <option value="easter_egg_redemptions">Easter Egg Redemptions</option>
                <option value="poll_votes">Poll Votes</option>
                <option value="user_registrations">User Registrations</option>
                <option value="founder_pack_sales">Founder Pack Sales</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Target Value *
              </label>
              <input
                type="number"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData({ ...formData, target_value: parseInt(e.target.value) })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                min={1}
                max={10000000}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                End Date *
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_global || false}
                onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                className="rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Global Goal</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requires_premium || false}
                onChange={(e) => setFormData({ ...formData, requires_premium: e.target.checked })}
                className="rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Requires Premium</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requires_founder_pack || false}
                onChange={(e) =>
                  setFormData({ ...formData, requires_founder_pack: e.target.checked })
                }
                className="rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Requires Founder Pack</span>
            </label>
          </div>

          {/* Reward Configuration Section */}
          <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-700/50">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Reward Configurations
              </h3>
              <button
                type="button"
                onClick={() => setShowRewardConfig(!showRewardConfig)}
                className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
              >
                {showRewardConfig ? 'Hide' : '+ Add Reward'}
              </button>
            </div>

            {/* Existing Rewards */}
            {formData.reward_configs && formData.reward_configs.length > 0 && (
              <div className="mb-3 space-y-2">
                {formData.reward_configs.map((reward, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md bg-white p-2 dark:bg-zinc-800"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {reward.reward_name}
                      </span>
                      <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                        ({reward.reward_category} × {reward.reward_quantity})
                      </span>
                      {reward.threshold_percentage && (
                        <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-500">
                          - Milestone {reward.threshold_percentage}%
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newConfigs = formData.reward_configs?.filter((_, i) => i !== index);
                        setFormData({ ...formData, reward_configs: newConfigs || [] });
                      }}
                      className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Reward Form */}
            {showRewardConfig && (
              <div className="space-y-3 rounded-md border border-zinc-300 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Reward Type *
                    </label>
                    <select
                      value={newReward.reward_type || 'participation'}
                      onChange={(e) =>
                        setNewReward({ ...newReward, reward_type: e.target.value as any })
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                    >
                      <option value="participation">Participation</option>
                      <option value="milestone">Milestone</option>
                      <option value="achievement">Achievement</option>
                      <option value="top_contributor">Top Contributor</option>
                      <option value="early_bird">Early Bird</option>
                    </select>
                  </div>
                  {newReward.reward_type === 'milestone' && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Threshold % *
                      </label>
                      <select
                        value={newReward.threshold_percentage || 20}
                        onChange={(e) =>
                          setNewReward({
                            ...newReward,
                            threshold_percentage: parseInt(e.target.value),
                          })
                        }
                        className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      >
                        <option value={20}>20%</option>
                        <option value={40}>40%</option>
                        <option value={60}>60%</option>
                        <option value={80}>80%</option>
                        <option value={100}>100%</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Reward Name *
                  </label>
                  <input
                    type="text"
                    value={newReward.reward_name || ''}
                    onChange={(e) => setNewReward({ ...newReward, reward_name: e.target.value })}
                    className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                    placeholder="e.g., Community Participant Badge"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Reward Description *
                  </label>
                  <input
                    type="text"
                    value={newReward.reward_description || ''}
                    onChange={(e) =>
                      setNewReward({ ...newReward, reward_description: e.target.value })
                    }
                    className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                    placeholder="e.g., Participated in community goal"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Category *
                    </label>
                    <select
                      value={newReward.reward_category || 'currency'}
                      onChange={(e) =>
                        setNewReward({ ...newReward, reward_category: e.target.value as any })
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                    >
                      <option value="currency">Currency</option>
                      <option value="item">Item</option>
                      <option value="badge">Badge</option>
                      <option value="title">Title</option>
                      <option value="experience">Experience</option>
                      <option value="frenzy_points">Frenzy Points</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Item ID *
                    </label>
                    <input
                      type="text"
                      value={newReward.reward_item_id || ''}
                      onChange={(e) =>
                        setNewReward({ ...newReward, reward_item_id: e.target.value })
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      placeholder="e.g., dino_gems"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newReward.reward_quantity || 1}
                      onChange={(e) =>
                        setNewReward({
                          ...newReward,
                          reward_quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Rarity *
                    </label>
                    <select
                      value={newReward.reward_rarity || 'common'}
                      onChange={(e) =>
                        setNewReward({ ...newReward, reward_rarity: e.target.value as any })
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                      <option value="exclusive">Exclusive</option>
                      <option value="community_exclusive">Community Exclusive</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Tier (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={newReward.reward_tier || 1}
                      onChange={(e) =>
                        setNewReward({
                          ...newReward,
                          reward_tier: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        newReward.reward_name &&
                        newReward.reward_description &&
                        newReward.reward_item_id &&
                        newReward.reward_quantity
                      ) {
                        const rewardConfig: CommunityGoalRewardConfig = {
                          reward_type: newReward.reward_type || 'participation',
                          threshold_percentage:
                            newReward.reward_type === 'milestone'
                              ? newReward.threshold_percentage
                              : undefined,
                          reward_name: newReward.reward_name,
                          reward_description: newReward.reward_description,
                          reward_category: newReward.reward_category || 'currency',
                          reward_item_id: newReward.reward_item_id,
                          reward_quantity: newReward.reward_quantity || 1,
                          reward_rarity: newReward.reward_rarity || 'common',
                          reward_tier: newReward.reward_tier || 1,
                        };
                        setFormData({
                          ...formData,
                          reward_configs: [...(formData.reward_configs || []), rewardConfig],
                        });
                        setNewReward({
                          reward_type: 'participation',
                          reward_name: '',
                          reward_description: '',
                          reward_category: 'currency',
                          reward_item_id: '',
                          reward_quantity: 1,
                          reward_rarity: 'common',
                          reward_tier: 1,
                        });
                        setShowRewardConfig(false);
                      }
                    }}
                    className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white transition-colors hover:bg-green-700"
                  >
                    Add Reward
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRewardConfig(false)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {(!formData.reward_configs || formData.reward_configs.length === 0) &&
              !showRewardConfig && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No rewards configured. Click "Add Reward" to configure rewards. If no rewards are
                  configured, default rewards will be awarded.
                </p>
              )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Stats Modal
function StatsModal({
  stats,
  onClose,
  formatDate,
}: {
  stats: CommunityGoalStats;
  onClose: () => void;
  formatDate: (date: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-zinc-800">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Community Goals Statistics
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Goals</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.total_goals}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Active Goals</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active_goals}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Achieved Goals</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.achieved_goals}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Participants</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.total_participants}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Contributions</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.total_contributions.toLocaleString()}
            </div>
          </div>
        </div>
        {stats.most_popular_goal && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Most Popular Goal
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {stats.most_popular_goal.goal_name}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {stats.most_popular_goal.participants_count} participants •{' '}
              {stats.most_popular_goal.completion_percentage.toFixed(1)}% complete
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

