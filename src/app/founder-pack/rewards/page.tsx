'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { founderPackApi } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';

export default function RewardsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [availableRewards, setAvailableRewards] = useState<any[]>([]);
  const [communityGoalsStatus, setCommunityGoalsStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'status'>('available');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'available') {
        const rewards = await founderPackApi.getAvailableRewards();
        setAvailableRewards(Array.isArray(rewards) ? rewards : []);
      } else {
        const status = await founderPackApi.getCommunityGoalsStatus();
        setCommunityGoalsStatus(status);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (goalId: string) => {
    if (!confirm('Are you sure you want to claim this reward?')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const result = await founderPackApi.claimReward(goalId);
      setSuccess('Reward claimed successfully!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error claiming reward:', err);
      setError(err.message || 'Failed to claim reward');
      setTimeout(() => setError(null), 5000);
    }
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Rewards Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage available rewards and community goals status</p>
          </div>
          <button
            onClick={() => router.push('/founder-pack')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Back
          </button>
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

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'available'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Available Rewards
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'status'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Community Goals Status
          </button>
        </div>

        {/* Available Rewards Tab */}
        {activeTab === 'available' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Rewards to Claim</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading rewards...</div>
              </div>
            ) : availableRewards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No available rewards to claim</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRewards.map((reward, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Tier {reward.goal_tier}: {reward.goal_name}
                        </div>
                        {reward.achieved_date && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Achieved: {new Date(reward.achieved_date).toLocaleDateString()}
                          </div>
                        )}
                        {reward.reward && (
                          <div className="mt-2 text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">{reward.reward.item_name}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {reward.reward.item_type} • Qty: {reward.reward.quantity} • {reward.reward.rarity}
                            </div>
                          </div>
                        )}
                        <div className={`mt-2 px-2 py-1 rounded text-xs inline-block ${
                          reward.is_claimed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {reward.is_claimed ? 'Claimed' : 'Available to Claim'}
                        </div>
                      </div>
                      {!reward.is_claimed && (
                        <button
                          onClick={() => handleClaimReward(reward.goal_id)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Claim Reward
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Community Goals Status Tab */}
        {activeTab === 'status' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Community Goals Status</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading status...</div>
              </div>
            ) : communityGoalsStatus ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Founders</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {communityGoalsStatus.total_founders?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Goals</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {communityGoalsStatus.current_goals?.length || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Achieved Goals</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {communityGoalsStatus.achieved_goals?.length || 0}
                    </div>
                  </div>
                </div>

                {communityGoalsStatus.current_goals && communityGoalsStatus.current_goals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Current Goals</h3>
                    <div className="space-y-3">
                      {communityGoalsStatus.current_goals.map((goal: any, idx: number) => {
                        const progress = goal.target_sales_count > 0 
                          ? Math.min((goal.current_sales_count / goal.target_sales_count) * 100, 100) 
                          : 0;
                        return (
                          <div key={idx} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                Tier {goal.goal_tier}: {goal.goal_name}
                              </div>
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {progress.toFixed(1)}%
                              </div>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                              <div
                                className="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {goal.current_sales_count.toLocaleString()} / {goal.target_sales_count.toLocaleString()} sales
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {communityGoalsStatus.achieved_goals && communityGoalsStatus.achieved_goals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Achieved Goals</h3>
                    <div className="space-y-3">
                      {communityGoalsStatus.achieved_goals.map((goal: any, idx: number) => (
                        <div key={idx} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            Tier {goal.goal_tier}: {goal.goal_name}
                          </div>
                          {goal.achieved_date && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Achieved: {new Date(goal.achieved_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No status data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

