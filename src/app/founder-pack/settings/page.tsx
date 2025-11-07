'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { founderPackApi, type FounderPackSettings } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';
import { ImagePicker } from '../../../components/ImagePicker';

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<FounderPackSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    founder_outfit_icon_url: '',
    dino_gems_icon_url: '',
    founder_frame_icon_url: '',
    tier_1_reward_icon_url: '',
    tier_2_reward_icon_url: '',
    tier_3_reward_icon_url: '',
    product_id: '',
    price: 0,
    currency: 'USD',
    title: '',
    description: '',
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
        product_id: data.product_id || '',
        price: data.price || 0,
        currency: data.currency || 'USD',
        title: data.title || '',
        description: data.description || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await founderPackApi.updateSettings(formData);
      setSuccess('All settings saved successfully!');
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIcon = async (itemId: 'founder_outfit' | 'dino_gems' | 'founder_frame', iconUrl: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await founderPackApi.updateContentIcon(itemId, iconUrl);
      setSuccess(`${itemId} icon updated successfully!`);
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save icon');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRewardIcon = async (tier: 1 | 2 | 3, iconUrl: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await founderPackApi.updateRewardIcon(tier, iconUrl);
      setSuccess(`Tier ${tier} reward icon updated successfully!`);
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save icon');
    } finally {
      setSaving(false);
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Founder Pack Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage icon URLs for founder pack contents and rewards</p>
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

        {/* Content Icons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Content Icons</h2>
          <div className="space-y-4">
            {[
              { id: 'founder_outfit' as const, label: 'Founder Outfit Icon', key: 'founder_outfit_icon_url' },
              { id: 'dino_gems' as const, label: 'Dino Gems Icon', key: 'dino_gems_icon_url' },
              { id: 'founder_frame' as const, label: 'Founder Frame Icon', key: 'founder_frame_icon_url' },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {item.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData[item.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                      placeholder="Enter icon URL or pick from images"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowImagePicker(item.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Pick Image
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveIcon(item.id, formData[item.key as keyof typeof formData])}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                  {formData[item.key as keyof typeof formData] && (
                    <div className="mt-2">
                      <img
                        src={formData[item.key as keyof typeof formData]}
                        alt={item.label}
                        className="w-16 h-16 rounded object-cover border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reward Icons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Community Goal Reward Icons</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((tier) => {
              const key = `tier_${tier}_reward_icon_url` as keyof typeof formData;
              return (
                <div key={tier} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tier {tier} Reward Icon
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        placeholder="Enter icon URL or pick from images"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowImagePicker(`tier_${tier}`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Pick Image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveRewardIcon(tier as 1 | 2 | 3, formData[key])}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                    {formData[key] && (
                      <div className="mt-2">
                        <img
                          src={formData[key]}
                          alt={`Tier ${tier} Reward`}
                          className="w-16 h-16 rounded object-cover border border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pack Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pack Information</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product ID *
                </label>
                <input
                  type="text"
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  placeholder="e.g., stevenandparkerfounderpack"
                  maxLength={200}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="14.99"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency *
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  placeholder="USD"
                  maxLength={10}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Become a StEvEn & Parker Founder!"
                maxLength={200}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Get exclusive items that will never be available again!"
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Save All Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Icon</h3>
              <button
                onClick={() => setShowImagePicker(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ImagePicker
                value={
                  showImagePicker && showImagePicker.startsWith('tier_')
                    ? formData[`tier_${showImagePicker.split('_')[1]}_reward_icon_url` as keyof typeof formData]
                    : showImagePicker
                    ? formData[`${showImagePicker}_icon_url` as keyof typeof formData] || ''
                    : ''
                }
                onChange={(url) => {
                  if (showImagePicker && showImagePicker.startsWith('tier_')) {
                    const tier = showImagePicker.split('_')[1];
                    setFormData({ ...formData, [`tier_${tier}_reward_icon_url`]: url });
                  } else if (showImagePicker) {
                    setFormData({ ...formData, [`${showImagePicker}_icon_url`]: url });
                  }
                  setShowImagePicker(null);
                }}
                label="Select Icon"
                placeholder="Choose an image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

