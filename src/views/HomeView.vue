<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()

const gameIdInput = ref('')
const mode = ref<'create' | 'join'>('create')
const loading = ref(false)
const error = ref<string | null>(null)

const playerId = computed(() => authStore.userId || '')

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.initialize()
  }
})

const handleCreateGame = async () => {
  if (!playerId.value) {
    error.value = 'You must be logged in to create a game'
    return
  }

  try {
    loading.value = true
    error.value = null

    const game = await gameStore.createGame(playerId.value)
    router.push(`/game/${game.id}`)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to create game'
    console.error('Error creating game:', err)
  } finally {
    loading.value = false
  }
}

const apiHealthCheck = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`)
    if (!response.ok) {
      throw new Error('API health check failed')
    }
  } catch (err: unknown) {
    console.error('Error checking API health:', err)
  }
}

onMounted(() => {
  apiHealthCheck()
})

const handleJoinGame = async () => {
  if (!playerId.value) {
    error.value = 'You must be logged in to join a game'
    return
  }

  if (!gameIdInput.value.trim()) {
    error.value = 'Please enter a game ID'
    return
  }

  try {
    loading.value = true
    error.value = null

    const game = await gameStore.joinGame(gameIdInput.value.trim(), playerId.value)
    router.push(`/game/${game.id}`)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to join game'
    console.error('Error joining game:', err)
  } finally {
    loading.value = false
  }
}

const switchMode = (newMode: 'create' | 'join') => {
  mode.value = newMode
  error.value = null
  gameIdInput.value = ''
}
</script>

<template>
  <div class="home-view">
    <div class="header-bar">
      <div class="user-info">
        <span>Welcome, <strong>{{ authStore.username }}</strong>!</span>
        <span v-if="authStore.user" class="elo">ELO: {{ authStore.user.elo_rating }}</span>
      </div>
      <button @click="authStore.logout" class="logout-button">Logout</button>
    </div>

    <div class="welcome-section">
      <h1>🎮 TicTacToe Online</h1>
      <p>Play TicTacToe with friends in real-time!</p>
    </div>

    <div class="game-options">
      <div class="mode-selector">
        <button
          :class="['mode-button', { active: mode === 'create' }]"
          @click="switchMode('create')"
        >
          Create Game
        </button>
        <button
          :class="['mode-button', { active: mode === 'join' }]"
          @click="switchMode('join')"
        >
          Join Game
        </button>
      </div>

      <div class="form-container">
        <div v-if="mode === 'join'" class="input-group">
          <label for="game-id">Game ID:</label>
          <input
            id="game-id"
            v-model="gameIdInput"
            type="text"
            placeholder="Enter game ID to join"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button
          v-if="mode === 'create'"
          @click="handleCreateGame"
          :disabled="loading || !playerId"
          class="action-button"
        >
          {{ loading ? 'Creating...' : 'Create Game' }}
        </button>

        <button
          v-else
          @click="handleJoinGame"
          :disabled="loading || !playerId || !gameIdInput.trim()"
          class="action-button"
        >
          {{ loading ? 'Joining...' : 'Join Game' }}
        </button>
      </div>
    </div>

    <div class="instructions">
      <h3>How to Play:</h3>
      <ol>
        <li v-if="mode === 'create'">
          Click "Create Game" to start a new game
          <br />
          <small>Share the Game ID with your opponent</small>
        </li>
        <li v-else>
          Enter the Game ID shared by the first player
          <br />
          <small>Click "Join Game" to join</small>
        </li>
        <li>Wait for both players to connect via WebSocket</li>
        <li>Start playing! X goes first</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-info .elo {
  font-size: 0.9rem;
  color: var(--color-text-2);
}

.logout-button {
  padding: 0.5rem 1rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: #c0392b;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}

.welcome-section p {
  font-size: 1.1rem;
  color: var(--color-text-2);
}

.game-options {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.mode-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.mode-button {
  flex: 1;
  padding: 0.75rem;
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text);
  transition: all 0.2s;
}

.mode-button:hover {
  background-color: var(--color-background-soft);
}

.mode-button.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 500;
  color: var(--color-text);
}

.input-group input {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--color-background);
  color: var(--color-text);
}

.input-group input:focus {
  outline: none;
  border-color: #3498db;
}

.input-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem;
  background-color: #fee;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  color: #e74c3c;
  font-size: 0.9rem;
}

.action-button {
  padding: 0.75rem 2rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.instructions {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
}

.instructions h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.instructions ol {
  margin: 0;
  padding-left: 1.5rem;
}

.instructions li {
  margin-bottom: 0.75rem;
  color: var(--color-text);
  line-height: 1.6;
}

.instructions small {
  color: var(--color-text-2);
  font-size: 0.9rem;
}
</style>
