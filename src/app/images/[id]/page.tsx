'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { imageManagementApi, type Image } from '../../../lib/api';
import { Navigation } from '../../../components/Navigation';

export default function EditImagePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [image, setImage] = useState<Image | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchImage();
    }
  }, [isAuthenticated, id]);

  const fetchImage = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await imageManagementApi.getById(id);
      setImage(data);
      setTitle(data.title);
      setImageUrl(data.image_url);
      setIsPublished(data.is_published);
      setStatus(data.status);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await imageManagementApi.update(id, {
        title,
        image_url: imageUrl,
        is_published: isPublished,
        status,
      });
      router.push('/images');
    } catch (err: any) {
      setError(err.message || 'Failed to update image');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading image...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !image) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
          <button
            onClick={() => router.push('/images')}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Back to Images
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/images')}
            className="mb-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Images
          </button>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Edit Image</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
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

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Published
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/images')}
                  className="flex-1 rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Preview
            </h2>
            <div className="mb-4 aspect-video overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-700">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  No Image
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
              <div className="mt-2 flex gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    isPublished
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    status === 'active'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

