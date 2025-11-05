'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi, type AdminUser } from '../../lib/api';
import { Navigation } from '../../components/Navigation';

export default function AdminManagementPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin' | 'super_admin'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'super_admin'>('user');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'super_admin') {
      fetchUsers();
    } else if (isAuthenticated && user?.role !== 'super_admin') {
      setError('Access denied. Super admin privileges required.');
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getAllUsers();
      // Ensure we always have an array
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    // Prevent changing own role
    if (selectedUser.id === user?.id) {
      setError('Cannot change your own role');
      return;
    }

    // Don't update if role hasn't changed
    if (newRole === selectedUser.role) {
      setShowRoleModal(false);
      setSelectedUser(null);
      return;
    }

    try {
      setUpdatingRole(true);
      setError(null);
      await adminApi.updateUserRole(selectedUser.id, newRole);
      await fetchUsers(); // Refresh the list
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('user');
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const openRoleModal = (userItem: AdminUser) => {
    setSelectedUser(userItem);
    setNewRole(userItem.role);
    setShowRoleModal(true);
    setError(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'user':
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter users based on role and search term
  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesSearch =
          searchTerm === '' ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesRole && matchesSearch;
      })
    : [];

  // Count users by role
  const usersArray = Array.isArray(users) ? users : [];
  const roleCounts = {
    all: usersArray.length,
    user: usersArray.filter((u) => u.role === 'user').length,
    admin: usersArray.filter((u) => u.role === 'admin').length,
    super_admin: usersArray.filter((u) => u.role === 'super_admin').length,
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            Access denied. Super admin privileges required to manage users.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Admin Management</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage user roles and permissions (Super Admin only)
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Users</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {roleCounts.all}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Regular Users</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {roleCounts.user}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Admins</div>
            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {roleCounts.admin}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Super Admins</div>
            <div className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {roleCounts.super_admin}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filterRole === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              All ({roleCounts.all})
            </button>
            <button
              onClick={() => setFilterRole('user')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filterRole === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              Users ({roleCounts.user})
            </button>
            <button
              onClick={() => setFilterRole('admin')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filterRole === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              Admins ({roleCounts.admin})
            </button>
            <button
              onClick={() => setFilterRole('super_admin')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filterRole === 'super_admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              Super Admins ({roleCounts.super_admin})
            </button>
          </div>
          <div className="flex-1 md:max-w-md">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading users...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center dark:bg-zinc-800">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-50">
                          {userItem.username}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {userItem.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleColor(
                          userItem.role
                        )}`}
                      >
                        {userItem.role === 'super_admin' ? 'Super Admin' : userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          userItem.status
                        )}`}
                      >
                        {userItem.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(userItem.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {userItem.id !== user?.id && (
                        <button
                          onClick={() => openRoleModal(userItem)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Change Role
                        </button>
                      )}
                      {userItem.id === user?.id && (
                        <span className="text-zinc-400 dark:text-zinc-500">Current User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Role Update Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-800">
              <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Change User Role
              </h2>
              <div className="mb-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  User: <span className="font-semibold">{selectedUser.username}</span>
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Current Role: <span className="font-semibold capitalize">{selectedUser.role}</span>
                </p>
              </div>
              <div className="mb-4 space-y-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  New Role
                </label>
                <select
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                  value={newRole}
                  onChange={(e) => {
                    setNewRole(e.target.value as 'user' | 'admin' | 'super_admin');
                  }}
                  disabled={updatingRole}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {newRole !== selectedUser.role && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Changing from {selectedUser.role} to {newRole}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                    setNewRole('user');
                    setError(null);
                  }}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  disabled={updatingRole}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleUpdate}
                  disabled={updatingRole || newRole === selectedUser.role}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
                >
                  {updatingRole ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

