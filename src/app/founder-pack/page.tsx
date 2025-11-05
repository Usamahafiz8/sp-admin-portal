'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  founderPackApi,
  type FounderPackDetails,
  type UserFounderStatus,
  type CommunityGoalsStatus,
  type FoundersListResponse,
  type FoundersListQuery,
  type IAPStatus,
  type RewardsPrelaunch,
  type RewardsGrant,
  type Entitlement,
  type Milestone,
  type AvailableCommunityGoalReward,
  type ClaimCommunityGoalRewardResponse,
} from '../../lib/api';
import { Navigation } from '../../components/Navigation';

export default function FounderPackPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
  const [packDetails, setPackDetails] = useState<FounderPackDetails | null>(null);
  const [userStatus, setUserStatus] = useState<UserFounderStatus | null>(null);
  const [communityGoalsStatus, setCommunityGoalsStatus] = useState<CommunityGoalsStatus | null>(null);
  const [foundersList, setFoundersList] = useState<FoundersListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin filters
  const [filters, setFilters] = useState<FoundersListQuery>({
    page: 1,
    limit: 50,
    sort_by: 'purchase_date',
    sort_order: 'desc',
    platform: 'all',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'user') {
        // Fetch user-facing data
        const [details, status, goalsStatus] = await Promise.all([
          founderPackApi.getDetails().catch(() => null),
          founderPackApi.getUserStatus().catch(() => null),
          founderPackApi.getCommunityGoalsStatus().catch(() => null),
        ]);

        setPackDetails(details);
        setUserStatus(status);
        setCommunityGoalsStatus(goalsStatus);
      } else {
        // Fetch admin data
        const list = await founderPackApi.getFoundersList(filters);
        setFoundersList(list);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'exclusive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'outfit':
        return '👕';
      case 'currency':
        return '💰';
      case 'profile_frame':
        return '🖼️';
      case 'emote':
        return '😀';
      case 'accessory':
        return '🎩';
      default:
        return '📦';
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Founder Pack</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage Founder Pack purchases, rewards, and community goals
          </p>
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
            foundersList={foundersList}
            loading={loading}
            filters={filters}
            setFilters={setFilters}
            onRefresh={fetchData}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        ) : (
          <UserTab
            packDetails={packDetails}
            userStatus={userStatus}
            communityGoalsStatus={communityGoalsStatus}
            loading={loading}
            onRefresh={fetchData}
            getRarityColor={getRarityColor}
            getItemTypeIcon={getItemTypeIcon}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
}

// User Tab Component
function UserTab({
  packDetails,
  userStatus,
  communityGoalsStatus,
  loading,
  onRefresh,
  getRarityColor,
  getItemTypeIcon,
  formatDate,
}: {
  packDetails: FounderPackDetails | null;
  userStatus: UserFounderStatus | null;
  communityGoalsStatus: CommunityGoalsStatus | null;
  loading: boolean;
  onRefresh: () => void;
  getRarityColor: (rarity: string) => string;
  getItemTypeIcon: (itemType: string) => string;
  formatDate: (date: string) => string;
}) {
  const { user, isAuthenticated } = useAuth();
  const [grantingRewards, setGrantingRewards] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);
  const [availableRewards, setAvailableRewards] = useState<AvailableCommunityGoalReward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const handleGrantRewards = async () => {
    if (!user?.id) return;
    try {
      setGrantingRewards(true);
      setGrantSuccess(null);
      const result = await founderPackApi.grantRewards(user.id);
      setGrantSuccess(`Successfully granted ${result.total_granted} rewards!`);
      await onRefresh();
    } catch (err: any) {
      console.error('Error granting rewards:', err);
      alert(err.message || 'Failed to grant rewards');
    } finally {
      setGrantingRewards(false);
    }
  };

  const fetchAvailableRewards = async () => {
    try {
      setLoadingRewards(true);
      const rewards = await founderPackApi.getAvailableCommunityGoalRewards();
      setAvailableRewards(rewards);
    } catch (err: any) {
      console.error('Error fetching available rewards:', err);
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleClaimReward = async (goalId: string) => {
    try {
      setClaimingReward(goalId);
      setClaimSuccess(null);
      const result = await founderPackApi.claimCommunityGoalReward(goalId);
      setClaimSuccess(`Successfully claimed ${result.reward.reward.item_name}!`);
      await fetchAvailableRewards();
      await onRefresh();
    } catch (err: any) {
      console.error('Error claiming reward:', err);
      alert(err.message || 'Failed to claim reward');
    } finally {
      setClaimingReward(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchAvailableRewards();
    }
  }, [isAuthenticated, user?.id]);

  return (
    <div className="space-y-6">
      {/* Pack Details */}
      {packDetails && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Founder Pack Details
          </h2>
          <div className="mb-4">
            <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-50">
              {packDetails.pack_info.title}
            </h3>
            <p className="mb-2 text-zinc-600 dark:text-zinc-400">
              {packDetails.pack_info.description}
            </p>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {packDetails.pack_info.localized_price}
            </div>
          </div>

          {/* Pack Contents */}
          <div className="mb-4">
            <h4 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Pack Contents:</h4>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {packDetails.contents.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-700"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{getItemTypeIcon(item.item_type)}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {item.item_name}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                        {item.item_type}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                        item.rarity
                      )}`}
                    >
                      {item.rarity}
                    </span>
                  </div>
                  {item.quantity && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Quantity: {item.quantity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Status */}
          <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Status: {packDetails.user_status.is_founder ? '✓ Founder' : 'Not a Founder'}
                </div>
                {packDetails.user_status.purchase_date && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Purchased: {formatDate(packDetails.user_status.purchase_date)}
                  </div>
                )}
              </div>
              {packDetails.user_status.is_founder && (
                <button
                  onClick={handleGrantRewards}
                  disabled={grantingRewards}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400"
                >
                  {grantingRewards ? 'Granting...' : 'Grant Rewards'}
                </button>
              )}
            </div>
            {grantSuccess && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">{grantSuccess}</div>
            )}
          </div>
        </div>
      )}

      {/* User Status & Entitlements */}
      {userStatus && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            My Founder Status
          </h2>
          {userStatus.purchase_info && (
            <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                Purchase Information
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">Platform:</span>{' '}
                  <span className="font-medium capitalize">{userStatus.purchase_info.platform}</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">Purchase Date:</span>{' '}
                  <span className="font-medium">
                    {formatDate(userStatus.purchase_info.purchase_date)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">Transaction ID:</span>{' '}
                  <span className="font-medium">{userStatus.purchase_info.transaction_id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Entitlements */}
          {userStatus.entitlements && userStatus.entitlements.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                My Entitlements ({userStatus.entitlements.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {userStatus.entitlements.map((entitlement, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border-2 p-3 ${
                      entitlement.granted
                        ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                        : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-700'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xl">{getItemTypeIcon(entitlement.item_type)}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {entitlement.item_name}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                          {entitlement.item_type} • {entitlement.source}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                          entitlement.rarity
                        )}`}
                      >
                        {entitlement.rarity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Qty: {entitlement.quantity}
                      </span>
                      {entitlement.granted ? (
                        <span className="text-green-600 dark:text-green-400">✓ Granted</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Goals Eligible */}
          {userStatus.community_goals_eligible &&
            userStatus.community_goals_eligible.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                  Community Goals Eligible
                </h3>
                <div className="space-y-2">
                  {userStatus.community_goals_eligible.map((goal, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${
                        goal.is_achieved
                          ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                            Tier {goal.goal_tier}: {goal.goal_name}
                          </div>
                          {goal.current_progress && (
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                              Progress: {goal.current_progress}
                            </div>
                          )}
                        </div>
                        {goal.is_achieved ? (
                          <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                            ✓ Achieved
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-200 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Community Goals Status */}
      {communityGoalsStatus && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Community Goals Progress
          </h2>
          <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {communityGoalsStatus.total_packs_sold.toLocaleString()} Packs Sold
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {communityGoalsStatus.unlocked_count} of {communityGoalsStatus.total_milestones}{' '}
              milestones unlocked
            </div>
          </div>

          <div className="space-y-3">
            {communityGoalsStatus.milestones.map((milestone, index) => (
              <div
                key={index}
                className={`rounded-lg border-2 p-4 ${
                  milestone.status === 'UNLOCKED'
                    ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                    : milestone.status === 'IN_PROGRESS'
                    ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                    : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-700'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                      Tier {milestone.tier}: {milestone.reward}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Target: {milestone.target.toLocaleString()} packs
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      milestone.status === 'UNLOCKED'
                        ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                        : milestone.status === 'IN_PROGRESS'
                        ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                        : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {milestone.status}
                  </span>
                </div>
                {milestone.status === 'IN_PROGRESS' && (
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
                      <span className="font-semibold">{milestone.progress_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-full bg-blue-600 transition-all dark:bg-blue-400"
                        style={{ width: `${Math.min(milestone.progress_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {milestone.achieved_date && (
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Achieved: {formatDate(milestone.achieved_date)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Community Goal Rewards */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Available Community Goal Rewards
        </h2>
        {loadingRewards ? (
          <div className="text-center text-zinc-600 dark:text-zinc-400">Loading rewards...</div>
        ) : availableRewards.length > 0 ? (
          <div className="space-y-3">
            {availableRewards.map((reward) => (
              <div
                key={reward.goal_id}
                className={`rounded-lg border-2 p-4 ${
                  reward.is_claimed
                    ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                    : 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xl">{getItemTypeIcon(reward.reward.item_type)}</span>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                          Tier {reward.goal_tier}: {reward.goal_name}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          Reward: {reward.reward.item_name}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          Achieved: {formatDate(reward.achieved_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(
                          reward.reward.rarity
                        )}`}
                      >
                        {reward.reward.rarity}
                      </span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        Qty: {reward.reward.quantity}
                      </span>
                    </div>
                    {reward.is_claimed && reward.claimed_date && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        ✓ Claimed on {formatDate(reward.claimed_date)}
                      </div>
                    )}
                  </div>
                  {!reward.is_claimed ? (
                    <button
                      onClick={() => handleClaimReward(reward.goal_id)}
                      disabled={claimingReward === reward.goal_id}
                      className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400"
                    >
                      {claimingReward === reward.goal_id ? 'Claiming...' : 'Claim Reward'}
                    </button>
                  ) : (
                    <div className="ml-4 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white">
                      ✓ Claimed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-zinc-600 dark:text-zinc-400">
            {userStatus?.is_founder
              ? 'No available rewards to claim at this time.'
              : 'You must be a founder to claim community goal rewards.'}
          </div>
        )}
        {claimSuccess && (
          <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            {claimSuccess}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center text-zinc-600 dark:text-zinc-400">Loading...</div>
      )}
    </div>
  );
}

// Admin Tab Component
function AdminTab({
  foundersList,
  loading,
  filters,
  setFilters,
  onRefresh,
  formatDate,
  formatCurrency,
}: {
  foundersList: FoundersListResponse | null;
  loading: boolean;
  filters: FoundersListQuery;
  setFilters: (filters: FoundersListQuery) => void;
  onRefresh: () => void;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {foundersList?.summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-blue-100 p-4 dark:bg-blue-900/20">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Founders</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {foundersList.summary.total_founders}
            </div>
          </div>
          <div className="rounded-lg bg-green-100 p-4 dark:bg-green-900/20">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Revenue</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(foundersList.summary.total_revenue)}
            </div>
          </div>
          <div className="rounded-lg bg-purple-100 p-4 dark:bg-purple-900/20">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">iOS Purchases</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {foundersList.summary.platform_breakdown.ios}
            </div>
          </div>
          <div className="rounded-lg bg-orange-100 p-4 dark:bg-orange-900/20">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Android Purchases</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {foundersList.summary.platform_breakdown.android}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">Filters</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Search</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Search by username..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Platform</label>
            <select
              value={filters.platform || 'all'}
              onChange={(e) =>
                setFilters({ ...filters, platform: e.target.value as any, page: 1 })
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            >
              <option value="all">All Platforms</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Sort By</label>
            <select
              value={filters.sort_by || 'purchase_date'}
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value as any, page: 1 })
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            >
              <option value="purchase_date">Purchase Date</option>
              <option value="user_id">User ID</option>
              <option value="price">Price</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Order</label>
            <select
              value={filters.sort_order || 'desc'}
              onChange={(e) =>
                setFilters({ ...filters, sort_order: e.target.value as any, page: 1 })
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Date From</label>
            <input
              type="date"
              value={filters.date_from ? filters.date_from.split('T')[0] : ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  date_from: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  page: 1,
                })
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Date To</label>
            <input
              type="date"
              value={filters.date_to ? filters.date_to.split('T')[0] : ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  date_to: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  page: 1,
                })
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
          </div>
        </div>
      </div>

      {/* Founders List */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Founders List
        </h2>
        {loading ? (
          <div className="text-center text-zinc-600 dark:text-zinc-400">Loading...</div>
        ) : foundersList && foundersList.founders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Username
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Purchase Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Platform
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Price
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Transaction ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {foundersList.founders.map((founder, index) => (
                    <tr
                      key={index}
                      className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                    >
                      <td className="px-4 py-2 text-sm text-zinc-900 dark:text-zinc-50">
                        {founder.username || founder.user_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(founder.purchase_date)}
                      </td>
                      <td className="px-4 py-2 text-sm capitalize text-zinc-600 dark:text-zinc-400">
                        {founder.platform}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {formatCurrency(founder.price_paid, founder.currency)}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {founder.transaction_id}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            founder.purchase_status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                          }`}
                        >
                          {founder.purchase_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {foundersList.pagination && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Showing {foundersList.founders.length} of {foundersList.pagination.total_founders}{' '}
                  founders
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters({ ...filters, page: (filters.page || 1) - 1 })
                    }
                    disabled={!foundersList.pagination.has_prev}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-700"
                  >
                    Previous
                  </button>
                  <div className="px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Page {foundersList.pagination.current_page} of{' '}
                    {foundersList.pagination.total_pages}
                  </div>
                  <button
                    onClick={() =>
                      setFilters({ ...filters, page: (filters.page || 1) + 1 })
                    }
                    disabled={!foundersList.pagination.has_next}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-zinc-600 dark:text-zinc-400">No founders found</div>
        )}
      </div>
    </div>
  );
}

