'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Navigation } from '../../components/Navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function TapathonPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Tapathon Management</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage all tapathon-related data including taps, community goals, and rewards
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Taps Management Card */}
          <Link
            href="/tapathon/taps"
            className="group rounded-lg border-2 border-blue-200 bg-white p-6 transition-all hover:border-blue-400 hover:shadow-lg dark:border-blue-800 dark:bg-zinc-800"
          >
            <div className="mb-4 text-4xl">👆</div>
            <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Taps Management</h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              View, create, update, and delete tap records. Manage all user tap activities.
            </p>
            <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700 dark:text-blue-400">
              Manage Taps →
            </div>
          </Link>

          {/* Community Goals Management Card */}
          <Link
            href="/tapathon/goals"
            className="group rounded-lg border-2 border-green-200 bg-white p-6 transition-all hover:border-green-400 hover:shadow-lg dark:border-green-800 dark:bg-zinc-800"
          >
            <div className="mb-4 text-4xl">🎯</div>
            <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Community Goals</h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Manage community goal tiers, set targets, and track progress for tapathon goals.
            </p>
            <div className="text-sm font-medium text-green-600 group-hover:text-green-700 dark:text-green-400">
              Manage Goals →
            </div>
          </Link>

          {/* Tap Rewards Management Card */}
          <Link
            href="/tapathon/rewards"
            className="group rounded-lg border-2 border-purple-200 bg-white p-6 transition-all hover:border-purple-400 hover:shadow-lg dark:border-purple-800 dark:bg-zinc-800"
          >
            <div className="mb-4 text-4xl">🎁</div>
            <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Tap Rewards</h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Manage tap rewards, view reward history, and track claim status for all users.
            </p>
            <div className="text-sm font-medium text-purple-600 group-hover:text-purple-700 dark:text-purple-400">
              Manage Rewards →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

