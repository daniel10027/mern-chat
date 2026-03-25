import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../context/authStore';

const CATEGORIES = ['all', 'general', 'tech', 'news', 'help', 'showcase', 'off-topic'];

const categoryColors = {
  general: 'bg-blue-500/10 text-blue-400',
  tech: 'bg-purple-500/10 text-purple-400',
  news: 'bg-yellow-500/10 text-yellow-400',
  help: 'bg-green-500/10 text-green-400',
  showcase: 'bg-pink-500/10 text-pink-400',
  'off-topic': 'bg-gray-500/10 text-gray-400',
};

export default function ForumPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['forum', category, search, sort, page],
    queryFn: () => api.get('/forum', {
      params: { category: category !== 'all' ? category : undefined, search, sort, page, limit: 10 }
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const like = useMutation({
    mutationFn: (id) => api.post(`/forum/${id}/like`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(['forum']),
  });

  const deletePost = useMutation({
    mutationFn: (id) => api.delete(`/forum/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['forum']);
      toast.success('Post deleted');
    },
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Forum</h1>
            <p className="text-gray-400 text-sm mt-1">Join the conversation</p>
          </div>
          <Link to="/forum/new" className="btn-primary flex items-center gap-2">
            <span>+</span> New Post
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-6 space-y-3">
          <input className="input" placeholder="Search posts..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <div className="flex items-center gap-3 flex-wrap">
            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize
                    ${category === c ? 'bg-primary text-white' : 'bg-dark-border text-gray-400 hover:text-white'}`}>
                  {c}
                </button>
              ))}
            </div>
            {/* Sort */}
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="ml-auto bg-dark-card border border-dark-border text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Posts */}
        {isLoading
          ? <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          : data?.posts?.length === 0
            ? <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-4">📋</div>
                <p className="font-medium text-white">No posts yet</p>
                <p className="text-sm mt-2">Be the first to start a discussion!</p>
              </div>
            : <div className="space-y-4">
                {data.posts.map(post => (
                  <div key={post._id} className="card hover:border-primary/30 transition-colors group">
                    <div className="flex items-start gap-4">
                      {/* Author avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {post.author?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`badge capitalize ${categoryColors[post.category] || 'bg-gray-500/10 text-gray-400'}`}>
                            {post.category}
                          </span>
                          {post.pinned && <span className="badge bg-yellow-500/10 text-yellow-400">📌 Pinned</span>}
                          {post.closed && <span className="badge bg-red-500/10 text-red-400">🔒 Closed</span>}
                          <span className="text-gray-500 text-xs">
                            by <span className="text-gray-300">{post.author?.name}</span>
                            {' · '}
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {/* Title */}
                        <Link to={`/forum/${post._id}`}
                          className="text-white font-semibold text-base hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </Link>
                        {/* Preview */}
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{post.content}</p>
                        {/* Tags */}
                        {post.tags?.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {post.tags.map(tag => (
                              <span key={tag} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-3">
                          <button onClick={() => like.mutate(post._id)}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-danger transition-colors">
                            <span>{post.likes?.includes(user?._id) ? '❤️' : '🤍'}</span>
                            <span>{post.likes?.length || 0}</span>
                          </button>
                          <Link to={`/forum/${post._id}`}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors">
                            <span>💬</span>
                            <span>{post.comments?.length || 0} comments</span>
                          </Link>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            👁 {post.views}
                          </span>
                          {(post.author?._id === user?._id || user?.role === 'admin') && (
                            <button onClick={() => deletePost.mutate(post._id)}
                              className="ml-auto text-xs text-danger opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {data.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
                    <span className="text-gray-400 text-sm">Page {page} of {data.pages}</span>
                    <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                      className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
                  </div>
                )}
              </div>
        }
      </div>
    </div>
  );
}
