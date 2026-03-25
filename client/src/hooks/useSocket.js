import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useAuthStore from '../context/authStore'
import useChatStore from '../context/chatStore'
let socketInstance = null
export const getSocket = () => socketInstance
const useSocket = () => {
  const { token, isAuthenticated } = useAuthStore()
  const { addMessage, updateLastMessage, setTyping, setUserOnline, setUserOffline } = useChatStore()
  const connected = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || !token || connected.current) return
    socketInstance = io('/', { auth: { token }, transports: ['websocket'] })
    connected.current = true
    socketInstance.on('message:new', (msg) => { addMessage(msg.chat, msg); updateLastMessage(msg.chat, msg) })
    socketInstance.on('typing:start', ({ userId, chatId }) => setTyping(chatId, userId, true))
    socketInstance.on('typing:stop', ({ userId, chatId }) => setTyping(chatId, userId, false))
    socketInstance.on('user:online', (userId) => setUserOnline(userId))
    socketInstance.on('user:offline', (userId) => setUserOffline(userId))
    return () => { socketInstance?.disconnect(); connected.current = false; socketInstance = null }
  }, [isAuthenticated, token])
  return socketInstance
}
export default useSocket
