import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'
export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { const { data } = await api.post('/auth/register', form); setAuth(data.user, data.token); toast.success('Account created!'); navigate('/chat') }
    catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }
  return (
    <div className='min-h-screen flex items-center justify-center bg-dark px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4'>M</div>
          <h1 className='text-3xl font-bold text-white'>Create account</h1>
        </div>
        <div className='card'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {[{label:'Full name',key:'name',type:'text',ph:'Alice Smith'},{label:'Username',key:'username',type:'text',ph:'alice_smith'},{label:'Email',key:'email',type:'email',ph:'alice@example.com'},{label:'Password',key:'password',type:'password',ph:'Min 6 characters'}].map(({label,key,type,ph}) => (
              <div key={key}><label className='block text-sm font-medium text-gray-300 mb-1.5'>{label}</label><input type={type} required className='input' placeholder={ph} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} /></div>
            ))}
            <button type='submit' disabled={loading} className='btn-primary w-full py-3'>{loading ? 'Creating...' : 'Create account'}</button>
          </form>
          <p className='text-center text-gray-400 text-sm mt-6'>Already have an account? <Link to='/login' className='text-primary font-medium'>Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
