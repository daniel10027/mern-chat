import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
export default function ForgotPage() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await api.post('/auth/forgot-password', { email }); setSent(true); toast.success('Reset link sent!') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }
  return (
    <div className='min-h-screen flex items-center justify-center bg-dark px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'><h1 className='text-3xl font-bold text-white'>Forgot password</h1></div>
        <div className='card'>
          {sent ? (<div className='text-center py-4'><div className='text-4xl mb-4'>??</div><p className='text-white font-medium'>Check your inbox</p><Link to='/login' className='btn-primary inline-block mt-6'>Back to login</Link></div>)
          : (<form onSubmit={handleSubmit} className='space-y-4'><div><label className='block text-sm font-medium text-gray-300 mb-1.5'>Email</label><input type='email' required className='input' placeholder='you@example.com' value={email} onChange={e => setEmail(e.target.value)} /></div><button type='submit' disabled={loading} className='btn-primary w-full py-3'>{loading ? 'Sending...' : 'Send reset link'}</button><Link to='/login' className='block text-center text-gray-400 text-sm hover:text-white'>? Back to login</Link></form>)}
        </div>
      </div>
    </div>
  )
}
