// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const background = document.getElementById('background');
const splashScreen = document.getElementById('splash');
const startButton = document.getElementById('startButton');

// Mobile controls
const upBtn = document.querySelector('.up-btn');
const leftBtn = document.querySelector('.left-btn');
const downBtn = document.querySelector('.down-btn');
const rightBtn = document.querySelector('.right-btn');

// Set canvas size based on container
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

const gridSize = 20;
let tileCountX, tileCountY;

let snake = [
    {x: 10, y: 10}
];
let velocityX = 0;
let velocityY = 0;
let foodX = 5;
let foodY = 5;
let foodType = 'normal'; // 'normal' or 'poison'
let score = 0;
let level = 1;
let lives = 3;
let gameSpeed = 150;
let gameLoop;
let gameOver = false;
let foodActive = true;
let foodTimer;
let snakeAngle = 0;

// Colors (adjusted for better visibility on background)
const colors = {
    snakeBody: '#3a5f0b',
    snakeBelly: '#6b8c21',
    snakePattern: '#1f3a08',
    snakeHead: '#4a752c',
    snakeEye: '#000000',
    snakeTongue: '#ff0000',
    food: '#ff9900',
    poison: '#ff0000',
    background: 'rgba(0, 0, 0, 0.5)'
};

// Initialize game
function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    tileCountX = Math.floor(canvas.width / gridSize);
    tileCountY = Math.floor(canvas.height / gridSize);
    
    // Center snake on start
    snake = [
        {x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2)}
    ];
    
    // Mobile control event listeners
    const addControlListeners = (element, direction) => {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMobileInput(direction);
        });
        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleMobileInput(direction);
        });
    };
    
    addControlListeners(upBtn, 'up');
    addControlListeners(leftBtn, 'left');
    addControlListeners(downBtn, 'down');
    addControlListeners(rightBtn, 'right');
    
    // Prevent touch scroll
    document.addEventListener('touchmove', (e) => {
        if (e.target.classList.contains('mobile-btn')) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Start game function
function startGame() {
    splashScreen.style.display = 'none';
    initGame();
    resetGame();
}

// Add event listener to start button
startButton.addEventListener('click', startGame);

// Also allow starting with spacebar
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && splashScreen.style.display !== 'none') {
        startGame();
    }
});

// Handle mobile input
function handleMobileInput(direction) {
    if (gameOver) return;
    
    switch(direction) {
        case 'up':
            if (velocityY !== 1) {
                velocityX = 0;
                velocityY = -1;
            }
            break;
        case 'down':
            if (velocityY !== -1) {
                velocityX = 0;
                velocityY = 1;
            }
            break;
        case 'left':
            if (velocityX !== 1) {
                velocityX = -1;
                velocityY = 0;
            }
            break;
        case 'right':
            if (velocityX !== -1) {
                velocityX = 1;
                velocityY = 0;
            }
            break;
    }
}

