'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { inventoryApi, inventoryCategoryApi, type InventoryItem, type InventoryCategory } from '../../lib/api';
import { Navigation } from '../../components/Navigation';
import { ImagePicker } from '../../components/ImagePicker';

export default function InventoryManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [filterMainCategory, setFilterMainCategory] = useState<string>('');
  const [filterSubCategory, setFilterSubCategory] = useState<string>('');
  const [filterRarity, setFilterRarity] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchItems();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'items') {
      fetchItems();
    }
  }, [isAuthenticated, filterMainCategory, filterSubCategory, filterRarity, activeTab]);

  const fetchCategories = async () => {
    try {
      const data = await inventoryCategoryApi.getAll();
      setCategories(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryApi.getAll(
        filterMainCategory || undefined,
        filterSubCategory || undefined,
        filterRarity || undefined
      );
      setItems(data);
    } catch (err: any) {
      console.error('Error fetching inventory items:', err);
      setError(err.message || 'Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    try {
      await inventoryApi.delete(id);
      fetchItems();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Items using this category will be affected.')) {
      return;
    }
    try {
      await inventoryCategoryApi.delete(id);
      fetchCategories();
      fetchItems();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowCreateModal(true);
  };

  const handleEditCategory = (category: InventoryCategory) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingItem(null);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const getItemTypeColor = (itemType: string) => {
    const colors: Record<string, string> = {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      outfit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      currency: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      item: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      title: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      experience: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      frenzy_points: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      accessory: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      emote: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
      frame: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
    };
    return colors[itemType] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
      rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      legendary: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      exclusive: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      easter_exclusive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    };
    return colors[rarity] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  };

  const getMainCategoryColor = (mainCategory: string) => {
    return mainCategory === 'rewards'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  };

  // Group categories by main category
  const rewardsCategories = categories.filter(c => c.main_category === 'rewards');
  const shopCategories = categories.filter(c => c.main_category === 'shop');

  // Get subcategories for current main category filter
  const availableSubCategories = categories
    .filter(c => !filterMainCategory || c.main_category === filterMainCategory)
    .map(c => c.sub_category)
    .filter((v, i, a) => a.indexOf(v) === i); // Unique values

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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Inventory Management
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage categories and items with hierarchical structure
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700"
            >
              + Create Category
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              + Create Item
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'items'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
            }`}
          >
            Items ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {activeTab === 'items' ? (
          <>
            {/* Filters */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Main Category
                </label>
                <select
                  value={filterMainCategory}
                  onChange={(e) => {
                    setFilterMainCategory(e.target.value);
                    setFilterSubCategory(''); // Reset subcategory when main changes
                  }}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                >
                  <option value="">All Main Categories</option>
                  <option value="rewards">Rewards</option>
                  <option value="shop">Shop</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Sub Category
                </label>
                <select
                  value={filterSubCategory}
                  onChange={(e) => setFilterSubCategory(e.target.value)}
                  disabled={!filterMainCategory}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
                >
                  <option value="">All Sub Categories</option>
                  {availableSubCategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Rarity
                </label>
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                >
                  <option value="">All Rarities</option>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                  <option value="exclusive">Exclusive</option>
                  <option value="easter_exclusive">Easter Exclusive</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterMainCategory('');
                    setFilterSubCategory('');
                    setFilterRarity('');
                  }}
                  className="w-full rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading items...</div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
                <p className="text-lg text-zinc-600 dark:text-zinc-400">No items found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  Create Your First Item
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {/* Item Image/Icon */}
                    {item.icon_url && (
                      <div className="mb-4 flex justify-center">
                        <img
                          src={item.icon_url}
                          alt={item.item_name}
                          className="h-24 w-24 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Item Info */}
                    <div className="mb-4">
                      <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                        {item.item_name}
                      </h2>
                      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.item_description}
                      </p>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getMainCategoryColor(item.main_category)}`}>
                          {item.main_category}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                          {item.sub_category.replace(/_/g, ' ')}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getItemTypeColor(item.item_type)}`}>
                          {item.item_type}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getRarityColor(item.rarity)}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        ID: {item.item_id}
                      </div>
                    </div>

                    {/* Item Properties */}
                    <div className="mb-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {item.is_tradeable && (
                        <div className="flex items-center gap-1">
                          <span className="text-green-600 dark:text-green-400">✓</span>
                          <span>Tradeable</span>
                        </div>
                      )}
                      {item.is_sellable && (
                        <div className="flex items-center gap-1">
                          <span className="text-green-600 dark:text-green-400">✓</span>
                          <span>Sellable</span>
                          {item.sell_price && (
                            <span className="ml-1 font-semibold">${item.sell_price}</span>
                          )}
                        </div>
                      )}
                      {item.is_limited_edition && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-600 dark:text-yellow-400">⭐</span>
                          <span>Limited Edition</span>
                        </div>
                      )}
                      {item.requires_premium && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600 dark:text-blue-400">👑</span>
                          <span>Requires Premium</span>
                        </div>
                      )}
                      {item.requires_founder_pack && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-600 dark:text-purple-400">🎁</span>
                          <span>Requires Founder Pack</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Categories View */}
            <div className="mb-6">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Rewards Categories
              </h2>
              {rewardsCategories.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">No rewards categories found</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rewardsCategories.map((category) => (
                    <div
                      key={category.id}
                      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getMainCategoryColor(category.main_category)}`}>
                          {category.main_category}
                        </span>
                        {!category.is_active && (
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        {category.sub_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      {category.description && (
                        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                          {category.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="flex-1 rounded-md bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="flex-1 rounded-md bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Shop Categories
              </h2>
              {shopCategories.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">No shop categories found</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shopCategories.map((category) => (
                    <div
                      key={category.id}
                      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getMainCategoryColor(category.main_category)}`}>
                          {category.main_category}
                        </span>
                        {!category.is_active && (
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        {category.sub_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      {category.description && (
                        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                          {category.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="flex-1 rounded-md bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="flex-1 rounded-md bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Item Modal */}
      {showCreateModal && (
        <InventoryItemModal
          item={editingItem}
          categories={categories}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            fetchItems();
          }}
        />
      )}

      {/* Create/Edit Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          categories={categories}
          onClose={handleCloseCategoryModal}
          onSuccess={() => {
            handleCloseCategoryModal();
            fetchCategories();
            fetchItems();
          }}
        />
      )}
    </div>
  );
}

// Inventory Item Modal Component
function InventoryItemModal({
  item,
  categories,
  onClose,
  onSuccess,
}: {
  item: InventoryItem | null;
  categories: InventoryCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!item;
  const [formData, setFormData] = useState({
    item_id: item?.item_id || '',
    item_name: item?.item_name || '',
    item_description: item?.item_description || '',
    category_id: item?.category_id || '',
    main_category: (item?.main_category || 'rewards') as 'rewards' | 'shop',
    sub_category: item?.sub_category || '',
    item_type: (item?.item_type || 'item') as InventoryItem['item_type'],
    rarity: (item?.rarity || 'common') as InventoryItem['rarity'],
    icon_url: item?.icon_url || '',
    preview_url: item?.preview_url || '',
    is_tradeable: item?.is_tradeable ?? false,
    is_sellable: item?.is_sellable ?? false,
    sell_price: item?.sell_price?.toString() || '',
    is_active: item?.is_active ?? true,
    is_limited_edition: item?.is_limited_edition ?? false,
    limited_edition_until: item?.limited_edition_until ? new Date(item.limited_edition_until).toISOString().slice(0, 16) : '',
    requires_premium: item?.requires_premium ?? false,
    requires_founder_pack: item?.requires_founder_pack ?? false,
    quantity: item?.quantity?.toString() || '',
    max_quantity: item?.max_quantity?.toString() || '',
    min_level_required: item?.min_level_required?.toString() || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter categories by selected main category
  const filteredCategories = categories.filter(c => c.main_category === formData.main_category);

  // Update sub_category when category_id changes
  useEffect(() => {
    if (formData.category_id) {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      if (selectedCategory) {
        setFormData(prev => ({
          ...prev,
          main_category: selectedCategory.main_category,
          sub_category: selectedCategory.sub_category,
        }));
      }
    }
  }, [formData.category_id, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.category_id) {
        throw new Error('Please select a category');
      }

      const selectedCategory = categories.find(c => c.id === formData.category_id);
      if (!selectedCategory) {
        throw new Error('Selected category not found');
      }

      const submitData = {
        ...formData,
        category_id: formData.category_id,
        main_category: selectedCategory.main_category,
        sub_category: selectedCategory.sub_category,
        sell_price: formData.sell_price ? parseFloat(formData.sell_price) : undefined,
        quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : undefined,
        min_level_required: formData.min_level_required ? parseInt(formData.min_level_required) : undefined,
        limited_edition_until: formData.limited_edition_until ? new Date(formData.limited_edition_until).toISOString() : undefined,
      };

      if (isEditing && item?.id) {
        await inventoryApi.update(item.id, submitData);
      } else {
        await inventoryApi.create(submitData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} item`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEditing ? 'Edit Item' : 'Create New Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Item ID *
              </label>
              <input
                type="text"
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                required
                disabled={isEditing}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                value={formData.item_description}
                onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Main Category *
              </label>
              <select
                value={formData.main_category}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    main_category: e.target.value as 'rewards' | 'shop',
                    category_id: '', // Reset category when main changes
                    sub_category: '',
                  });
                }}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="rewards">Rewards</option>
                <option value="shop">Shop</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="">Select a category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.sub_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Item Type *
              </label>
              <select
                value={formData.item_type}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as any })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="badge">Badge</option>
                <option value="outfit">Outfit</option>
                <option value="currency">Currency</option>
                <option value="item">Item</option>
                <option value="title">Title</option>
                <option value="experience">Experience</option>
                <option value="frenzy_points">Frenzy Points</option>
                <option value="accessory">Accessory</option>
                <option value="emote">Emote</option>
                <option value="frame">Frame</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Rarity *
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value as any })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
                <option value="exclusive">Exclusive</option>
                <option value="easter_exclusive">Easter Exclusive</option>
              </select>
            </div>
            <div>
              <ImagePicker
                value={formData.icon_url}
                onChange={(url) => setFormData({ ...formData, icon_url: url })}
                label="Icon Image"
                placeholder="Select icon image from Image Management"
              />
            </div>
            <div>
              <ImagePicker
                value={formData.preview_url}
                onChange={(url) => setFormData({ ...formData, preview_url: url })}
                label="Preview Image"
                placeholder="Select preview image from Image Management"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_tradeable}
                  onChange={(e) => setFormData({ ...formData, is_tradeable: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Tradeable
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_sellable}
                  onChange={(e) => setFormData({ ...formData, is_sellable: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sellable
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Active
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_limited_edition}
                  onChange={(e) => setFormData({ ...formData, is_limited_edition: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Limited Edition
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_premium}
                  onChange={(e) => setFormData({ ...formData, requires_premium: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Requires Premium
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_founder_pack}
                  onChange={(e) => setFormData({ ...formData, requires_founder_pack: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Requires Founder Pack
                </span>
              </label>
            </div>
            {formData.is_sellable && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sell Price
                </label>
                <input
                  type="number"
                  value={formData.sell_price}
                  onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
            )}
            {formData.is_limited_edition && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Limited Edition Until
                </label>
                <input
                  type="datetime-local"
                  value={formData.limited_edition_until}
                  onChange={(e) => setFormData({ ...formData, limited_edition_until: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min={0}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Max Quantity
              </label>
              <input
                type="number"
                value={formData.max_quantity}
                onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                min={0}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Min Level Required
              </label>
              <input
                type="number"
                value={formData.min_level_required}
                onChange={(e) => setFormData({ ...formData, min_level_required: e.target.value })}
                min={0}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({
  category,
  categories,
  onClose,
  onSuccess,
}: {
  category: InventoryCategory | null;
  categories: InventoryCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!category;
  const [formData, setFormData] = useState({
    main_category: (category?.main_category || 'rewards') as 'rewards' | 'shop',
    sub_category: category?.sub_category || '',
    description: category?.description || '',
    is_active: category?.is_active ?? true,
    display_order: category?.display_order?.toString() || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if sub_category already exists in the same main_category
  const subCategoryExists = categories.some(
    c => c.main_category === formData.main_category &&
    c.sub_category === formData.sub_category &&
    (!isEditing || c.id !== category.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (subCategoryExists) {
      setError(`Sub category "${formData.sub_category}" already exists in "${formData.main_category}"`);
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        display_order: formData.display_order ? parseInt(formData.display_order) : undefined,
      };

      if (isEditing && category?.id) {
        await inventoryCategoryApi.update(category.id, submitData);
      } else {
        await inventoryCategoryApi.create(submitData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} category`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEditing ? 'Edit Category' : 'Create New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Main Category *
              </label>
              <select
                value={formData.main_category}
                onChange={(e) => setFormData({ ...formData, main_category: e.target.value as 'rewards' | 'shop' })}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="rewards">Rewards</option>
                <option value="shop">Shop</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sub Category *
              </label>
              <input
                type="text"
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                required
                placeholder="e.g., daily_rewards"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
              {subCategoryExists && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  This sub category already exists in {formData.main_category}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                min={0}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Active
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || subCategoryExists}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
