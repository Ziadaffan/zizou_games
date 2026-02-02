<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { validators } from '../utils/validation'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formData = ref({
  username: '',
  password: '',
})

const errors = ref<Record<string, string>>({})
const showPassword = ref(false)
const isSubmitting = ref(false)

const canSubmit = computed(() => {
  return formData.value.username.trim() !== '' && formData.value.password.trim() !== ''
})

const validateForm = (): boolean => {
  errors.value = {}

  const usernameResult = validators.username(formData.value.username)
  if (!usernameResult.valid) {
    errors.value.username = usernameResult.message || ''
  }

  const passwordResult = validators.required(formData.value.password, 'Password')
  if (!passwordResult.valid) {
    errors.value.password = passwordResult.message || ''
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  authStore.clearError()

  try {
    await authStore.login({
      username: formData.value.username.trim(),
      password: formData.value.password,
    })
    // Redirect to the original destination or home
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error) {
    // Error is handled by the store
  } finally {
    isSubmitting.value = false
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>🎮 TicTacToe</h1>
        <h2>Welcome Back</h2>
        <p>Sign in to continue playing</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="authStore.error" class="error-banner">
          {{ authStore.error }}
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="Enter your username"
            :class="{ 'error': errors.username }"
            :disabled="isSubmitting"
            autocomplete="username"
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              :class="{ 'error': errors.password }"
              :disabled="isSubmitting"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility"
              :disabled="isSubmitting"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <button
          type="submit"
          class="submit-button"
          :disabled="!canSubmit || isSubmitting"
        >
          <span v-if="isSubmitting">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Don't have an account?
          <router-link to="/signup" class="link">Sign up</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-background);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}

.auth-header h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}

.auth-header p {
  color: var(--color-text-2);
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.error-banner {
  padding: 0.75rem;
  background-color: #fee;
  border: 1px solid #e74c3c;
  border-radius: 8px;
  color: #e74c3c;
  font-size: 0.9rem;
  text-align: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background-color: var(--color-background);
  color: var(--color-text);
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input.error {
  border-color: #e74c3c;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.password-input-wrapper {
  position: relative;
}

.password-input-wrapper input {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  color: var(--color-text-2);
  transition: color 0.2s;
}

.password-toggle:hover:not(:disabled) {
  color: var(--color-text);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
}

.submit-button {
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
  margin-top: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  color: var(--color-text-2);
  font-size: 0.9rem;
}

.auth-footer .link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.auth-footer .link:hover {
  color: #764ba2;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 2rem 1.5rem;
  }

  .auth-header h1 {
    font-size: 2rem;
  }

  .auth-header h2 {
    font-size: 1.5rem;
  }
}
</style>