// Draw 3D snake segment
function drawSnakeSegment(x, y, isHead, angle) {
    const centerX = x * gridSize + gridSize/2;
    const centerY = y * gridSize + gridSize/2;
    
    // Save context
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    
    // Create 3D effect with gradient and shadow
    const bodyGradient = ctx.createLinearGradient(-gridSize/2, -gridSize/3, gridSize/2, gridSize/3);
    bodyGradient.addColorStop(0, '#2a4d0a');  // Darker shade for depth
    bodyGradient.addColorStop(0.5, colors.snakeBelly);
    bodyGradient.addColorStop(1, '#3a5f0b');  // Darker shade
    
    // Draw main body with 3D effect
    ctx.beginPath();
    ctx.ellipse(0, 0, gridSize/2 - 2, gridSize/3, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGradient;
    ctx.fill();
    
    // Add 3D shading
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 2, gridSize/2 - 3, gridSize/3 - 1, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    
    // Add highlight for 3D effect
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -2, gridSize/2 - 3, gridSize/3 - 1, 0, 0, Math.PI);
    ctx.stroke();
    
    // Draw pattern (diamond shapes along the back)
    if (!isHead) {
        ctx.fillStyle = colors.snakePattern;
        for (let i = -1; i <= 1; i += 0.5) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize/2, -gridSize/4);
            ctx.lineTo((i + 0.25) * gridSize/2, -gridSize/3);
            ctx.lineTo((i + 0.5) * gridSize/2, -gridSize/4);
            ctx.lineTo((i + 0.25) * gridSize/2, -gridSize/6);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Draw head features if it's the head
    if (isHead) {
        // Draw head with 3D effect
        const headGradient = ctx.createLinearGradient(-gridSize/2, 0, gridSize/2, 0);
        headGradient.addColorStop(0, '#3a5f0b');
        headGradient.addColorStop(0.5, '#5a7f2b');
        headGradient.addColorStop(1, '#3a5f0b');
        
        // Head shape (slightly larger)
        ctx.beginPath();
        ctx.ellipse(0, 0, gridSize/2 - 1, gridSize/2.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = headGradient;
        ctx.fill();
        
        // Head shading
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 2, gridSize/2 - 2, gridSize/2.5 - 1, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
        
        // Head highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -2, gridSize/2 - 2, gridSize/2.5 - 1, 0, 0, Math.PI);
        ctx.stroke();
        
        // Draw eyes with 3D effect
        ctx.fillStyle = '#6b8c21';
        ctx.beginPath();
        ctx.arc(-gridSize/4, -gridSize/6, gridSize/6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(gridSize/4, -gridSize/6, gridSize/6, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye shading
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(-gridSize/4, -gridSize/6 + 2, gridSize/6 - 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(gridSize/4, -gridSize/6 + 2, gridSize/6 - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils with depth
        ctx.fillStyle = colors.snakeEye;
        ctx.beginPath();
        ctx.arc(-gridSize/4 + 1, -gridSize/6 + 1, gridSize/12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(gridSize/4 + 1, -gridSize/6 + 1, gridSize/12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tongue when moving
        if (velocityX !== 0 || velocityY !== 0) {
            ctx.strokeStyle = colors.snakeTongue;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, gridSize/8);
            ctx.lineTo(gridSize/3, gridSize/4);
            ctx.lineTo(gridSize/2, gridSize/3);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, gridSize/8);
            ctx.lineTo(gridSize/3, gridSize/4);
            ctx.lineTo(gridSize/2, gridSize/5);
            ctx.stroke();
        }
    }
    
    // Restore context
    ctx.restore();
}

// Draw snake
function drawSnake() {
    // Calculate angle for head
    let headAngle = 0;
    if (velocityX === 1) headAngle = 0; // right
    else if (velocityX === -1) headAngle = Math.PI; // left
    else if (velocityY === -1) headAngle = -Math.PI/2; // up
    else if (velocityY === 1) headAngle = Math.PI/2; // down
    
    // Draw head first
    drawSnakeSegment(snake[0].x, snake[0].y, true, headAngle);
    
    // Draw body segments
    for (let i = 1; i < snake.length; i++) {
        // Calculate angle based on direction to next segment
        let angle = 0;
        if (i < snake.length - 1) {
            const dx = snake[i+1].x - snake[i-1].x;
            const dy = snake[i+1].y - snake[i-1].y;
            
            if (dx === 1 && dy === 0) angle = 0; // right
            else if (dx === -1 && dy === 0) angle = Math.PI; // left
            else if (dx === 0 && dy === -1) angle = -Math.PI/2; // up
            else if (dx === 0 && dy === 1) angle = Math.PI/2; // down
            else if (dx === 1 && dy === -1) angle = -Math.PI/4; // up-right
            else if (dx === 1 && dy === 1) angle = Math.PI/4; // down-right
            else if (dx === -1 && dy === -1) angle = -3*Math.PI/4; // up-left
            else if (dx === -1 && dy === 1) angle = 3*Math.PI/4; // down-left
        }
        
        drawSnakeSegment(snake[i].x, snake[i].y, false, angle);
    }
}

// Draw food
function drawFood() {
    if (foodActive) {
        // Create 3D effect for food
        const foodGradient = ctx.createRadialGradient(
            foodX * gridSize + gridSize/2, 
            foodY * gridSize + gridSize/2, 
            0,
            foodX * gridSize + gridSize/2, 
            foodY * gridSize + gridSize/2, 
            gridSize/2
        );
        
        if (foodType === 'poison') {
            foodGradient.addColorStop(0, '#ff3333');
            foodGradient.addColorStop(1, '#cc0000');
        } else {
            foodGradient.addColorStop(0, '#ffcc00');
            foodGradient.addColorStop(1, '#ff9900');
        }
        
        ctx.fillStyle = foodGradient;
        ctx.beginPath();
        ctx.arc(
            foodX * gridSize + gridSize/2, 
            foodY * gridSize + gridSize/2, 
            gridSize/2 - 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Add 3D shading
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            foodX * gridSize + gridSize/2, 
            foodY * gridSize + gridSize/2 + 2, 
            gridSize/2 - 3, 
            0, 
            Math.PI * 2
        );
        ctx.stroke();
        
        // Draw frog eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(
            foodX * gridSize + gridSize/3, 
            foodY * gridSize + gridSize/3, 
            2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
            foodX * gridSize + gridSize - gridSize/3, 
            foodY * gridSize + gridSize/3, 
            2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw frog legs if it's a normal frog
        if (foodType === 'normal') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            // Back legs
            ctx.beginPath();
            ctx.arc(
                foodX * gridSize + gridSize/4, 
                foodY * gridSize + gridSize - gridSize/4, 
                gridSize/4, 
                Math.PI/4, 
                Math.PI
            );
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(
                foodX * gridSize + gridSize - gridSize/4, 
                foodY * gridSize + gridSize - gridSize/4, 
                gridSize/4, 
                0, 
                3*Math.PI/4
            );
            ctx.stroke();
        }
    }
}

// Move snake
function moveSnake() {
    const head = {x: snake[0].x + velocityX, y: snake[0].y + velocityY};
    
    // Wrap around screen
    if (head.x < 0) head.x = tileCountX - 1;
    if (head.x >= tileCountX) head.x = 0;
    if (head.y < 0) head.y = tileCountY - 1;
    if (head.y >= tileCountY) head.y = 0;
    
    // Check collision with self
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            loseLife();
            return;
        }
    }
    
    snake.unshift(head);
    
    // Check if snake ate food
    if (head.x === foodX && head.y === foodY && foodActive) {
        if (foodType === 'poison') {
            loseLife();
        } else {
            score += level * 10;
            scoreElement.textContent = score;
            
            // Level up every 50 points
            if (score >= level * 50) {
                level++;
                levelElement.textContent = level;
                gameSpeed = Math.max(50, gameSpeed - 10);
                clearInterval(gameLoop);
                gameLoop = setInterval(game, gameSpeed);
            }
        }
        spawnFood();
    } else {
        snake.pop();
    }
}

// Spawn food
function spawnFood() {
    // Random position
    foodX = Math.floor(Math.random() * tileCountX);
    foodY = Math.floor(Math.random() * tileCountY);
    
    // Make sure food doesn't spawn on snake
    for (let i = 0; i < snake.length; i++) {
        if (foodX === snake[i].x && foodY === snake[i].y) {
            spawnFood();
            return;
        }
    }
    
    // 20% chance for poison frog
    foodType = Math.random() < 0.2 ? 'poison' : 'normal';
    foodActive = true;
    
    // Food disappears after 5 seconds
    clearTimeout(foodTimer);
    foodTimer = setTimeout(() => {
        foodActive = false;
        setTimeout(spawnFood, 1000);
    }, 5000);
}

// Lose a life
function loseLife() {
    lives--;
    livesElement.textContent = lives;
    
    if (lives <= 0) {
        endGame();
    } else {
        // Reset snake
        snake = [{x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2)}];
        velocityX = 0;
        velocityY = 0;
        
        // Flash screen red
        ctx.fillStyle = '#ff000040';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Respawn food after delay
        setTimeout(spawnFood, 1000);
    }
}

// End game
function endGame() {
    gameOver = true;
    clearInterval(gameLoop);
    clearTimeout(foodTimer);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = '30px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    
    ctx.font = '20px Courier New';
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Courier New';
    ctx.fillText('Press SPACE to restart', canvas.width/2, canvas.height/2 + 80);
}

// Reset game
function resetGame() {
    snake = [{x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2)}];
    velocityX = 0;
    velocityY = 0;
    score = 0;
    level = 1;
    lives = 3;
    gameSpeed = 150;
    gameOver = false;
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    livesElement.textContent = lives;
    
    clearInterval(gameLoop);
    gameLoop = setInterval(game, gameSpeed);
    
    spawnFood();
}

// Main game function
function game() {
    if (gameOver) return;
    
    // Clear with semi-transparent background for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    moveSnake();
    drawSnake();
    drawFood();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver && e.code === 'Space') {
        resetGame();
        return;
    }
    
    // Prevent reverse direction
    switch(e.key) {
        case 'ArrowUp':
            if (velocityY !== 1) {
                velocityX = 0;
                velocityY = -1;
            }
            break;
        case 'ArrowDown':
            if (velocityY !== -1) {
                velocityX = 0;
                velocityY = 1;
            }
            break;
        case 'ArrowLeft':
            if (velocityX !== 1) {
                velocityX = -1;
                velocityY = 0;
            }
            break;
        case 'ArrowRight':
            if (velocityX !== -1) {
                velocityX = 1;
                velocityY = 0;
            }
            break;
    }
});

// Initialize splash screen
window.addEventListener('load', () => {
    splashScreen.style.display = 'flex';
});