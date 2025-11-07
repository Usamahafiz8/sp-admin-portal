'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { founderPackApi, type FounderPackSettings } from '../../lib/api';
import { Navigation } from '../../components/Navigation';

export default function FounderPackSettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<FounderPackSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    founder_outfit_icon_url: '',
    dino_gems_icon_url: '',
    founder_frame_icon_url: '',
    tier_1_reward_icon_url: '',
    tier_2_reward_icon_url: '',
    tier_3_reward_icon_url: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await founderPackApi.getSettings();
      setSettings(data);
      setFormData({
        founder_outfit_icon_url: data.founder_outfit_icon_url || '',
        dino_gems_icon_url: data.dino_gems_icon_url || '',
        founder_frame_icon_url: data.founder_frame_icon_url || '',
        tier_1_reward_icon_url: data.tier_1_reward_icon_url || '',
        tier_2_reward_icon_url: data.tier_2_reward_icon_url || '',
        tier_3_reward_icon_url: data.tier_3_reward_icon_url || '',
      });
    } catch (err: any) {
      console.error('Error fetching Founder Pack settings:', err);
      setError(err.message || 'Failed to fetch Founder Pack settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: Partial<FounderPackSettings> = {};
      if (formData.founder_outfit_icon_url !== (settings?.founder_outfit_icon_url || '')) {
        updateData.founder_outfit_icon_url = formData.founder_outfit_icon_url || null;
      }
      if (formData.dino_gems_icon_url !== (settings?.dino_gems_icon_url || '')) {
        updateData.dino_gems_icon_url = formData.dino_gems_icon_url || null;
      }
      if (formData.founder_frame_icon_url !== (settings?.founder_frame_icon_url || '')) {
        updateData.founder_frame_icon_url = formData.founder_frame_icon_url || null;
      }
      if (formData.tier_1_reward_icon_url !== (settings?.tier_1_reward_icon_url || '')) {
        updateData.tier_1_reward_icon_url = formData.tier_1_reward_icon_url || null;
      }
      if (formData.tier_2_reward_icon_url !== (settings?.tier_2_reward_icon_url || '')) {
        updateData.tier_2_reward_icon_url = formData.tier_2_reward_icon_url || null;
      }
      if (formData.tier_3_reward_icon_url !== (settings?.tier_3_reward_icon_url || '')) {
        updateData.tier_3_reward_icon_url = formData.tier_3_reward_icon_url || null;
      }

      await founderPackApi.updateSettings(updateData);
      setSuccess('Founder Pack icon settings updated successfully!');
      await fetchSettings();
    } catch (err: any) {
      console.error('Error updating Founder Pack settings:', err);
      setError(err.message || 'Failed to update Founder Pack settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateContentIcon = async (itemId: 'founder_outfit' | 'dino_gems' | 'founder_frame', iconUrl: string) => {
    if (!iconUrl.trim()) {
      setError('Please enter a valid icon URL');
      return;
    }

    try {
      setSavingFields(prev => new Set(prev).add(itemId));
      setError(null);
      setSuccess(null);

      await founderPackApi.updateContentIcon(itemId, iconUrl);
      setSuccess(`${itemId.replace('_', ' ')} icon updated successfully!`);
      await fetchSettings();
    } catch (err: any) {
      console.error(`Error updating ${itemId} icon:`, err);
      setError(err.message || `Failed to update ${itemId} icon`);
    } finally {
      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleUpdateRewardIcon = async (tier: 1 | 2 | 3, iconUrl: string) => {
    if (!iconUrl.trim()) {
      setError('Please enter a valid icon URL');
      return;
    }

    try {
      const fieldKey = `tier_${tier}_reward_icon_url`;
      setSavingFields(prev => new Set(prev).add(fieldKey));
      setError(null);
      setSuccess(null);

      await founderPackApi.updateRewardIcon(tier, iconUrl);
      setSuccess(`Tier ${tier} reward icon updated successfully!`);
      await fetchSettings();
    } catch (err: any) {
      console.error(`Error updating tier ${tier} reward icon:`, err);
      setError(err.message || `Failed to update tier ${tier} reward icon`);
    } finally {
      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(`tier_${tier}_reward_icon_url`);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Founder Pack Icon Settings
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage icon URLs for Founder Pack contents and community goal rewards
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pack Contents Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Pack Contents Icons
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Founder Outfit Icon URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.founder_outfit_icon_url}
                    onChange={(e) => handleInputChange('founder_outfit_icon_url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://cdn.example.com/founder_outfit.png"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateContentIcon('founder_outfit', formData.founder_outfit_icon_url)}
                    disabled={savingFields.has('founder_outfit') || !formData.founder_outfit_icon_url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {savingFields.has('founder_outfit') ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {formData.founder_outfit_icon_url && (
                  <div className="mt-2">
                    <img
                      src={formData.founder_outfit_icon_url}
                      alt="Founder Outfit Preview"
                      className="h-20 w-20 object-contain border border-zinc-300 dark:border-zinc-600 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Dino Gems Icon URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.dino_gems_icon_url}
                    onChange={(e) => handleInputChange('dino_gems_icon_url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://cdn.example.com/dino_gems.png"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateContentIcon('dino_gems', formData.dino_gems_icon_url)}
                    disabled={savingFields.has('dino_gems') || !formData.dino_gems_icon_url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {savingFields.has('dino_gems') ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {formData.dino_gems_icon_url && (
                  <div className="mt-2">
                    <img
                      src={formData.dino_gems_icon_url}
                      alt="Dino Gems Preview"
                      className="h-20 w-20 object-contain border border-zinc-300 dark:border-zinc-600 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Founder Frame Icon URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.founder_frame_icon_url}
                    onChange={(e) => handleInputChange('founder_frame_icon_url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://cdn.example.com/founder_frame.png"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateContentIcon('founder_frame', formData.founder_frame_icon_url)}
                    disabled={savingFields.has('founder_frame') || !formData.founder_frame_icon_url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {savingFields.has('founder_frame') ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {formData.founder_frame_icon_url && (
                  <div className="mt-2">
                    <img
                      src={formData.founder_frame_icon_url}
                      alt="Founder Frame Preview"
                      className="h-20 w-20 object-contain border border-zinc-300 dark:border-zinc-600 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Community Goals Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Community Goal Reward Icons
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tier 1 Reward Icon URL (Tipping Hat Emote)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.tier_1_reward_icon_url}
                    onChange={(e) => handleInputChange('tier_1_reward_icon_url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://cdn.example.com/tipping_hat_emote.png"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateRewardIcon(1, formData.tier_1_reward_icon_url)}
                    disabled={savingFields.has('tier_1_reward_icon_url') || !formData.tier_1_reward_icon_url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {savingFields.has('tier_1_reward_icon_url') ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {formData.tier_1_reward_icon_url && (
                  <div className="mt-2">
                    <img
                      src={formData.tier_1_reward_icon_url}
                      alt="Tier 1 Reward Preview"
                      className="h-20 w-20 object-contain border border-zinc-300 dark:border-zinc-600 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tier 2 Reward Icon URL (Special Founder Badge)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.tier_2_reward_icon_url}
                    onChange={(e) => handleInputChange('tier_2_reward_icon_url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://cdn.example.com/founder_badge.png"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateRewardIcon(2, formData.tier_2_reward_icon_url)}
                    disabled={savingFields.has('tier_2_reward_icon_url') || !formData.tier_2_reward_icon_url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {savingFields.has('tier_2_reward_icon_url') ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {formData.tier_2_reward_icon_url && (
                  <div className="mt-2">
                    <img
                      src={formData.tier_2_reward_icon_url}
                      alt="Tier 2 Reward Preview"
                      className="h-20 w-20 object-contain border border-zinc-300 dark:border-zinc-600 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tier 3 Reward Icon URL (Founder's Flag Back Accessory)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.tier_3_reward_icon_url}
                    onChange={(e) => handleInputChange('tier_3_reward_icon_url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://cdn.example.com/founders_flag_back_accessory.png"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateRewardIcon(3, formData.tier_3_reward_icon_url)}
                    disabled={savingFields.has('tier_3_reward_icon_url') || !formData.tier_3_reward_icon_url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {savingFields.has('tier_3_reward_icon_url') ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {formData.tier_3_reward_icon_url && (
                  <div className="mt-2">
                    <img
                      src={formData.tier_3_reward_icon_url}
                      alt="Tier 3 Reward Preview"
                      className="h-20 w-20 object-contain border border-zinc-300 dark:border-zinc-600 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

