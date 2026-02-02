import { authService } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  const token = authService.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export interface Game {
  id: string
  player_x_id: string | null
  player_o_id: string | null
  status: 'waiting' | 'ongoing' | 'finished'
  created_at: string
}

export interface MoveResponse {
  message: string
  move_id: string
  position: string
  symbol: 'X' | 'O'
  board: (('X' | 'O' | null)[])[]
  winner: 'X' | 'O' | 'DRAW' | null
  game_status: 'waiting' | 'ongoing' | 'finished'
  next_turn: 'X' | 'O' | null
}

export const api = {
  async createGame(playerXId: string): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ player_x_id: playerXId }),
    })
    if (!response.ok) {
      throw new Error('Failed to create game')
    }
    return response.json()
  },

  async joinGame(gameId: string, playerOId: string): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ player_o_id: playerOId }),
    })
    if (!response.ok) {
      throw new Error('Failed to join game')
    }
    return response.json()
  },

  async getGame(gameId: string): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get game')
    }
    return response.json()
  },

  async getBoard(gameId: string): Promise<{ board: (('X' | 'O' | null)[])[], winner: 'X' | 'O' | 'DRAW' | null }> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/board`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get board')
    }
    return response.json()
  },

  async makeMove(gameId: string, playerId: string, position: string): Promise<MoveResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/move`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ player_id: playerId, position }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to make move' }))
      throw new Error(error.detail || 'Failed to make move')
    }
    return response.json()
  },
}
