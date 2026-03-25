import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'
export default function ResetPage() {
  const { token } = useParams(); const navigate = useNavigate()
  const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Min 6 characters')
    setLoading(true)
    try { const { data } = await api.post('/auth/reset-password/' + token, { password }); useAuthStore.getState().setAuth(data.user, data.token); toast.success('Password reset!'); navigate('/chat') }
    catch (err) { toast.error(err.response?.data?.message || 'Reset failed') }
    finally { setLoading(false) }
  }
  return (
    <div className='min-h-screen flex items-center justify-center bg-dark px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'><h1 className='text-3xl font-bold text-white'>Reset password</h1></div>
        <div className='card'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div><label className='block text-sm font-medium text-gray-300 mb-1.5'>New password</label><input type='password' required className='input' placeholder='Min 6 characters' value={password} onChange={e => setPassword(e.target.value)} /></div>
            <button type='submit' disabled={loading} className='btn-primary w-full py-3'>{loading ? 'Resetting...' : 'Reset password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
