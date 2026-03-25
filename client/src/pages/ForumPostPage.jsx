import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
export default function ForumPostPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuthStore(); const qc = useQueryClient()
  const [comment, setComment] = useState('')
  const { data: post, isLoading } = useQuery({ queryKey: ['forum-post', id], queryFn: () => api.get('/forum/' + id).then(r => r.data) })
  const like = useMutation({ mutationFn: () => api.post('/forum/' + id + '/like'), onSuccess: () => qc.invalidateQueries(['forum-post', id]) })
  const addComment = useMutation({ mutationFn: (content) => api.post('/forum/' + id + '/comments', { content }), onSuccess: () => { qc.invalidateQueries(['forum-post', id]); setComment(''); toast.success('Comment added') } })
  const deletePost = useMutation({ mutationFn: () => api.delete('/forum/' + id), onSuccess: () => { toast.success('Deleted'); navigate('/forum') } })
  const deleteComment = useMutation({ mutationFn: (cid) => api.delete('/forum/' + id + '/comments/' + cid), onSuccess: () => qc.invalidateQueries(['forum-post', id]) })
  if (isLoading) return <div className='flex items-center justify-center h-full'><div className='w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin' /></div>
  if (!post) return <div className='flex items-center justify-center h-full text-gray-400'>Post not found</div>
  return (
    <div className='h-full overflow-y-auto'>
      <div className='max-w-3xl mx-auto px-6 py-8'>
        <Link to='/forum' className='text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-6'>Back to Forum</Link>
        <div className='card mb-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold'>{post.author?.name?.[0]?.toUpperCase()}</div>
            <div><p className='text-white font-medium'>{post.author?.name}</p><p className='text-gray-500 text-xs'>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} - {post.views} views</p></div>
            {(post.author?._id === user?._id || user?.role === 'admin') && <button onClick={() => deletePost.mutate()} className='ml-auto btn-danger text-sm'>Delete</button>}
          </div>
          <h1 className='text-2xl font-bold text-white mb-4'>{post.title}</h1>
          <p className='text-gray-300 leading-relaxed whitespace-pre-wrap'>{post.content}</p>
          <div className='flex items-center gap-4 mt-6 pt-4 border-t border-dark-border'>
            <button onClick={() => like.mutate()} className={'flex items-center gap-2 text-sm ' + (post.likes?.includes(user?._id) ? 'text-danger' : 'text-gray-400 hover:text-danger')}>
              {post.likes?.includes(user?._id) ? 'Liked' : 'Like'} ({post.likes?.length || 0})
            </button>
          </div>
        </div>
        <div className='card'>
          <h2 className='font-semibold text-white mb-5'>Comments ({post.comments?.filter(c => !c.deleted).length || 0})</h2>
          {!post.closed && <div className='mb-6'><textarea rows={3} className='input resize-none mb-3' placeholder='Write a comment...' value={comment} onChange={e => setComment(e.target.value)} /><button onClick={() => comment.trim() && addComment.mutate(comment.trim())} disabled={!comment.trim() || addComment.isPending} className='btn-primary text-sm'>{addComment.isPending ? 'Posting...' : 'Post comment'}</button></div>}
          <div className='space-y-4'>
            {post.comments?.filter(c => !c.deleted).map(c => (
              <div key={c._id} className='flex gap-3 group'>
                <div className='w-8 h-8 rounded-full bg-primary/60 flex items-center justify-center text-white text-xs font-bold flex-shrink-0'>{c.author?.name?.[0]?.toUpperCase()}</div>
                <div className='flex-1'>
                  <div className='flex items-baseline gap-2'>
                    <span className='text-white text-sm font-medium'>{c.author?.name}</span>
                    <span className='text-gray-500 text-xs'>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                    {(c.author?._id === user?._id || user?.role === 'admin') && <button onClick={() => deleteComment.mutate(c._id)} className='ml-auto text-danger text-xs opacity-0 group-hover:opacity-100'>Delete</button>}
                  </div>
                  <p className='text-gray-300 text-sm mt-1'>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}