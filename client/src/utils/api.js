import axios from 'axios'
const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 10000 })
api.interceptors.request.use((config) => {
  try {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}')
    if (auth?.state?.token) config.headers.Authorization = 'Bearer ' + auth.state.token
  } catch {}
  return config
})
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth')
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
export default api
