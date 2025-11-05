'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ImageTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 border-b border-zinc-200 dark:border-zinc-700">
      <nav className="flex space-x-8" aria-label="Tabs">
        <Link
          href="/images"
          className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
            pathname === '/images'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
          }`}
        >
          Image Management
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            Admin
          </span>
        </Link>
        <Link
          href="/images/public"
          className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
            pathname === '/images/public'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
          }`}
        >
          Public Image Management
          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-400">
            Public
          </span>
        </Link>
      </nav>
    </div>
  );
}

