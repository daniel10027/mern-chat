import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../context/authStore';
import useChatStore from '../context/chatStore';
import { getSocket } from '../hooks/useSocket';

// ── Avatar helper ──────────────────────────────────────────────────────────────
function Avatar({ user, size = 9, showStatus = false, onlineUsers }) {
  const isOnline = onlineUsers?.has(user?._id) || user?.isOnline;
  return (
    <div className="relative flex-shrink-0">
      {user?.avatar
        ? <img src={user.avatar} alt={user.name}
            className={`w-${size} h-${size} rounded-full object-cover`} />
        : <div className={`w-${size} h-${size} rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm`}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
      }
      {showStatus && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-card
          ${isOnline ? 'bg-success' : 'bg-gray-500'}`} />
      )}
    </div>
  );
}

// ── Chat list sidebar ──────────────────────────────────────────────────────────
function ChatListPanel({ activeId, onSelect }) {
  const { user } = useAuthStore();
  const { onlineUsers } = useChatStore();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: () => api.get('/chats').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', search],
    queryFn: () => api.get(`/users?search=${search}`).then(r => r.data),
    enabled: showNew && search.length > 0,
  });

  const qc = useQueryClient();
  const startChat = useMutation({
    mutationFn: (userId) => api.post('/chats', { userId }).then(r => r.data),
    onSuccess: (chat) => {
      qc.invalidateQueries(['chats']);
      onSelect(chat);
      setShowNew(false);
      setSearch('');
    },
  });

  const getOtherUser = (chat) =>
    chat.members?.find(m => m._id !== user?._id);

  const filteredChats = chats.filter(c => {
    const name = c.isGroup ? c.name : getOtherUser(c)?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="w-72 flex-shrink-0 flex flex-col border-r border-dark-border h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white text-lg">Messages</h2>
          <button onClick={() => setShowNew(!showNew)}
            className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center text-lg transition-colors">
            {showNew ? '×' : '+'}
          </button>
        </div>
        <input className="input text-sm" placeholder={showNew ? 'Search users...' : 'Search chats...'}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* New chat - user search */}
        {showNew && (
          <div className="border-b border-dark-border">
            <p className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
              {search ? 'Search results' : 'Type to search users'}
            </p>
            {users.map(u => (
              <button key={u._id} onClick={() => startChat.mutate(u._id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-card transition-colors">
                <Avatar user={u} size={9} showStatus onlineUsers={onlineUsers} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <p className="text-gray-500 text-xs">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Chat list */}
        {filteredChats.map(chat => {
          const other = !chat.isGroup && getOtherUser(chat);
          const name = chat.isGroup ? chat.name : other?.name;
          const isActive = chat._id === activeId;
          const lastMsg = chat.lastMessage;

          return (
            <button key={chat._id} onClick={() => onSelect(chat)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
                ${isActive ? 'bg-primary/10 border-r-2 border-primary' : 'hover:bg-dark-card'}`}>
              <Avatar user={other || { name }} size={10} showStatus={!chat.isGroup} onlineUsers={onlineUsers} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="text-white text-sm font-medium truncate">{name}</p>
                  {lastMsg && (
                    <span className="text-gray-500 text-xs flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                  {lastMsg?.deleted ? 'Message deleted' : lastMsg?.content || 'Start a conversation'}
                </p>
              </div>
            </button>
          );
        })}

        {filteredChats.length === 0 && !showNew && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
            <span className="text-3xl mb-2">💬</span>
            No chats yet. Start one!
          </div>
        )}
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1">
          {msg.sender?.name?.[0]?.toUpperCase()}
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md relative`}>
        {msg.replyTo && !msg.replyTo.deleted && (
          <div className={`text-xs px-3 py-1.5 rounded-t-lg mb-0.5 border-l-2 border-primary
            ${isOwn ? 'bg-primary/20 text-gray-300' : 'bg-dark-border text-gray-400'}`}>
            <p className="font-medium text-primary-light">{msg.replyTo.sender?.name}</p>
            <p className="truncate">{msg.replyTo.content}</p>
          </div>
        )}
        <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed
          ${isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-dark-card text-gray-100 rounded-bl-sm'
          } ${msg.deleted ? 'opacity-50 italic' : ''}`}>
          {msg.content}
        </div>
        <p className={`text-xs text-gray-600 mt-1 ${isOwn ? 'text-right' : ''}`}>
          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
        </p>
        {isOwn && !msg.deleted && (
          <div className="absolute top-0 right-full mr-2 hidden group-hover:flex items-center gap-1">
            <button onClick={() => onDelete(msg._id)}
              className="w-6 h-6 rounded-full bg-dark-card border border-dark-border text-danger text-xs hover:bg-danger/10 flex items-center justify-center">
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chat window ────────────────────────────────────────────────────────────────
function ChatWindow({ chat }) {
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, deleteMessage, typingUsers } = useChatStore();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const qc = useQueryClient();
  const socket = getSocket();

  const chatMessages = messages[chat._id] || [];
  const otherUser = !chat.isGroup && chat.members?.find(m => m._id !== user?._id);
  const chatName = chat.isGroup ? chat.name : otherUser?.name;
  const typing = typingUsers[chat._id] || new Set();

  // Load messages
  const { isLoading } = useQuery({
    queryKey: ['messages', chat._id],
    queryFn: () => api.get(`/messages/${chat._id}`).then(r => r.data),
    onSuccess: (data) => setMessages(chat._id, data),
    enabled: !!chat._id,
  });

  // Join socket room
  useEffect(() => {
    socket?.emit('chat:join', chat._id);
    return () => socket?.emit('chat:leave', chat._id);
  }, [chat._id]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const sendMsg = useMutation({
    mutationFn: (payload) => api.post('/messages', payload).then(r => r.data),
    onSuccess: (msg) => {
      addMessage(chat._id, msg);
      setText('');
      setReplyTo(null);
      socket?.emit('typing:stop', { chatId: chat._id });
    },
    onError: () => toast.error('Failed to send message'),
  });

  const delMsg = useMutation({
    mutationFn: (id) => api.delete(`/messages/${id}`),
    onSuccess: (_, id) => deleteMessage(chat._id, id),
  });

  const handleTyping = () => {
    socket?.emit('typing:start', { chatId: chat._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit('typing:stop', { chatId: chat._id });
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMsg.mutate({ chatId: chat._id, content: text.trim(), replyTo: replyTo?._id });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-dark-border flex items-center gap-3 bg-dark-card">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
          {chatName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{chatName}</p>
          <p className="text-xs text-gray-500">
            {chat.isGroup
              ? `${chat.members?.length} members`
              : otherUser?.isOnline ? '🟢 Online' : `Last seen ${formatDistanceToNow(new Date(otherUser?.lastSeen || Date.now()), { addSuffix: true })}`
            }
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {isLoading
          ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
          : chatMessages.map(msg => (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isOwn={msg.sender?._id === user?._id || msg.sender === user?._id}
                onDelete={(id) => delMsg.mutate(id)}
              />
            ))
        }
        {typing.size > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 px-4 py-2 bg-dark-card rounded-2xl rounded-bl-sm">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="mx-6 px-4 py-2 bg-primary/10 border-l-2 border-primary rounded-lg flex justify-between items-center">
          <div>
            <p className="text-xs text-primary font-medium">{replyTo.sender?.name}</p>
            <p className="text-xs text-gray-400 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white ml-4">×</button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-dark-border">
        <div className="flex items-center gap-3">
          <input
            className="input flex-1"
            placeholder="Type a message..."
            value={text}
            onChange={e => { setText(e.target.value); handleTyping(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }}}
          />
          <button type="submit" disabled={!text.trim() || sendMsg.isPending}
            className="btn-primary px-5 py-2.5 flex-shrink-0">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main ChatPage ──────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState(null);

  const handleSelect = (chat) => {
    setActiveChat(chat);
    navigate(`/chat/${chat._id}`, { replace: true });
  };

  return (
    <div className="flex h-full">
      <ChatListPanel activeId={activeChat?._id || id} onSelect={handleSelect} />
      <div className="flex-1 flex">
        {activeChat
          ? <ChatWindow chat={activeChat} />
          : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <span className="text-6xl mb-4">💬</span>
              <p className="text-xl font-medium text-white">Select a conversation</p>
              <p className="text-sm mt-2">Choose a chat from the left or start a new one</p>
            </div>
          )
        }
      </div>
    </div>
  );
}
