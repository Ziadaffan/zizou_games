import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, type Game, type MoveResponse } from '../services/api'
import { GameWebSocket, type WebSocketMessage } from '../services/websocket'

export const useGameStore = defineStore('game', () => {
  // State
  const currentGame = ref<Game | null>(null)
  const board = ref<(('X' | 'O' | null)[])[][]>([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ])
  const currentPlayer = ref<'X' | 'O' | null>(null)
  const winner = ref<'X' | 'O' | 'DRAW' | null>(null)
  const gameStatus = ref<'waiting' | 'ongoing' | 'finished'>('waiting')
  const playerXId = ref<string>('')
  const playerOId = ref<string>('')
  const myPlayerId = ref<string>('')
  const mySymbol = ref<'X' | 'O' | null>(null)
  const ws = ref<GameWebSocket | null>(null)
  const isConnected = ref(false)
  const playersInRoom = ref(0)

  // Computed
  const isMyTurn = computed(() => {
    if (!currentPlayer.value || !mySymbol.value) return false
    return currentPlayer.value === mySymbol.value
  })

  const canMakeMove = computed(() => {
    return gameStatus.value === 'ongoing' && isMyTurn.value && !winner.value
  })

  // Actions
  async function createGame(playerId: string) {
    try {
      const game = await api.createGame(playerId)
      currentGame.value = game
      playerXId.value = game.player_x_id || ''
      myPlayerId.value = playerId
      mySymbol.value = 'X'
      gameStatus.value = game.status
      return game
    } catch (error) {
      console.error('Error creating game:', error)
      throw error
    }
  }

  async function joinGame(gameId: string, playerId: string) {
    try {
      const game = await api.joinGame(gameId, playerId)
      currentGame.value = game
      playerXId.value = game.player_x_id || ''
      playerOId.value = game.player_o_id || ''
      myPlayerId.value = playerId
      mySymbol.value = 'O'
      gameStatus.value = game.status
      return game
    } catch (error) {
      console.error('Error joining game:', error)
      throw error
    }
  }

  async function loadGame(gameId: string, userId?: string) {
    try {
      const game = await api.getGame(gameId)
      currentGame.value = game
      playerXId.value = game.player_x_id || ''
      playerOId.value = game.player_o_id || ''
      gameStatus.value = game.status

      // Set myPlayerId if provided
      if (userId) {
        myPlayerId.value = userId
        // Determine symbol based on player IDs
        if (game.player_x_id === userId) {
          mySymbol.value = 'X'
        } else if (game.player_o_id === userId) {
          mySymbol.value = 'O'
        }
      }

      const boardData = await api.getBoard(gameId)
      board.value = boardData.board
      winner.value = boardData.winner

      return game
    } catch (error) {
      console.error('Error loading game:', error)
      throw error
    }
  }

  function connectWebSocket() {
    if (ws.value) {
      ws.value.disconnect()
    }

    ws.value = new GameWebSocket()
    isConnected.value = false

    ws.value.on('room_created', (message: WebSocketMessage) => {
      if (message.type === 'room_created') {
        playersInRoom.value = message.players
        isConnected.value = true
      }
    })

    ws.value.on('room_joined', (message: WebSocketMessage) => {
      if (message.type === 'room_joined') {
        playersInRoom.value = message.players
        isConnected.value = true
      }
    })

    ws.value.on('player_joined', (message: WebSocketMessage) => {
      if (message.type === 'player_joined') {
        playersInRoom.value = message.players
      }
    })

    ws.value.on('game_started', (message: WebSocketMessage) => {
      if (message.type === 'game_started') {
        gameStatus.value = 'ongoing'
        currentPlayer.value = 'X'
      }
    })

    ws.value.on('move_made', (message: WebSocketMessage) => {
      if (message.type === 'move_made') {
        board.value = message.board
        winner.value = message.winner
        gameStatus.value = message.game_status as 'waiting' | 'ongoing' | 'finished'
        currentPlayer.value = message.symbol === 'X' ? 'O' : 'X'
      }
    })

    return ws.value.connect()
  }

  function createRoom(gameId: string) {
    if (ws.value && ws.value.isConnected()) {
      ws.value.send({ type: 'create_room', room_id: gameId })
    }
  }

  function joinRoom(gameId: string) {
    if (ws.value && ws.value.isConnected()) {
      ws.value.send({ type: 'join_room', room_id: gameId })
    }
  }

  async function makeMove(row: number, col: number) {
    if (!currentGame.value || !myPlayerId.value) {
      throw new Error('No active game or player ID')
    }

    if (!canMakeMove.value) {
      throw new Error('It is not your turn')
    }

    const position = `${row},${col}`
    try {
      const response: MoveResponse = await api.makeMove(
        currentGame.value.id,
        myPlayerId.value,
        position
      )
      board.value = response.board
      winner.value = response.winner
      gameStatus.value = response.game_status
      currentPlayer.value = response.next_turn
      return response
    } catch (error) {
      console.error('Error making move:', error)
      throw error
    }
  }

  function reset() {
    currentGame.value = null
    board.value = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]
    currentPlayer.value = null
    winner.value = null
    gameStatus.value = 'waiting'
    playerXId.value = ''
    playerOId.value = ''
    myPlayerId.value = ''
    mySymbol.value = null
    playersInRoom.value = 0
    if (ws.value) {
      ws.value.disconnect()
      ws.value = null
    }
    isConnected.value = false
  }

  return {
    // State
    currentGame,
    board,
    currentPlayer,
    winner,
    gameStatus,
    playerXId,
    playerOId,
    myPlayerId,
    mySymbol,
    isConnected,
    playersInRoom,
    // Computed
    isMyTurn,
    canMakeMove,
    // Actions
    createGame,
    joinGame,
    loadGame,
    connectWebSocket,
    createRoom,
    joinRoom,
    makeMove,
    reset,
  }
})
