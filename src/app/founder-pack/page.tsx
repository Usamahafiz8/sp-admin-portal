'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { founderPackApi, type FounderPackSettings } from '../../lib/api';
import { Navigation } from '../../components/Navigation';
import { ImagePicker } from '../../components/ImagePicker';

export default function FounderPackPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<FounderPackSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    price: 0,
    currency: 'USD',
    title: '',
    description: '',
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
        product_id: data.product_id || '',
        price: data.price || 0,
        currency: data.currency || 'USD',
        title: data.title || '',
        description: data.description || '',
        founder_outfit_icon_url: data.founder_outfit_icon_url || '',
        dino_gems_icon_url: data.dino_gems_icon_url || '',
        founder_frame_icon_url: data.founder_frame_icon_url || '',
        tier_1_reward_icon_url: data.tier_1_reward_icon_url || '',
        tier_2_reward_icon_url: data.tier_2_reward_icon_url || '',
        tier_3_reward_icon_url: data.tier_3_reward_icon_url || '',
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
      setEditingSection(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (section: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      if (section === 'pack_info') {
        await founderPackApi.updateSettings({
          product_id: formData.product_id,
          price: formData.price,
          currency: formData.currency,
          title: formData.title,
          description: formData.description,
        });
      } else if (section === 'content_icons') {
        await founderPackApi.updateSettings({
          founder_outfit_icon_url: formData.founder_outfit_icon_url,
          dino_gems_icon_url: formData.dino_gems_icon_url,
          founder_frame_icon_url: formData.founder_frame_icon_url,
        });
      } else if (section === 'reward_icons') {
        await founderPackApi.updateSettings({
          tier_1_reward_icon_url: formData.tier_1_reward_icon_url,
          tier_2_reward_icon_url: formData.tier_2_reward_icon_url,
          tier_3_reward_icon_url: formData.tier_3_reward_icon_url,
        });
      }
      
      setSuccess(`${section} saved successfully!`);
      await fetchSettings();
      setEditingSection(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Founder Pack Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Full CRUD operations for founder pack, community goals, and settings</p>
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

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <button
            onClick={() => router.push('/founder-pack/community-goals')}
            className="bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-500 p-6 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Community Goals</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create, Edit, Delete Goals</p>
          </button>

          <button
            onClick={() => router.push('/founder-pack/founders')}
            className="bg-white dark:bg-gray-800 rounded-lg border-2 border-green-500 p-6 text-left hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <div className="text-3xl mb-2">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Founders List</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View All Purchases</p>
          </button>

          <button
            onClick={() => router.push('/founder-pack/users')}
            className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-500 p-6 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <div className="text-3xl mb-2">👤</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">User Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View Status & IAP</p>
          </button>

          <button
            onClick={() => router.push('/founder-pack/rewards')}
            className="bg-white dark:bg-gray-800 rounded-lg border-2 border-yellow-500 p-6 text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
          >
            <div className="text-3xl mb-2">🎁</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Rewards</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage Rewards</p>
          </button>

          <button
            onClick={() => setEditingSection(editingSection === 'pack_info' ? null : 'pack_info')}
            className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-500 p-6 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Pack Info</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Edit Pack Details</p>
          </button>

          <button
            onClick={() => setEditingSection(editingSection === 'icons' ? null : 'icons')}
            className="bg-white dark:bg-gray-800 rounded-lg border-2 border-orange-500 p-6 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            <div className="text-3xl mb-2">🖼️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Icons</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage Icons</p>
          </button>
        </div>

        {/* Pack Information Section */}
        {editingSection === 'pack_info' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pack Information</h2>
              <button
                onClick={() => setEditingSection(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
              <div className="flex gap-3">
                <button
                  onClick={() => handleSaveSection('pack_info')}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving...' : 'Save Pack Info'}
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Icons Section */}
        {editingSection === 'icons' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Icon Management</h2>
              <button
                onClick={() => setEditingSection(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content Icons */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Icons</h3>
              <div className="space-y-4">
                {[
                  { id: 'founder_outfit', label: 'Founder Outfit Icon', key: 'founder_outfit_icon_url' },
                  { id: 'dino_gems', label: 'Dino Gems Icon', key: 'dino_gems_icon_url' },
                  { id: 'founder_frame', label: 'Founder Frame Icon', key: 'founder_frame_icon_url' },
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
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Community Goal Reward Icons</h3>
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

            <div className="flex gap-3">
              <button
                onClick={() => handleSaveSection('content_icons')}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Content Icons'}
              </button>
              <button
                onClick={() => handleSaveSection('reward_icons')}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Reward Icons'}
              </button>
              <button
                onClick={() => setEditingSection(null)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Current Settings Display */}
        {!editingSection && settings && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pack Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pack Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Product ID:</span> {settings.product_id || 'Not set'}</div>
                <div><span className="font-medium">Price:</span> {settings.price ? `${settings.currency || 'USD'} ${settings.price}` : 'Not set'}</div>
                <div><span className="font-medium">Title:</span> {settings.title || 'Not set'}</div>
                <div><span className="font-medium">Description:</span> {settings.description || 'Not set'}</div>
              </div>
            </div>

            {/* Icons Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Icons</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Content Icons:</span> {settings.founder_outfit_icon_url ? 'Set' : 'Not set'}</div>
                <div><span className="font-medium">Reward Icons:</span> {settings.tier_1_reward_icon_url ? 'Set' : 'Not set'}</div>
              </div>
            </div>
          </div>
        )}
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
                  showImagePicker.startsWith('tier_')
                    ? formData[`tier_${showImagePicker.split('_')[1]}_reward_icon_url` as keyof typeof formData]
                    : formData[`${showImagePicker}_icon_url` as keyof typeof formData] || ''
                }
                onChange={(url) => {
                  if (showImagePicker.startsWith('tier_')) {
                    const tier = showImagePicker.split('_')[1];
                    setFormData({ ...formData, [`tier_${tier}_reward_icon_url`]: url });
                  } else {
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
