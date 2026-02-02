export type WebSocketMessage =
  | { type: 'create_room'; room_id: string }
  | { type: 'join_room'; room_id: string }
  | { type: 'room_created'; room_id: string; players: number }
  | { type: 'room_joined'; room_id: string; players: number }
  | { type: 'player_joined'; room_id: string; players: number }
  | { type: 'game_started'; game_id: string; status: string }
  | {
    type: 'move_made'
    game_id: string
    player_id: string
    position: string
    symbol: 'X' | 'O'
    board: (('X' | 'O' | null)[])[]
    winner: 'X' | 'O' | 'DRAW' | null
    game_status: string
  }

export class GameWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: WebSocketMessage) => void>> = new Map()

  constructor(private url: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws') { }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.ws = null
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
        this.connect().catch(() => {
          // Reconnection will be attempted again
        })
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach((listener) => listener(message))
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  on(messageType: string, callback: (data: WebSocketMessage) => void) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set())
    }
    this.listeners.get(messageType)!.add(callback)
  }

  off(messageType: string, callback: (data: WebSocketMessage) => void) {
    const listeners = this.listeners.get(messageType)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}
