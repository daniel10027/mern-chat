import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../../context/authStore'
import toast from 'react-hot-toast'
const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} className={({ isActive }) => 'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ' + (isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-dark-card hover:text-white')}>
    <span className='text-lg'>{icon}</span><span className='hidden md:block'>{label}</span>
  </NavLink>
)
export default function Layout() {
  const { user, logout } = useAuthStore(); const navigate = useNavigate(); const [menuOpen, setMenuOpen] = useState(false)
  const handleLogout = async () => { await logout(); toast.success('Logged out'); navigate('/login') }
  return (
    <div className='flex h-screen overflow-hidden bg-dark'>
      <aside className='w-16 md:w-56 flex flex-col border-r border-dark-border bg-dark-card flex-shrink-0'>
        <div className='px-4 py-5 border-b border-dark-border flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>M</div>
          <span className='hidden md:block font-bold text-white text-lg'>MERN Chat</span>
        </div>
        <nav className='flex-1 p-3 space-y-1'>
          <NavItem to='/chat' icon='??' label='Chats' />
          <NavItem to='/forum' icon='??' label='Forum' />
          <NavItem to='/profile' icon='??' label='Profile' />
        </nav>
        <div className='p-3 border-t border-dark-border'>
          <button onClick={() => setMenuOpen(!menuOpen)} className='w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-dark-border transition-colors'>
            <div className='w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0'>{user?.name?.[0]?.toUpperCase()}</div>
            <div className='hidden md:block text-left flex-1 min-w-0'><p className='text-white text-sm font-medium truncate'>{user?.name}</p><p className='text-gray-500 text-xs truncate'>@{user?.username}</p></div>
          </button>
          {menuOpen && (
            <div className='mt-2 bg-dark border border-dark-border rounded-xl overflow-hidden shadow-xl'>
              <NavLink to='/profile' className='flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-card hover:text-white' onClick={() => setMenuOpen(false)}>?? <span className='hidden md:block'>Settings</span></NavLink>
              <button onClick={handleLogout} className='w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10'>?? <span className='hidden md:block'>Logout</span></button>
            </div>
          )}
        </div>
      </aside>
      <main className='flex-1 overflow-hidden'><Outlet /></main>
    </div>
  )
}
