'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  user_id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ full_name: '', email: '', role: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      const response = await api.put(`/users/${userId}/status`, { is_active: !currentStatus });
      if (response.data.success) {
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_active: !currentStatus } : u));
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ full_name: user.full_name || '', email: user.email, role: user.role });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setFormLoading(true);
      const response = await api.put(`/users/${editingUser.user_id}`, formData);
      if (response.data.success) {
        setUsers(prev => prev.map(u => u.user_id === editingUser.user_id ? { ...u, ...formData } : u));
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-64 bg-slate-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">User Management</h3>
          <p className="text-slate-500">View and manage system users and their roles.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input type="text" placeholder="Search users..." className="outline-none text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-bold text-slate-900">{user.full_name || 'Anonymous'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase
                    ${user.role.toUpperCase() === 'ADMIN' ? 'bg-rose-50 text-rose-600' : 
                      user.role.toUpperCase() === 'HOST' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${user.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span className={`size-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    {user.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(user.user_id, user.is_active)} 
                        disabled={actionLoading === user.user_id}
                        className={`p-2 transition-colors ${actionLoading === user.user_id ? 'animate-pulse text-slate-200' : 
                          user.is_active ? 'text-slate-400 hover:text-rose-500' : 'text-emerald-500 hover:text-emerald-600'}`}
                        title={user.is_active ? 'Deactivate User' : 'Activate User'}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {user.is_active ? 'person_off' : 'person_check'}
                        </span>
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Edit User Account</h4>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                >
                  <option value="USER">User</option>
                  <option value="HOST">Host</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all">Cancel</button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  {formLoading ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
