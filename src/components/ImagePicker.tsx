'use client';

import { useState, useEffect } from 'react';
import { imageManagementApi, type Image } from '../lib/api';

interface ImagePickerProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  placeholder?: string;
}

export function ImagePicker({ value, onChange, label = 'Select Image', placeholder = 'Click to browse images' }: ImagePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (showModal) {
      fetchImages();
    }
  }, [showModal, page, searchTerm]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await imageManagementApi.getAll({
        search: searchTerm || undefined,
        page,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC',
      });
      setImages(response.items || []);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching images:', err);
      setError(err.message || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (image: Image) => {
    onChange(image.image_url);
    setShowModal(false);
  };

  return (
    <>
      <div>
        {label && (
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <img src={value} alt="Selected" className="h-8 w-8 rounded object-cover" />
              <span className="text-sm truncate">{value}</span>
            </div>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">{placeholder}</span>
          )}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="mt-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Clear selection
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-zinc-800 my-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Select Image from Image Management
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search images..."
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading images...</div>
              </div>
            ) : images.length === 0 ? (
              <div className="rounded-lg bg-zinc-50 p-12 text-center dark:bg-zinc-700">
                <p className="text-zinc-600 dark:text-zinc-400">No images found</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 max-h-96 overflow-y-auto mb-4">
                  {images.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => handleSelectImage(image)}
                      className={`group relative rounded-lg border-2 overflow-hidden transition-all ${
                        value === image.image_url
                          ? 'border-blue-500 ring-2 ring-blue-500'
                          : 'border-zinc-200 hover:border-blue-400 dark:border-zinc-700'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="h-32 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                          Select
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
                        <p className="text-xs text-white truncate">{image.title}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-md border border-zinc-300 px-4 py-2 disabled:opacity-50 dark:border-zinc-600"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
      )}
    </>
  );
}

