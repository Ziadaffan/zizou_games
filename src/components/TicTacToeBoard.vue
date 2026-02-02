<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()

const handleCellClick = async (row: number, col: number) => {
  if (!gameStore.canMakeMove || gameStore.board[row][col] !== null) {
    return
  }

  try {
    await gameStore.makeMove(row, col)
  } catch (error: any) {
    alert(error.message || 'Failed to make move')
  }
}

const getCellClass = (row: number, col: number) => {
  const cell = gameStore.board[row][col]
  const classes = ['cell']
  
  if (cell === null && gameStore.canMakeMove) {
    classes.push('cell-clickable')
  }
  
  if (cell === 'X') {
    classes.push('cell-x')
  } else if (cell === 'O') {
    classes.push('cell-o')
  }
  
  return classes.join(' ')
}

const gameStatusMessage = computed(() => {
  if (gameStore.winner === 'X') return 'Player X Wins!'
  if (gameStore.winner === 'O') return 'Player O Wins!'
  if (gameStore.winner === 'DRAW') return "It's a Draw!"
  if (gameStore.gameStatus === 'waiting') return 'Waiting for players...'
  if (gameStore.gameStatus === 'ongoing') {
    return gameStore.isMyTurn ? 'Your turn!' : "Opponent's turn"
  }
  return 'Game finished'
})
</script>

<template>
  <div class="tic-tac-toe-container">
    <div class="game-status">{{ gameStatusMessage }}</div>
    <div class="board">
      <div
        v-for="(row, rowIndex) in gameStore.board"
        :key="rowIndex"
        class="row"
      >
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          :class="getCellClass(rowIndex, colIndex)"
          @click="handleCellClick(rowIndex, colIndex)"
        >
          {{ cell || '' }}
        </div>
      </div>
    </div>
    <div class="player-info">
      <div>You are: <strong>{{ gameStore.mySymbol || 'Not assigned' }}</strong></div>
      <div v-if="gameStore.gameStatus === 'ongoing'">
        Current turn: <strong>{{ gameStore.currentPlayer }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tic-tac-toe-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
}

.game-status {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-text);
  text-align: center;
  min-height: 2rem;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: #333;
  padding: 4px;
  border-radius: 8px;
}

.row {
  display: flex;
  gap: 4px;
}

.cell {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 4px;
  font-size: 3rem;
  font-weight: bold;
  transition: all 0.2s;
  user-select: none;
}

.cell-clickable {
  cursor: pointer;
}

.cell-clickable:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.cell-x {
  color: #e74c3c;
}

.cell-o {
  color: #3498db;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
  font-size: 1rem;
  color: var(--color-text);
}

@media (max-width: 768px) {
  .cell {
    width: 80px;
    height: 80px;
    font-size: 2.5rem;
  }
  
  .game-status {
    font-size: 1.2rem;
  }
}
</style>
