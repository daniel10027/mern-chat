import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
export default function VerifyEmailPage() {
  const { token } = useParams(); const navigate = useNavigate(); const [status, setStatus] = useState('verifying')
  useEffect(() => {
    api.get('/auth/verify-email/' + token)
      .then(({ data }) => { useAuthStore.getState().setAuth(data.user, data.token); setStatus('success'); setTimeout(() => navigate('/chat'), 2000) })
      .catch(() => setStatus('error'))
  }, [token])
  return (
    <div className='min-h-screen flex items-center justify-center bg-dark'>
      <div className='card text-center max-w-md mx-4'>
        {status === 'verifying' && <><div className='text-4xl mb-4'>?</div><p className='text-white'>Verifying...</p></>}
        {status === 'success' && <><div className='text-4xl mb-4'>?</div><p className='text-white font-medium'>Email verified!</p><p className='text-gray-400 text-sm mt-2'>Redirecting...</p></>}
        {status === 'error' && <><div className='text-4xl mb-4'>?</div><p className='text-white font-medium'>Verification failed</p><Link to='/login' className='btn-primary inline-block mt-4'>Back to login</Link></>}
      </div>
    </div>
  )
}
