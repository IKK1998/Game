// 游戏配置
const config = {
    gridSize: 20,
    initialSpeed: 150,
    speedIncrease: 10,
    maxSpeed: 50,
    foodValue: 10,
    obstacleFrequency: 0.02 // 障碍物出现的概率
};

// 游戏状态
let state = {
    snake: [],
    direction: 'right',
    nextDirection: 'right',
    food: null,
    obstacles: [],
    score: 0,
    level: 1,
    gameSpeed: config.initialSpeed,
    gameRunning: false,
    gameLoop: null,
    board: null,
    cells: []
};

// DOM元素
let elements = {};

// 初始化游戏
function initGame() {
    // 获取DOM元素
    elements.board = document.getElementById('game-board');
    elements.scoreDisplay = document.getElementById('score');
    elements.levelDisplay = document.getElementById('level');
    elements.startBtn = document.getElementById('start-btn');
    elements.pauseBtn = document.getElementById('pause-btn');
    elements.resetBtn = document.getElementById('reset-btn');
    elements.dirBtns = document.querySelectorAll('.dir-btn');
    
    // 初始化游戏板
    createGameBoard();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化游戏状态
    resetGame();
}

// 创建游戏板
function createGameBoard() {
    elements.board.innerHTML = '';
    state.cells = [];
    
    for (let y = 0; y < config.gridSize; y++) {
        for (let x = 0; x < config.gridSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;
            elements.board.appendChild(cell);
            state.cells.push(cell);
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 按钮控制
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.resetBtn.addEventListener('click', resetGame);
    
    // 方向按钮控制
    elements.dirBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newDirection = btn.dataset.direction;
            changeDirection(newDirection);
        });
    });
    
    // 键盘控制
    document.addEventListener('keydown', handleKeyPress);
}

// 处理键盘按键
function handleKeyPress(e) {
    switch (e.key) {
        case 'ArrowUp':
            changeDirection('up');
            break;
        case 'ArrowDown':
            changeDirection('down');
            break;
        case 'ArrowLeft':
            changeDirection('left');
            break;
        case 'ArrowRight':
            changeDirection('right');
            break;
        case ' ': // 空格键暂停/继续
            togglePause();
            break;
        case 'Enter': // 回车键开始游戏
            if (!state.gameRunning) {
                startGame();
            }
            break;
    }
}

// 改变方向
function changeDirection(newDirection) {
    // 防止180度转向（不能直接向后走）
    const oppositeDirections = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };
    
    if (newDirection !== oppositeDirections[state.direction]) {
        state.nextDirection = newDirection;
    }
}

// 重置游戏
function resetGame() {
    // 停止游戏循环
    if (state.gameLoop) {
        clearInterval(state.gameLoop);
    }
    
    // 重置游戏状态
    state.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    state.direction = 'right';
    state.nextDirection = 'right';
    state.score = 0;
    state.level = 1;
    state.gameSpeed = config.initialSpeed;
    state.gameRunning = false;
    state.obstacles = [];
    
    // 生成食物和障碍物
    generateFood();
    generateObstacles();
    
    // 更新UI
    updateScore();
    updateLevel();
    renderGame();
    
    // 更新按钮状态
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
}

// 开始游戏
function startGame() {
    if (state.gameRunning) return;
    
    state.gameRunning = true;
    state.gameLoop = setInterval(gameStep, state.gameSpeed);
    
    // 更新按钮状态
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = false;
}

// 暂停/继续游戏
function togglePause() {
    if (!state.gameLoop) return;
    
    if (state.gameRunning) {
        // 暂停游戏
        clearInterval(state.gameLoop);
        state.gameLoop = null;
        state.gameRunning = false;
        elements.pauseBtn.textContent = '继续';
    } else {
        // 继续游戏
        state.gameLoop = setInterval(gameStep, state.gameSpeed);
        state.gameRunning = true;
        elements.pauseBtn.textContent = '暂停';
    }
}

// 游戏主循环
function gameStep() {
    // 更新方向
    state.direction = state.nextDirection;
    
    // 获取蛇头位置
    const head = { ...state.snake[0] };
    
    // 根据方向移动蛇头
    switch (state.direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 添加新蛇头
    state.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === state.food.x && head.y === state.food.y) {
        // 增加分数
        state.score += config.foodValue * state.level;
        updateScore();
        
        // 生成新食物
        generateFood();
        
        // 检查是否升级
        checkLevelUp();
    } else {
        // 移除蛇尾
        state.snake.pop();
    }
    
    // 渲染游戏
    renderGame();
}

