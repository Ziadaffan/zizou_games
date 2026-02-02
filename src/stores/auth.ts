import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type User, type SignupRequest, type LoginRequest } from '../services/auth'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => {
    return token.value !== null && user.value !== null
  })

  const userId = computed(() => {
    return user.value?.id || null
  })

  const username = computed(() => {
    return user.value?.username || null
  })

  // Actions
  async function initialize() {
    const storedToken = authService.getToken()
    if (storedToken) {
      token.value = storedToken
      try {
        await fetchUser()
      } catch (err) {
        // Token might be expired, clear it
        logout()
      }
    }
  }

  async function signup(data: SignupRequest) {
    loading.value = true
    error.value = null
    try {
      await authService.signup(data)
      // After signup, automatically log in
      await login({
        username: data.username,
        password: data.password,
      })
    } catch (err: any) {
      error.value = err.message || 'Failed to sign up'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function login(data: LoginRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.login(data)
      token.value = response.access_token
      await fetchUser()
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to log in'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    try {
      const userData = await authService.getCurrentUser()
      user.value = userData
    } catch (err: any) {
      // If token is invalid, logout
      if (err.message.includes('Token expired') || err.message.includes('invalid')) {
        logout()
      }
      throw err
    }
  }

  function logout() {
    authService.logout()
    user.value = null
    token.value = null
    error.value = null
    router.push('/login')
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Computed
    isAuthenticated,
    userId,
    username,
    // Actions
    initialize,
    signup,
    login,
    logout,
    fetchUser,
    clearError,
  }
})
