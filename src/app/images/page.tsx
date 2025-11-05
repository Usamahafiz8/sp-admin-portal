'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { imageManagementApi, type Image, type ImageListResponse } from '../../lib/api';
import { Navigation } from '../../components/Navigation';

export default function ImageManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchImages();
    }
  }, [isAuthenticated, page]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await imageManagementApi.getAll(params);
      setImages(response.items || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      await imageManagementApi.delete(id);
      fetchImages();
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchImages();
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Image Management
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage all images with full CRUD operations
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + Create Image
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search images..."
              className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
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
            <p className="text-lg text-zinc-600 dark:text-zinc-400">No images found</p>
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
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        image.is_published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {image.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        image.status === 'active'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {image.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/images/${image.id}`)}
                      className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
                    >
                      Delete
                    </button>
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

      {/* Create Modal - We'll add this component next */}
      {showCreateModal && (
        <CreateImageModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchImages();
          }}
        />
      )}
    </div>
  );
}

// Create Image Modal Component
function CreateImageModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await imageManagementApi.create({ title, image_url: imageUrl });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-800">
        <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Create New Image
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