// 检查碰撞
function checkCollision(head) {
    // 检查边界碰撞
    if (head.x < 0 || head.x >= config.gridSize || head.y < 0 || head.y >= config.gridSize) {
        return true;
    }
    
    // 检查自身碰撞
    for (let i = 1; i < state.snake.length; i++) {
        if (head.x === state.snake[i].x && head.y === state.snake[i].y) {
            return true;
        }
    }
    
    // 检查障碍物碰撞
    for (const obstacle of state.obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            return true;
        }
    }
    
    return false;
}

// 生成食物
function generateFood() {
    let x, y;
    let isValid = false;
    
    while (!isValid) {
        x = Math.floor(Math.random() * config.gridSize);
        y = Math.floor(Math.random() * config.gridSize);
        
        // 检查食物是否出现在蛇身上
        let isOnSnake = false;
        for (const segment of state.snake) {
            if (segment.x === x && segment.y === y) {
                isOnSnake = true;
                break;
            }
        }
        
        // 检查食物是否出现在障碍物上
        let isOnObstacle = false;
        for (const obstacle of state.obstacles) {
            if (obstacle.x === x && obstacle.y === y) {
                isOnObstacle = true;
                break;
            }
        }
        
        isValid = !isOnSnake && !isOnObstacle;
    }
    
    state.food = { x, y };
}

// 生成障碍物
function generateObstacles() {
    state.obstacles = [];
    
    for (let y = 0; y < config.gridSize; y++) {
        for (let x = 0; x < config.gridSize; x++) {
            // 随机生成障碍物，但确保不与蛇重叠
            if (Math.random() < config.obstacleFrequency) {
                let isOnSnake = false;
                for (const segment of state.snake) {
                    if (segment.x === x && segment.y === y) {
                        isOnSnake = true;
                        break;
                    }
                }
                
                if (!isOnSnake) {
                    state.obstacles.push({ x, y });
                }
            }
        }
    }
}

// 检查升级
function checkLevelUp() {
    const newLevel = Math.floor(state.score / 100) + 1;
    
    if (newLevel > state.level) {
        state.level = newLevel;
        updateLevel();
        
        // 增加游戏速度
        if (state.gameSpeed > config.maxSpeed) {
            state.gameSpeed = Math.max(config.initialSpeed - (state.level - 1) * config.speedIncrease, config.maxSpeed);
            
            // 重新设置游戏循环以应用新速度
            if (state.gameLoop) {
                clearInterval(state.gameLoop);
                state.gameLoop = setInterval(gameStep, state.gameSpeed);
            }
        }
        
        // 每升3级增加障碍物
        if (state.level % 3 === 0) {
            generateObstacles();
        }
    }
}

// 更新分数显示
function updateScore() {
    elements.scoreDisplay.textContent = state.score;
}

// 更新等级显示
function updateLevel() {
    elements.levelDisplay.textContent = state.level;
}

// 渲染游戏
function renderGame() {
    // 重置所有单元格
    state.cells.forEach(cell => {
        cell.className = 'cell';
    });
    
    // 渲染蛇身
    state.snake.forEach((segment, index) => {
        const cell = getCell(segment.x, segment.y);
        if (cell) {
            cell.classList.add('snake');
            if (index === 0) {
                cell.classList.add('head');
                // 设置蛇头方向指示器
                cell.dataset.direction = state.direction;
            }
        }
    });
    
    // 渲染食物
    const foodCell = getCell(state.food.x, state.food.y);
    if (foodCell) {
        foodCell.classList.add('food');
    }
    
    // 渲染障碍物
    state.obstacles.forEach(obstacle => {
        const obstacleCell = getCell(obstacle.x, obstacle.y);
        if (obstacleCell) {
            obstacleCell.classList.add('obstacle');
        }
    });
}

// 获取指定位置的单元格
function getCell(x, y) {
    return state.cells.find(cell => 
        parseInt(cell.dataset.x) === x && parseInt(cell.dataset.y) === y
    );
}

// 游戏结束
function gameOver() {
    clearInterval(state.gameLoop);
    state.gameLoop = null;
    state.gameRunning = false;
    
    // 显示游戏结束画面
    showGameOverScreen();
}

// 显示游戏结束画面
function showGameOverScreen() {
    // 创建游戏结束元素
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    
    const content = `
        <div class="game-over-content">
            <h2>游戏结束</h2>
            <p>最终分数: <strong>${state.score}</strong></p>
            <p>达到等级: <strong>${state.level}</strong></p>
            <button id="restart-btn">再来一局</button>
        </div>
    `;
    
    gameOverDiv.innerHTML = content;
    document.body.appendChild(gameOverDiv);
    
    // 添加重启按钮事件
    document.getElementById('restart-btn').addEventListener('click', () => {
        document.body.removeChild(gameOverDiv);
        resetGame();
        startGame();
    });
}

// 当页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', initGame);