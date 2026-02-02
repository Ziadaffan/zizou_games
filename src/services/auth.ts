const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export interface SignupRequest {
  username: string
  email: string
  password: string
}

export interface SignupResponse {
  id: string
  username: string
  email: string
  elo_rating: number
  avatar_url: string | null
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user_id: string
  username: string
}

export interface User {
  id: string
  username: string
  email: string
  elo_rating: number
  avatar_url: string | null
  created_at: string
}

const TOKEN_KEY = 'auth_token'

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to sign up' }))
      throw new Error(error.detail || 'Failed to sign up')
    }

    return response.json()
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Invalid credentials' }))
      throw new Error(error.detail || 'Invalid credentials')
    }

    const result = await response.json()
    this.setToken(result.access_token)
    return result
  },

  async getCurrentUser(): Promise<User> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No token available')
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken()
        throw new Error('Token expired or invalid')
      }
      const error = await response.json().catch(() => ({ detail: 'Failed to get user' }))
      throw new Error(error.detail || 'Failed to get user')
    }

    return response.json()
  },

  logout(): void {
    this.removeToken()
  },

  isAuthenticated(): boolean {
    return this.getToken() !== null
  },
}
