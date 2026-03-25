import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../context/authStore';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const isOwnProfile = !id || id === me?._id;

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatar: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', id || me?._id],
    queryFn: () => api.get(`/users/${id || me?._id}`).then(r => r.data),
    onSuccess: (data) => {
      if (isOwnProfile) setForm({ name: data.name, bio: data.bio || '', avatar: data.avatar || '' });
    },
    enabled: !!me,
  });

  // Fetch friends
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/users/friends').then(r => r.data),
    enabled: isOwnProfile,
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: (data) => api.patch('/users/profile', data).then(r => r.data),
    onSuccess: (data) => {
      updateUser(data);
      qc.setQueryData(['user', me._id], data);
      setEditMode(false);
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  // Change password
  const changePw = useMutation({
    mutationFn: (data) => api.patch('/auth/change-password', data),
    onSuccess: () => {
      setPwForm({ currentPassword: '', newPassword: '' });
      toast.success('Password changed!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  // Toggle friend
  const toggleFriend = useMutation({
    mutationFn: (userId) => api.post(`/users/${userId}/friend`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(['friends']),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isFriend = friends.some(f => f._id === profile?._id);

  const tabs = isOwnProfile
    ? [{ id: 'profile', label: 'Profile' }, { id: 'password', label: 'Security' }, { id: 'friends', label: `Friends (${friends.length})` }]
    : [{ id: 'profile', label: 'Profile' }];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Cover & Avatar */}
        <div className="card mb-6">
          <div className="h-28 rounded-xl bg-gradient-to-br from-primary/30 to-primary-dark/10 mb-4 -mx-4 -mt-4 rounded-t-xl" />
          <div className="flex items-end justify-between -mt-14 px-2">
            <div className="relative">
              {profile?.avatar
                ? <img src={profile.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-dark-card" />
                : <div className="w-20 h-20 rounded-full bg-primary border-4 border-dark-card flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.name?.[0]?.toUpperCase()}
                  </div>
              }
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-dark-card
                ${profile?.isOnline ? 'bg-success' : 'bg-gray-500'}`} />
            </div>
            <div className="flex gap-2 mb-2">
              {isOwnProfile
                ? <button onClick={() => setEditMode(!editMode)} className={editMode ? 'btn-ghost' : 'btn-primary'}>
                    {editMode ? 'Cancel' : 'Edit profile'}
                  </button>
                : <button onClick={() => toggleFriend.mutate(profile._id)}
                    className={isFriend ? 'btn-danger' : 'btn-primary'}>
                    {isFriend ? 'Unfriend' : 'Add friend'}
                  </button>
              }
            </div>
          </div>
          <div className="mt-3 px-2">
            <h1 className="text-xl font-bold text-white">{profile?.name}</h1>
            <p className="text-gray-400 text-sm">@{profile?.username}</p>
            {profile?.bio && <p className="text-gray-300 text-sm mt-2">{profile.bio}</p>}
            <p className="text-gray-500 text-xs mt-3">
              Joined {profile?.createdAt && formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-dark-border mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                ${activeTab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          editMode ? (
            <div className="card space-y-4">
              <h2 className="font-semibold text-white">Edit Profile</h2>
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Avatar URL', key: 'avatar', type: 'url', placeholder: 'https://...' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm text-gray-400 mb-1">{label}</label>
                  <input type={type} className="input" placeholder={placeholder}
                    value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                <textarea rows={3} className="input resize-none" placeholder="Tell us about yourself..."
                  value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => updateProfile.mutate(form)}
                  disabled={updateProfile.isPending} className="btn-primary">
                  {updateProfile.isPending ? 'Saving...' : 'Save changes'}
                </button>
                <button onClick={() => setEditMode(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="card">
              <h2 className="font-semibold text-white mb-4">About</h2>
              <div className="space-y-3">
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-500 w-20">Name</span>
                  <span className="text-white">{profile?.name}</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-500 w-20">Username</span>
                  <span className="text-white">@{profile?.username}</span>
                </div>
                {isOwnProfile && (
                  <div className="flex gap-3 text-sm">
                    <span className="text-gray-500 w-20">Email</span>
                    <span className="text-white">{me?.email}</span>
                  </div>
                )}
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-500 w-20">Bio</span>
                  <span className="text-white">{profile?.bio || 'No bio yet'}</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-500 w-20">Status</span>
                  <span className={profile?.isOnline ? 'text-success' : 'text-gray-400'}>
                    {profile?.isOnline ? '🟢 Online' : `Last seen ${formatDistanceToNow(new Date(profile?.lastSeen || Date.now()), { addSuffix: true })}`}
                  </span>
                </div>
              </div>
            </div>
          )
        )}

        {/* Security Tab */}
        {activeTab === 'password' && isOwnProfile && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Change Password</h2>
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword', hint: 'Min 6 characters' },
            ].map(({ label, key, hint }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1">{label}</label>
                <input type="password" className="input" placeholder="••••••••"
                  value={pwForm[key]} onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} />
                {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
              </div>
            ))}
            <button
              onClick={() => changePw.mutate(pwForm)}
              disabled={changePw.isPending || !pwForm.currentPassword || !pwForm.newPassword}
              className="btn-primary">
              {changePw.isPending ? 'Changing...' : 'Change password'}
            </button>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && isOwnProfile && (
          <div className="card">
            <h2 className="font-semibold text-white mb-4">Friends</h2>
            {friends.length === 0
              ? <p className="text-gray-500 text-sm">No friends yet. Search for users in the chat section!</p>
              : <div className="space-y-3">
                  {friends.map(f => (
                    <div key={f._id} className="flex items-center gap-3">
                      <div className="relative">
                        {f.avatar
                          ? <img src={f.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                          : <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                              {f.name[0].toUpperCase()}
                            </div>
                        }
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-card ${f.isOnline ? 'bg-success' : 'bg-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{f.name}</p>
                        <p className="text-gray-500 text-xs">@{f.username}</p>
                      </div>
                      <button onClick={() => toggleFriend.mutate(f._id)} className="btn-danger text-xs px-3 py-1">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}
