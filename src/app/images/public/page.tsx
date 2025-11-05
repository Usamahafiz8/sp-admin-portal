'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { publicImageApi, type Image, type ImageListResponse } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';

export default function PublicImagesPage() {
  const { isAuthenticated } = useAuth();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchImages();
  }, [page]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      // Only send parameters that are actually needed
      // The endpoint works without query params, so we'll minimize them
      const params: any = {};
      
      // Only add page if it's not 1 (backend defaults to page 1)
      if (page !== 1) {
        params.page = page;
      }
      
      // Only add limit if it's not the default (backend likely defaults to 20)
      // For now, let backend handle defaults
      
      // Skip sort_by and sort_order - backend handles defaults
      // These might be causing validation errors
      
      // Only add search/category if they have values
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (category && category.trim()) {
        params.category = category.trim();
      }
      
      // Only send params if we have any
      const response = await publicImageApi.getAll(Object.keys(params).length > 0 ? params : undefined);
      setImages(response.items || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching public images:', err);
      setError(err.message || 'Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchImages();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Public Images
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            View all published and publicly accessible images
          </p>
        </div>

        {/* Search and Filter */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search images..."
              className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
            />
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category..."
              className="w-48 rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-600 px-6 py-2 text-white transition-colors hover:bg-zinc-700"
            >
              Search
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-semibold mb-2">{error}</p>
            {error.includes('table does not exist') && (
              <div className="mt-3 text-sm">
                <p className="mb-2">To fix this, run the migration script on the backend:</p>
                <code className="block bg-red-100 dark:bg-red-900/40 p-2 rounded text-xs">
                  cd steven-and-parker && node scripts/run-image-migration.js
                </code>
              </div>
            )}
          </div>
        )}

        {/* Images Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading images...</div>
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">No published images found</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="mb-3 aspect-video overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-700">
                    {image.image_url ? (
                      <img
                        src={image.image_url}
                        alt={image.alt_text || image.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                    {image.title}
                  </h3>
                  {image.description && (
                    <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {image.description}
                    </p>
                  )}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {image.category && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {image.category}
                      </span>
                    )}
                    {image.tags && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {image.tags.split(',').slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={image.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-center text-sm text-white transition-colors hover:bg-blue-700"
                    >
                      View Full Size
                    </a>
                    {isAuthenticated && (
                      <button
                        onClick={() => window.location.href = `/images/${image.id}`}
                        className="rounded-md bg-zinc-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-zinc-300 px-4 py-2 disabled:opacity-50 dark:border-zinc-600"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-zinc-300 px-4 py-2 disabled:opacity-50 dark:border-zinc-600"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

