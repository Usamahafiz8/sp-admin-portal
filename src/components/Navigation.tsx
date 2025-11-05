'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Admin Control Panel
            </Link>
            <div className="flex gap-1">
              <Link
                href="/images"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/images'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Image Management
              </Link>
              <Link
                href="/images/public"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/images/public'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Public Images
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user?.username || user?.email}
            </span>
            <button
              onClick={logout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

