'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { founderPackApi } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';

export default function UsersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userStatus, setUserStatus] = useState<any>(null);
  const [iapStatus, setIapStatus] = useState<any>(null);
  const [prelaunchRewards, setPrelaunchRewards] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'iap' | 'rewards'>('status');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSearch = async () => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [status, iap, rewards] = await Promise.all([
        founderPackApi.getUserStatus(userId.trim()),
        founderPackApi.getIAPStatus(userId.trim()),
        founderPackApi.getPrelaunchRewards(userId.trim()),
      ]);

      setUserStatus(status);
      setIapStatus(iap);
      setPrelaunchRewards(rewards);
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to fetch user data');
      setUserStatus(null);
      setIapStatus(null);
      setPrelaunchRewards(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantRewards = async () => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    if (!confirm(`Are you sure you want to grant rewards to user ${userId}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await founderPackApi.grantRewards(userId.trim());
      alert('Rewards granted successfully!');
      await handleSearch();
    } catch (err: any) {
      console.error('Error granting rewards:', err);
      setError(err.message || 'Failed to grant rewards');
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400">View user status, IAP status, and manage rewards</p>
          </div>
          <button
            onClick={() => router.push('/founder-pack')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        {userStatus && (
          <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'status'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              User Status
            </button>
            <button
              onClick={() => setActiveTab('iap')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'iap'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              IAP Status
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'rewards'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Rewards
            </button>
          </div>
        )}

        {/* User Status Tab */}
        {activeTab === 'status' && userStatus && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">User Status</h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Is Founder:</span>
                  <div className={`mt-1 px-3 py-1 rounded-lg inline-block ${
                    userStatus.is_founder
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {userStatus.is_founder ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Has Purchased:</span>
                  <div className={`mt-1 px-3 py-1 rounded-lg inline-block ${
                    userStatus.has_purchased
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {userStatus.has_purchased ? 'Yes' : 'No'}
                  </div>
                </div>
                {userStatus.purchase_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Purchase Date:</span>
                    <div className="mt-1 text-gray-900 dark:text-white">
                      {new Date(userStatus.purchase_date).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              {userStatus.entitlements && userStatus.entitlements.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Entitlements:</span>
                  <div className="mt-2 space-y-2">
                    {userStatus.entitlements.map((entitlement: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="font-medium text-gray-900 dark:text-white">{entitlement.item_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {entitlement.item_type} • Qty: {entitlement.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IAP Status Tab */}
        {activeTab === 'iap' && iapStatus && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">IAP Status</h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Has Purchased:</span>
                  <div className={`mt-1 px-3 py-1 rounded-lg inline-block ${
                    iapStatus.has_purchased
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {iapStatus.has_purchased ? 'Yes' : 'No'}
                  </div>
                </div>
                {iapStatus.purchase && (
                  <>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Platform:</span>
                      <div className="mt-1 text-gray-900 dark:text-white capitalize">
                        {iapStatus.purchase.platform}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID:</span>
                      <div className="mt-1 text-gray-900 dark:text-white font-mono text-sm">
                        {iapStatus.purchase.transaction_id}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Price Paid:</span>
                      <div className="mt-1 text-gray-900 dark:text-white">
                        {iapStatus.purchase.currency} {iapStatus.purchase.price_paid}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {iapStatus.items && iapStatus.items.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pack Items:</span>
                  <div className="mt-2 space-y-2">
                    {iapStatus.items.map((item: string, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && prelaunchRewards && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Prelaunch Rewards</h2>
              <button
                onClick={handleGrantRewards}
                disabled={loading || !prelaunchRewards.is_founder}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Grant Rewards
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Is Founder:</span>
                  <div className={`mt-1 px-3 py-1 rounded-lg inline-block ${
                    prelaunchRewards.is_founder
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {prelaunchRewards.is_founder ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rewards:</span>
                  <div className="mt-1 text-gray-900 dark:text-white text-2xl font-bold">
                    {prelaunchRewards.total_rewards || 0}
                  </div>
                </div>
              </div>
              
              {prelaunchRewards.founder_pack_rewards && prelaunchRewards.founder_pack_rewards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Founder Pack Rewards</h3>
                  <div className="space-y-2">
                    {prelaunchRewards.founder_pack_rewards.map((reward: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="font-medium text-gray-900 dark:text-white">{reward.item_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {reward.item_type} • Qty: {reward.quantity} • {reward.rarity}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Source: {reward.source} • {reward.granted ? 'Granted' : 'Pending'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prelaunchRewards.community_goal_rewards && prelaunchRewards.community_goal_rewards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Community Goal Rewards ({prelaunchRewards.community_rewards_count || 0})
                  </h3>
                  <div className="space-y-2">
                    {prelaunchRewards.community_goal_rewards.map((reward: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Tier {reward.goal_tier}: {reward.goal_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Achieved: {new Date(reward.achieved_date).toLocaleDateString()}
                        </div>
                        {reward.rewards && reward.rewards.map((r: any, rIdx: number) => (
                          <div key={rIdx} className="ml-4 mt-1 text-sm">
                            {r.item_name} • Qty: {r.quantity} • {r.rarity}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

