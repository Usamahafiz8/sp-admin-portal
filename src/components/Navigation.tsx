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
              <Link
                href="/countdown"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/countdown' || pathname?.startsWith('/countdown')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                7 Days Countdown
              </Link>
              <Link
                href="/inventory"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/inventory' || pathname?.startsWith('/inventory')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Inventory
              </Link>
              <Link
                href="/rewards"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/rewards' || pathname?.startsWith('/rewards')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Daily Rewards
              </Link>
              <Link
                href="/easter-egg"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/easter-egg' || pathname?.startsWith('/easter-egg')
                    ? 'bg-purple-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Easter Eggs
              </Link>
              <Link
                href="/community-goals"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/community-goals' || pathname?.startsWith('/community-goals')
                    ? 'bg-green-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Community Goals
              </Link>
              <Link
                href="/tapathon"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/tapathon' || pathname?.startsWith('/tapathon')
                    ? 'bg-orange-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Tapathon
              </Link>
              <Link
                href="/founder-pack"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === '/founder-pack' || pathname?.startsWith('/founder-pack')
                    ? 'bg-purple-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Founder Pack
              </Link>
              {/* {user?.role === 'super_admin' && (
                <Link
                  href="/admins"
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    pathname === '/admins' || pathname?.startsWith('/admins')
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  Admin Management
                </Link>
              )} */}
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

