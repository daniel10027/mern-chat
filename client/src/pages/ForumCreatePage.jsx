import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'
const CATEGORIES = ['general','tech','news','help','showcase','off-topic']
export default function ForumCreatePage() {
  const navigate = useNavigate(); const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '' })
  const create = useMutation({
    mutationFn: (data) => api.post('/forum', data).then(r => r.data),
    onSuccess: (post) => { qc.invalidateQueries(['forum']); toast.success('Published!'); navigate('/forum/' + post._id) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content required')
    create.mutate({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
  }
  return (
    <div className='h-full overflow-y-auto'>
      <div className='max-w-3xl mx-auto px-6 py-8'>
        <Link to='/forum' className='text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-6'>? Back to Forum</Link>
        <div className='card'>
          <h1 className='text-xl font-bold text-white mb-6'>Create New Post</h1>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div><label className='block text-sm font-medium text-gray-300 mb-1.5'>Title *</label><input type='text' className='input' required placeholder='What is on your mind?' value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div>
            <div><label className='block text-sm font-medium text-gray-300 mb-1.5'>Category</label><div className='flex gap-2 flex-wrap'>{CATEGORIES.map(c => (<button key={c} type='button' onClick={() => setForm({...form,category:c})} className={'px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ' + (form.category===c?'bg-primary text-white':'bg-dark-border text-gray-400 hover:text-white')}>{c}</button>))}</div></div>
            <div><label className='block text-sm font-medium text-gray-300 mb-1.5'>Content *</label><textarea rows={8} className='input resize-none' required placeholder='Share your thoughts...' value={form.content} onChange={e => setForm({...form,content:e.target.value})} /></div>
            <div><label className='block text-sm font-medium text-gray-300 mb-1.5'>Tags</label><input type='text' className='input' placeholder='react, javascript (comma-separated)' value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} /></div>
            <div className='flex gap-3 pt-2'><button type='submit' disabled={create.isPending} className='btn-primary px-6'>{create.isPending?'Publishing...':'Publish Post'}</button><Link to='/forum' className='btn-ghost'>Cancel</Link></div>
          </form>
        </div>
      </div>
    </div>
  )
}
