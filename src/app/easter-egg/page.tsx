'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { easterEggApi, type EasterEgg, type CreateEasterEggDto, type EasterEggStats } from '../../lib/api';
import { Navigation } from '../../components/Navigation';

export default function EasterEggManagementPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin');
  const [easterEggs, setEasterEggs] = useState<EasterEgg[]>([]);
  const [stats, setStats] = useState<EasterEggStats | null>(null);
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
      fetchEasterEggs();
      if (activeTab === 'admin') {
        fetchStats();
      }
    }
  }, [isAuthenticated, activeTab]);

  const fetchEasterEggs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await easterEggApi.getAvailable();
      setEasterEggs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching Easter Eggs:', err);
      setError(err.message || 'Failed to fetch Easter Eggs');
      setEasterEggs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await easterEggApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDeactivate = async (easterEggId: string) => {
    if (!confirm('Are you sure you want to deactivate this Easter Egg code?')) {
      return;
    }

    try {
      await easterEggApi.deactivate(easterEggId);
      await fetchEasterEggs();
      await fetchStats();
    } catch (err: any) {
      console.error('Error deactivating Easter Egg:', err);
      setError(err.message || 'Failed to deactivate Easter Egg');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'easter_exclusive':
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Easter Egg Management</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage Easter Egg codes and user redemptions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStatsModal(true)}
              className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-700"
            >
              View Stats
            </button>
            {activeTab === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                + Create Easter Egg
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex gap-4">
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
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {activeTab === 'admin' ? (
          <AdminTab
            easterEggs={easterEggs}
            loading={loading}
            onRefresh={fetchEasterEggs}
            onDeactivate={handleDeactivate}
            getRarityColor={getRarityColor}
            getCategoryIcon={getCategoryIcon}
            formatDate={formatDate}
          />
        ) : (
          <UserTab
            easterEggs={easterEggs}
            loading={loading}
            onRefresh={fetchEasterEggs}
            getRarityColor={getRarityColor}
            getCategoryIcon={getCategoryIcon}
            formatDate={formatDate}
          />
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateEasterEggModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchEasterEggs();
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
  easterEggs,
  loading,
  onRefresh,
  onDeactivate,
  getRarityColor,
  getCategoryIcon,
  formatDate,
}: {
  easterEggs: EasterEgg[];
  loading: boolean;
  onRefresh: () => void;
  onDeactivate: (id: string) => void;
  getRarityColor: (rarity: string) => string;
  getCategoryIcon: (category: string) => string;
  formatDate: (date: string | null | undefined) => string;
}) {
  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading Easter Eggs...</div>
        </div>
      ) : easterEggs.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">No Easter Eggs found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {easterEggs.map((egg) => (
            <div
              key={egg.easter_egg_id}
              className={`rounded-lg border-2 p-5 ${
                egg.is_active
                  ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                  : 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700/50'
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(egg.reward_category)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        {egg.code}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{egg.reward_name}</p>
                    </div>
                  </div>
                  <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {egg.reward_description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                    egg.reward_rarity
                  )}`}
                >
                  {egg.reward_rarity}
                </span>
              </div>

              <div className="mb-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Category:</span>
                  <span className="font-medium capitalize">{egg.reward_category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Quantity:</span>
                  <span className="font-medium">{egg.reward_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Redemptions:</span>
                  <span className="font-medium">
                    {egg.current_redemptions} / {egg.max_redemptions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Status:</span>
                  <span
                    className={`font-medium ${egg.is_active ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {egg.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {egg.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Expires:</span>
                    <span className="font-medium">{formatDate(egg.expires_at)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                {egg.is_active && (
                  <button
                    onClick={() => onDeactivate(egg.easter_egg_id)}
                    className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
                  >
                    Deactivate
                  </button>
                )}
                <button
                  onClick={onRefresh}
                  className="flex-1 rounded-md bg-zinc-600 px-3 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// User Tab Component
function UserTab({
  easterEggs,
  loading,
  onRefresh,
  getRarityColor,
  getCategoryIcon,
  formatDate,
}: {
  easterEggs: EasterEgg[];
  loading: boolean;
  onRefresh: () => void;
  getRarityColor: (rarity: string) => string;
  getCategoryIcon: (category: string) => string;
  formatDate: (date: string | null | undefined) => string;
}) {
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchUserHistory();
  }, []);

  const fetchUserHistory = async () => {
    try {
      const history = await easterEggApi.getUserHistory();
      setUserHistory(history);
    } catch (err: any) {
      console.error('Error fetching user history:', err);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      setRedeemError('Please enter a code');
      return;
    }

    try {
      setRedeeming(true);
      setRedeemError(null);
      setRedeemSuccess(null);
      const result = await easterEggApi.redeem({
        code: redeemCode.trim().toUpperCase(),
        platform: 'web',
      });
      setRedeemSuccess(`Successfully redeemed! Reward: ${result.reward_details.reward_name}`);
      setRedeemCode('');
      await fetchUserHistory();
      await onRefresh();
    } catch (err: any) {
      console.error('Error redeeming code:', err);
      setRedeemError(err.message || 'Failed to redeem code');
    } finally {
      setRedeeming(false);
    }
  };

  const activeEasterEggs = easterEggs.filter((egg) => egg.is_active);

  return (
    <div className="space-y-6">
      {/* Redeem Code Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Redeem Easter Egg Code
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g., SPRING2024)"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            onKeyPress={(e) => e.key === 'Enter' && handleRedeem()}
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400"
          >
            {redeeming ? 'Redeeming...' : 'Redeem'}
          </button>
        </div>
        {redeemError && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">{redeemError}</div>
        )}
        {redeemSuccess && (
          <div className="mt-2 text-sm text-green-600 dark:text-green-400">{redeemSuccess}</div>
        )}
      </div>

      {/* User History */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">My Redemptions</h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
        {userHistory && (
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Redeemed</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {userHistory.total_redemptions}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Rewards Claimed</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {userHistory.total_rewards_claimed}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Unique Codes</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {userHistory.unique_easter_eggs}
              </div>
            </div>
          </div>
        )}
        {showHistory && userHistory && userHistory.recent_redemptions && (
          <div className="space-y-2">
            {userHistory.recent_redemptions.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">No redemptions yet</p>
            ) : (
              userHistory.recent_redemptions.map((redemption: any) => (
                <div
                  key={redemption.redemption_id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {redemption.code} - {redemption.reward_details.reward_name}
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(redemption.redeemed_at)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                        redemption.reward_details.reward_rarity
                      )}`}
                    >
                      {redemption.reward_details.reward_rarity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Available Easter Eggs */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Available Easter Eggs ({activeEasterEggs.length})
        </h2>
        {loading ? (
          <div className="text-center text-zinc-600 dark:text-zinc-400">Loading...</div>
        ) : activeEasterEggs.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No active Easter Eggs available</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeEasterEggs.map((egg) => (
              <div
                key={egg.easter_egg_id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-700"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl">{getCategoryIcon(egg.reward_category)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {egg.reward_name}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {egg.reward_description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                      egg.reward_rarity
                    )}`}
                  >
                    {egg.reward_rarity}
                  </span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  {egg.current_redemptions} / {egg.max_redemptions} redemptions
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Create Easter Egg Modal
function CreateEasterEggModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateEasterEggDto>({
    code: '',
    reward_name: '',
    reward_description: '',
    reward_category: 'badge',
    reward_item_id: '',
    reward_quantity: 1,
    reward_rarity: 'common',
    max_redemptions: 1000,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const handleGenerateCode = async () => {
    try {
      setGeneratingCode(true);
      const result = await easterEggApi.generateCode();
      setFormData({ ...formData, code: result.code });
    } catch (err: any) {
      console.error('Error generating code:', err);
      setError('Failed to generate code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await easterEggApi.create(formData);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating Easter Egg:', err);
      setError(err.message || 'Failed to create Easter Egg');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-zinc-800">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Create Easter Egg
        </h2>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Code *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                  required
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="rounded-lg bg-zinc-600 px-4 py-2 text-white transition-colors hover:bg-zinc-700 disabled:bg-zinc-400"
                >
                  {generatingCode ? '...' : 'Generate'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reward Category *
              </label>
              <select
                value={formData.reward_category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reward_category: e.target.value as any,
                  })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                required
              >
                <option value="currency">Currency</option>
                <option value="item">Item</option>
                <option value="badge">Badge</option>
                <option value="title">Title</option>
                <option value="experience">Experience</option>
                <option value="frenzy_points">Frenzy Points</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Reward Name *
            </label>
            <input
              type="text"
              value={formData.reward_name}
              onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Reward Description *
            </label>
            <textarea
              value={formData.reward_description}
              onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reward Item ID *
              </label>
              <input
                type="text"
                value={formData.reward_item_id}
                onChange={(e) => setFormData({ ...formData, reward_item_id: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.reward_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, reward_quantity: parseInt(e.target.value) })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                min={1}
                max={10000}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Rarity *
              </label>
              <select
                value={formData.reward_rarity}
                onChange={(e) => setFormData({ ...formData, reward_rarity: e.target.value as any })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                required
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
                <option value="exclusive">Exclusive</option>
                <option value="easter_exclusive">Easter Exclusive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Max Redemptions
              </label>
              <input
                type="number"
                value={formData.max_redemptions || 1000}
                onChange={(e) =>
                  setFormData({ ...formData, max_redemptions: parseInt(e.target.value) })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                min={1}
                max={100000}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Expires At
              </label>
              <input
                type="datetime-local"
                value={
                  formData.expires_at
                    ? new Date(formData.expires_at).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_limited_time || false}
                onChange={(e) => setFormData({ ...formData, is_limited_time: e.target.checked })}
                className="rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Limited Time</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_seasonal || false}
                onChange={(e) => setFormData({ ...formData, is_seasonal: e.target.checked })}
                className="rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Seasonal</span>
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
          </div>

          {formData.is_seasonal && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Season Name
              </label>
              <input
                type="text"
                value={formData.season_name || ''}
                onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
          )}

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
              {loading ? 'Creating...' : 'Create Easter Egg'}
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
  stats: EasterEggStats;
  onClose: () => void;
  formatDate: (date: string | null | undefined) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-zinc-800">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Easter Egg Statistics
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Easter Eggs</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.total_easter_eggs}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Active Easter Eggs</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active_easter_eggs}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Redemptions</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.total_redemptions}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Unique Users</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.unique_users_redeemed}
            </div>
          </div>
        </div>
        {stats.most_popular_easter_egg && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Most Popular
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {stats.most_popular_easter_egg.code} - {stats.most_popular_easter_egg.reward_name}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {stats.most_popular_easter_egg.redemptions} redemptions
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

