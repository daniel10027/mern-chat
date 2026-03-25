import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'
export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { const { data } = await api.post('/auth/login', form); setAuth(data.user, data.token); toast.success('Welcome back!'); navigate('/chat') }
    catch (err) { toast.error(err.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }
  return (
    <div className='min-h-screen flex items-center justify-center bg-dark px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4'>M</div>
          <h1 className='text-3xl font-bold text-white'>Welcome back</h1>
          <p className='text-gray-400 mt-2'>Sign in to your account</p>
        </div>
        <div className='card'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div><label className='block text-sm font-medium text-gray-300 mb-1.5'>Email</label><input type='email' required className='input' placeholder='you@example.com' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div>
              <div className='flex justify-between items-center mb-1.5'><label className='text-sm font-medium text-gray-300'>Password</label><Link to='/forgot-password' className='text-xs text-primary hover:text-primary-light'>Forgot password?</Link></div>
              <input type='password' required className='input' placeholder='........' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type='submit' disabled={loading} className='btn-primary w-full py-3 mt-2'>{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <p className='text-center text-gray-400 text-sm mt-6'>Don t have an account? <Link to='/register' className='text-primary font-medium'>Sign up</Link></p>
        </div>
      </div>
    </div>
  )
}