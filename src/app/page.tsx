'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { Navigation } from '../components/Navigation';

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      {isAuthenticated && <Navigation />}
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-zinc-900 dark:text-zinc-50">
            Admin Control Panel
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Manage and control your application with super admin privileges
          </p>
        </header>

        {/* Connection Status Alert */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>🔗 Backend API:</strong> Connected to{' '}
              <code className="rounded bg-blue-100 px-2 py-1 text-xs dark:bg-blue-900/40">
                https://steven-parker-api.gamisodes.com
              </code>
            </p>
          </div>
        </div>

        {/* Login Button / User Info */}
        <div className="mb-12 flex justify-center">
          {!isAuthenticated ? (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Super Admin Login
            </button>
          ) : (
            <div className="flex items-center gap-4 rounded-lg bg-white px-6 py-4 shadow-lg dark:bg-zinc-800">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Welcome, {user?.username || user?.email}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Role: {user?.role}
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Features Card */}
            <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-800">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Features
              </h2>
              <ul className="space-y-3 text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Image Management System
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Public Image Management
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Full CRUD Operations
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Secure Authentication
                </li>
              </ul>
            </div>

            {/* Information Card */}
            <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-800">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                About
              </h2>
              <p className="mb-4 text-zinc-700 dark:text-zinc-300">
                This admin control panel provides comprehensive management tools
                for your application. Access is restricted to super admin users
                only.
              </p>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-50">
                    Access Level:
                  </strong>{' '}
                  Super Admin Only
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-50">
                    Security:
                  </strong>{' '}
                  JWT Token Authentication
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-50">
                    Features:
                  </strong>{' '}
                  Image Management, User Administration
                </p>
              </div>
            </div>

            {/* Quick Access Card */}
            {isAuthenticated && (
              <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-800 md:col-span-2">
                <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Quick Access
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => router.push('/images')}
                    className="rounded-md border border-zinc-200 p-4 text-left transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20"
                  >
                    <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                      Image Management
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Create, update, and manage images with full admin control
                    </p>
                  </button>
                  <button
                    onClick={() => router.push('/images/public')}
                    className="rounded-md border border-zinc-200 p-4 text-left transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20"
                  >
                    <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                      Public Images
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      View and manage publicly accessible images
                    </p>
                  </button>
                  <button
                    onClick={() => router.push('/countdown')}
                    className="rounded-md border border-zinc-200 p-4 text-left transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20"
                  >
                    <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                      7 Days Countdown Management
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Manage 7-day countdown events with daily rewards
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
