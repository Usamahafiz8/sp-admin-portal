'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { founderPackApi, type FoundersListQuery, type Founder } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';

export default function FoundersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_founders: 0,
    per_page: 50,
    has_next: false,
    has_prev: false,
  });
  const [summary, setSummary] = useState({
    total_founders: 0,
    total_revenue: 0,
    platform_breakdown: { ios: 0, android: 0 },
    currency_breakdown: {} as Record<string, number>,
  });
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
      fetchFounders();
    }
  }, [isAuthenticated, filters]);

  const fetchFounders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await founderPackApi.getFoundersList(filters);
      setFounders(response.founders || []);
      setPagination(response.pagination);
      setSummary(response.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch founders');
      setFounders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FoundersListQuery, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Founders List</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View all founder pack purchases ({summary.total_founders.toLocaleString()} total)
            </p>
          </div>
          <button
            onClick={() => router.push('/founder-pack')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Founders</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{summary.total_founders.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.total_revenue, 'USD')}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Platform Breakdown</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              iOS: {summary.platform_breakdown.ios} • Android: {summary.platform_breakdown.android}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
              <select
                value={filters.platform || 'all'}
                onChange={(e) => handleFilterChange('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Platforms</option>
                <option value="ios">iOS</option>
                <option value="android">Android</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
              <select
                value={filters.sort_by || 'purchase_date'}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="purchase_date">Purchase Date</option>
                <option value="user_id">User ID</option>
                <option value="price">Price</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
              <select
                value={filters.sort_order || 'desc'}
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by username..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Founders Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading founders...</div>
          </div>
        ) : founders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">No founders found</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purchase Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {founders.map((founder) => (
                      <tr key={founder.purchase_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{founder.username}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">ID: {founder.user_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(founder.purchase_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            founder.platform === 'ios'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {founder.platform.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(founder.price_paid, founder.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {founder.transaction_id.substring(0, 20)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            founder.purchase_status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {founder.purchase_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total_founders)} of{' '}
                  {pagination.total_founders} founders
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={!pagination.has_prev}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={!pagination.has_next}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

