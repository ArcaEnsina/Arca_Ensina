import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('auth/user/')
      setUser(data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (username, password) => {
    const { data } = await api.post('auth/login/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    // Fetch user profile after login
    try {
      const { data: userData } = await api.get('auth/user/')
      setUser(userData)
    } catch {
      // If user endpoint not available, set minimal user
      setUser({ username })
    }
    return data
  }

  const register = async (username, email, password, profile) => {
    const { data } = await api.post('auth/register/', {
      username,
      email,
      password,
      profile,
    })
    // Auto-login after registration
    if (data.access && data.refresh) {
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      try {
        const { data: userData } = await api.get('auth/user/')
        setUser(userData)
      } catch {
        setUser({ username, email, profile })
      }
    }
    return data
  }

  const logout = async () => {
    try {
      await api.post('auth/logout/', { refresh: localStorage.getItem('refresh_token') })
    } catch {
      // Ignore errors — always clear local state
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
