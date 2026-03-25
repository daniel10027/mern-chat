import { create } from 'zustand'
const useChatStore = create((set) => ({
  chats: [], activeChat: null, messages: {}, typingUsers: {}, onlineUsers: new Set(),
  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat }),
  addMessage: (chatId, message) => set((s) => ({ messages: { ...s.messages, [chatId]: [...(s.messages[chatId] || []), message] } })),
  setMessages: (chatId, messages) => set((s) => ({ messages: { ...s.messages, [chatId]: messages } })),
  updateLastMessage: (chatId, message) => set((s) => ({ chats: s.chats.map((c) => c._id === chatId ? { ...c, lastMessage: message } : c) })),
  setTyping: (chatId, userId, isTyping) => set((s) => { const current = new Set(s.typingUsers[chatId] || []); isTyping ? current.add(userId) : current.delete(userId); return { typingUsers: { ...s.typingUsers, [chatId]: current } } }),
  setUserOnline: (userId) => set((s) => ({ onlineUsers: new Set([...s.onlineUsers, userId]) })),
  setUserOffline: (userId) => set((s) => { const next = new Set(s.onlineUsers); next.delete(userId); return { onlineUsers: next } }),
  deleteMessage: (chatId, messageId) => set((s) => ({ messages: { ...s.messages, [chatId]: (s.messages[chatId] || []).map((m) => m._id === messageId ? { ...m, deleted: true, content: 'This message was deleted' } : m) } })),
}))
export default useChatStore
