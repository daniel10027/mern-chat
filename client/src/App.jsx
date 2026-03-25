import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './context/authStore'
import useSocket from './hooks/useSocket'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPage from './pages/ForgotPage'
import ResetPage from './pages/ResetPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import ForumPage from './pages/ForumPage'
import ForumPostPage from './pages/ForumPostPage'
import ForumCreatePage from './pages/ForumCreatePage'
import Layout from './components/ui/Layout'

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to='/login' replace />
}
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? children : <Navigate to='/chat' replace />
}

export default function App() {
  const { fetchMe, isAuthenticated } = useAuthStore()
  useSocket()
  useEffect(() => { if (isAuthenticated) fetchMe() }, [])
  return (
    <Routes>
      <Route path='/login' element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path='/register' element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path='/forgot-password' element={<PublicRoute><ForgotPage /></PublicRoute>} />
      <Route path='/reset-password/:token' element={<PublicRoute><ResetPage /></PublicRoute>} />
      <Route path='/verify-email/:token' element={<VerifyEmailPage />} />
      <Route path='/' element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to='/chat' replace />} />
        <Route path='chat' element={<ChatPage />} />
        <Route path='chat/:id' element={<ChatPage />} />
        <Route path='forum' element={<ForumPage />} />
        <Route path='forum/new' element={<ForumCreatePage />} />
        <Route path='forum/:id' element={<ForumPostPage />} />
        <Route path='profile' element={<ProfilePage />} />
        <Route path='profile/:id' element={<ProfilePage />} />
      </Route>
      <Route path='*' element={<Navigate to='/chat' replace />} />
    </Routes>
  )
}
