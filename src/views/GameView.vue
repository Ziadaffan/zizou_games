<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useAuthStore } from '../stores/auth'
import TicTacToeBoard from '../components/TicTacToeBoard.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()

const gameId = route.params.id as string
const error = ref<string | null>(null)
const loading = ref(true)
const retrying = ref(false)
let retryInterval: number | null = null

// Initialize game: load state and connect WS
const initializeGame = async () => {
  try {
    loading.value = true
    error.value = null

    await gameStore.loadGame(gameId, authStore.userId || undefined)
    await (gameStore as any).connectWebSocket()

    if (gameStore.mySymbol === 'X') {
      (gameStore as any).createRoom(gameId)
    } else if (gameStore.mySymbol === 'O') {
      (gameStore as any).joinRoom(gameId)
    } else {
      if (gameStore.playerXId === gameStore.myPlayerId) {
        gameStore.mySymbol = 'X'
        (gameStore as any).createRoom(gameId)
      } else if (gameStore.playerOId === gameStore.myPlayerId) {
        gameStore.mySymbol = 'O'
        (gameStore as any).joinRoom(gameId)
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to initialize game'
    console.error('Error initializing game:', err)
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  gameStore.reset()
  router.push('/')
}

// Automatic retry every 3 seconds if disconnected or not enough players
const startRetrying = () => {
  if (retryInterval) return
  retrying.value = true

  retryInterval = window.setInterval(async () => {
    if (!(gameStore as any).isConnected) {
      try {
        await (gameStore as any).connectWebSocket()
      } catch (err) {
        console.warn('Retry failed:', err)
      }
    }

    if ((gameStore as any).isConnected) {
      if (gameId) {
        if (gameStore.mySymbol === 'X') {
          (gameStore as any).createRoom(gameId)
        } else if (gameStore.mySymbol === 'O') {
          (gameStore as any).joinRoom(gameId)
        }
      }
      if ((gameStore as any).playersInRoom >= 2) {
        stopRetrying()
      }
    }
  }, 3000)
}

const stopRetrying = () => {
  if (retryInterval) {
    clearInterval(retryInterval)
    retryInterval = null
    retrying.value = false
  }
}

// Manual retry triggered by button
const retryConnection = async () => {
  error.value = null
  retrying.value = true
  try {
    if ((gameStore as any).ws) (gameStore as any).ws.disconnect()
    await (gameStore as any).connectWebSocket()
    if (gameId) {
      if (gameStore.mySymbol === 'X') {
        (gameStore as any).createRoom(gameId)
      } else if (gameStore.mySymbol === 'O') {
        (gameStore as any).joinRoom(gameId)
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to retry connection'
    console.error('Retry error:', err)
  } finally {
    retrying.value = false
  }
}

onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
  if ((gameStore as any).ws) (gameStore as any).ws.disconnect()
  stopRetrying()
})

// Watch connection and players in room
watch(
  () => [(gameStore as any).isConnected, (gameStore as any).playersInRoom] as [boolean, number],
  ([connected, players]) => {
    if (!connected || players < 2) {
      startRetrying()
    } else {
      stopRetrying()
    }
  }
)
</script>

<template>
  <div class="game-view">
    <div class="game-header">
      <button @click="handleBack" class="back-button">← Back to Home</button>
      <div class="game-id">Game ID: {{ gameId }}</div>
    </div>

    <div v-if="loading" class="loading">Loading game...</div>

    <div v-else>
      <div class="connection-status" :class="{ connected: (gameStore as any).isConnected }">
        {{ (gameStore as any).isConnected ? '● Connected' : '○ Disconnected' }}
        <span v-if="(gameStore as any).isConnected">
          ((gameStore as any).playersInRoom) player{{ (gameStore as any).playersInRoom !== 1 ? 's' : '' }} in room
        </span>
        <span v-if="retrying && (gameStore as any).playersInRoom < 2" class="retrying-text">
          Retrying connection...
        </span>
      </div>

      <div class="retry-container">
        <button
          @click="retryConnection"
          class="retry-button"
          :disabled="retrying"
        >
          {{ retrying ? 'Retrying...' : 'Retry Connection' }}
        </button>
      </div>

      <div v-if="(gameStore as any).playersInRoom < 2" class="waiting">
        Waiting for players...
      </div>

      <div v-else>
        <p class="player-symbol">You are: {{ gameStore.mySymbol }}</p>
        <TicTacToeBoard />
      </div>

      <div v-if="gameStore.winner || gameStore.gameStatus === 'finished'" class="game-over">
        <button @click="handleBack" class="new-game-button">New Game</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.back-button {
  padding: 0.5rem 1rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text);
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--color-border);
}

.game-id {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--color-text-2);
  background-color: var(--color-background-soft);
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.loading,
.waiting {
  text-align: center;
  padding: 2rem;
}

.connection-status {
  font-size: 0.9rem;
  color: #e74c3c;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.connection-status.connected {
  color: #27ae60;
}

.retrying-text {
  margin-left: 0.5rem;
  font-style: italic;
  color: #f39c12;
}

.retry-container {
  text-align: center;
  margin: 1rem 0;
}

.retry-button {
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.retry-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.player-symbol {
  font-weight: bold;
}

.game-over {
  margin-top: 1rem;
}

.new-game-button {
  padding: 0.75rem 2rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}

.new-game-button:hover {
  background-color: #2980b9;
}
</style>
