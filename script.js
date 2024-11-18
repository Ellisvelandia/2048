const gridContainer = document.querySelector('.grid-container');
const restartButton = document.getElementById('restart');
const undoButton = document.getElementById('undo');
const scoreDisplay = document.getElementById('score');
const bestScoreDisplay = document.getElementById('best-score');
const gameMessage = document.querySelector('.game-message');
const retryButton = document.getElementById('retry-button');

let board = [];
let score = 0;
let bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
let previousStates = [];
let touchStartX = 0;
let touchStartY = 0;

function saveState() {
    previousStates.push({
        board: JSON.parse(JSON.stringify(board)),
        score: score
    });
    // Keep only last 10 states
    if (previousStates.length > 10) {
        previousStates.shift();
    }
}

function undo() {
    if (previousStates.length > 0) {
        const previousState = previousStates.pop();
        board = previousState.board;
        score = previousState.score;
        scoreDisplay.textContent = score;
        updateBoard();
    }
}

function updateBestScore() {
    if (score > bestScore) {
        bestScore = score;
        bestScoreDisplay.textContent = bestScore;
        localStorage.setItem('bestScore', bestScore);
    }
}

function init() {
    board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    score = 0;
    scoreDisplay.textContent = '0';
    bestScoreDisplay.textContent = bestScore;
    previousStates = [];
    gameMessage.classList.remove('game-over');
    generateTile();
    generateTile();
    updateBoard();
}

function isGameOver() {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) return false;
        }
    }
    
    // Check for possible merges
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (j < 3 && board[i][j] === board[i][j + 1]) return false;
            if (i < 3 && board[i][j] === board[i + 1][j]) return false;
        }
    }
    
    return true;
}

function checkGameOver() {
    if (isGameOver()) {
        gameMessage.classList.add('game-over');
        gameMessage.querySelector('p').textContent = 'Game Over!';
    }
}

function generateTile() {
    let emptyTiles = [];
    board.forEach((row, rIndex) => {
        row.forEach((tile, cIndex) => {
            if (tile === 0) emptyTiles.push({rIndex, cIndex});
        });
    });
    if (emptyTiles.length > 0) {
        const {rIndex, cIndex} = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[rIndex][cIndex] = Math.random() < 0.9 ? 2 : 4;
    }
}

function updateBoard() {
    gridContainer.innerHTML = '';
    board.forEach((row, i) => {
        row.forEach((tile, j) => {
            const tileElement = document.createElement('div');
            tileElement.classList.add('tile');
            if (tile) {
                tileElement.classList.add(`tile-${tile}`);
                tileElement.innerText = tile;
            }
            tileElement.style.setProperty('--x', j);
            tileElement.style.setProperty('--y', i);
            gridContainer.appendChild(tileElement);
        });
    });
}

function move(direction) {
    saveState();
    let moved = false;
    const size = board.length;
    
    const oldBoard = JSON.parse(JSON.stringify(board));

    for (let i = 0; i < direction; i++) {
        board = rotateBoard(board);
    }

    for (let i = 0; i < size; i++) {
        let row = board[i];
        let newRow = row.filter(cell => cell !== 0);
        
        for (let j = 0; j < newRow.length - 1; j++) {
            if (newRow[j] === newRow[j + 1]) {
                newRow[j] *= 2;
                score += newRow[j];
                scoreDisplay.textContent = score;
                updateBestScore();
                newRow.splice(j + 1, 1);
            }
        }
        
        while (newRow.length < size) {
            newRow.push(0);
        }
        
        board[i] = newRow;
    }

    for (let i = 0; i < (4 - direction) % 4; i++) {
        board = rotateBoard(board);
    }

    moved = JSON.stringify(oldBoard) !== JSON.stringify(board);

    if (moved) {
        generateTile();
        updateBoard();
        checkGameOver();
    } else {
        previousStates.pop(); // Remove saved state if no move was made
    }

    return moved;
}

function rotateBoard(board) {
    const size = board.length;
    const newBoard = Array(size).fill().map(() => Array(size).fill(0));
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            newBoard[j][size - 1 - i] = board[i][j];
        }
    }
    
    return newBoard;
}

// Touch controls
function handleTouchStart(evt) {
    touchStartX = evt.touches[0].clientX;
    touchStartY = evt.touches[0].clientY;
}

function handleTouchMove(evt) {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = evt.touches[0].clientX;
    const touchEndY = evt.touches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            move(2); // Right
        } else {
            move(0); // Left
        }
    } else {
        if (deltaY > 0) {
            move(3); // Down
        } else {
            move(1); // Up
        }
    }

    touchStartX = null;
    touchStartY = null;
}

// Event Listeners
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowLeft':
            move(0);
            break;
        case 'ArrowUp':
            move(1);
            break;
        case 'ArrowRight':
            move(2);
            break;
        case 'ArrowDown':
            move(3);
            break;
    }
});

// Mobile control buttons
document.getElementById('up-button')?.addEventListener('click', () => move(1));
document.getElementById('down-button')?.addEventListener('click', () => move(3));
document.getElementById('left-button')?.addEventListener('click', () => move(0));
document.getElementById('right-button')?.addEventListener('click', () => move(2));

// Touch events
document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);

restartButton.addEventListener('click', init);
undoButton.addEventListener('click', undo);
retryButton.addEventListener('click', init);

init();
