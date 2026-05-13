const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
let food = { x: 15, y: 7 };
// 【新增】炸彈座標陣列，方便以後如果要同時生多個炸彈
let bombs = []; 
let dx = 1;
let dy = 0;
let score = 0;

let highScore = localStorage.getItem('snake_cyber_high_score') || 0;
let gameInterval;
const gameSpeed = 100; 
let inputQueue = [];

document.getElementById('highScore').innerText = highScore;

function main() {
    if (inputQueue.length > 0) {
        const nextMove = inputQueue.shift();
        if ((nextMove.dx !== 0 && dx === 0) || (nextMove.dy !== 0 && dy === 0)) {
            dx = nextMove.dx;
            dy = nextMove.dy;
        }
    }

    moveSnake();

    if (checkGameOver()) {
        handleGameOver();
        return;
    }

    clearCanvas();
    drawGrid();
    drawFood();
    drawBombs(); // 【新增】渲染炸彈
    drawSnake();
}

function startGame() {
    clearInterval(gameInterval);
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    score = 0;
    document.getElementById('score').innerText = score;
    dx = 1;
    dy = 0;
    inputQueue = [];
    bombs = []; // 【新增】重開遊戲時清空舊炸彈
    generateFood();
    generateBomb(); // 【新增】生成第一顆炸彈
    gameInterval = setInterval(main, gameSpeed);
}

function clearCanvas() {
    ctx.fillStyle = '#070a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
    ctx.restore();
}

function drawSnake() {
    snake.forEach((part, index) => {
        ctx.save();
        const isHead = index === 0;
        const x = part.x * gridSize;
        const y = part.y * gridSize;
        const r = isHead ? 7 : 4;

        ctx.shadowBlur = isHead ? 18 : 8;
        ctx.shadowColor = isHead ? '#00f0ff' : '#00a3ff';
        ctx.fillStyle = isHead ? '#00f0ff' : `rgba(0, 163, 255, ${1 - (index / snake.length) * 0.65})`;
        
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, gridSize - 2, gridSize - 2, r);
        ctx.fill();
        
        if (isHead) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#060914';
            let eyeX1 = x + 10, eyeY1 = y + 10;
            let eyeX2 = x + 10, eyeY2 = y + 10;
            
            if (dx === 1)  { eyeX1 = x + 13; eyeY1 = y + 6;  eyeX2 = x + 13; eyeY2 = y + 14; }
            if (dx === -1) { eyeX1 = x + 7;  eyeY1 = y + 6;  eyeX2 = x + 7;  eyeY2 = y + 14; }
            if (dy === 1)  { eyeX1 = x + 6;  eyeY1 = y + 13; eyeX2 = x + 14; eyeY2 = y + 13; }
            if (dy === -1) { eyeX1 = x + 6;  eyeY1 = y + 7;  eyeX2 = x + 14; eyeY2 = y + 7; }
            
            ctx.beginPath(); ctx.arc(eyeX1, eyeY1, 2, 0, 2 * Math.PI); ctx.fill();
            ctx.beginPath(); ctx.arc(eyeX2, eyeY2, 2, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.restore();
    });
}

function drawFood() {
    ctx.save();
    const x = food.x * gridSize;
    const y = food.y * gridSize;

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff007f';
    
    let gradient = ctx.createRadialGradient(x + 10, y + 10, 1, x + 10, y + 10, 10);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#ff66b2');
    gradient.addColorStop(1, '#ff007f');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, gridSize - 4, gridSize - 4, 6);
    ctx.fill();
    ctx.restore();
}

// 【新增】繪製賽博風格紅光炸彈
function drawBombs() {
    bombs.forEach(bomb => {
        ctx.save();
        const x = bomb.x * gridSize;
        const y = bomb.y * gridSize;

        // 利用時間戳讓炸彈產生脈衝微光，看起來更危險
        const pulse = 15 + Math.sin(Date.now() * 0.01) * 5;
        ctx.shadowBlur = pulse;
        ctx.shadowColor = '#ff3333';

        // 炸彈外圍紅光
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 8, 0, 2 * Math.PI);
        ctx.fill();

        // 炸彈核心亮點
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 3, 0, 2 * Math.PI);
        ctx.fill();

        // 炸彈引信
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 14, y + 6);
        ctx.quadraticCurveTo(x + 18, y + 2, x + 16, y + 1);
        ctx.stroke();

        ctx.restore();
    });
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (snake[0].x === food.x && snake[0].y === food.y) {
        score += 10;
        document.getElementById('score').innerText = score;
        generateFood();
        generateBomb(); // 【新增】每吃一個食物，地圖上就多長出一顆新炸彈，難度堆疊！
    } else {
        snake.pop();
    }
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    
    // 防止食物生在蛇身上
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) {
            generateFood();
            return;
        }
    }
    // 【新增】防止食物生在炸彈上
    for (let i = 0; i < bombs.length; i++) {
        if (bombs[i].x === food.x && bombs[i].y === food.y) {
            generateFood();
            return;
        }
    }
}

// 【新增】生成隨機炸彈函式
function generateBomb() {
    let newBomb = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    // 防止炸彈生在蛇身上
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === newBomb.x && snake[i].y === newBomb.y) {
            generateBomb();
            return;
        }
    }
    // 防止炸彈生在食物上
    if (food.x === newBomb.x && food.y === newBomb.y) {
        generateBomb();
        return;
    }

    bombs.push(newBomb);
}

function checkGameOver() {
    const head = snake[0];
    
    // 撞牆判定
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) return true;
    
    // 撞自己判定
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) return true;
    }

    // 【新增】撞炸彈判定
    for (let i = 0; i < bombs.length; i++) {
        if (bombs[i].x === head.x && bombs[i].y === head.y) return true;
    }

    return false;
}

function handleGameOver() {
    ctx.save();
    ctx.fillStyle = "rgba(7, 10, 18, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = "#ff007f";
    ctx.font = "bold 28px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#8a99ad";
    ctx.font = "14px sans-serif";
    ctx.fillText("點擊 ↻ 按鈕再次挑戰", canvas.width / 2, canvas.height / 2 + 25);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake_cyber_high_score', highScore);
        document.getElementById('highScore').innerText = highScore;
    }
    ctx.restore();
}

function pushDirection(newDx, newDy) {
    const lastMove = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : { dx, dy };
    if ((newDx !== 0 && lastMove.dx === 0) || (newDy !== 0 && lastMove.dy === 0)) {
        inputQueue.push({ dx: newDx, dy: newDy });
    }
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') pushDirection(0, -1);
    if (e.key === 'ArrowDown') pushDirection(0, 1);
    if (e.key === 'ArrowLeft') pushDirection(-1, 0);
    if (e.key === 'ArrowRight') pushDirection(1, 0);
});

document.getElementById('btn-up').addEventListener('click', () => pushDirection(0, -1));
document.getElementById('btn-down').addEventListener('click', () => pushDirection(0, 1));
document.getElementById('btn-left').addEventListener('click', () => pushDirection(-1, 0));
document.getElementById('btn-right').addEventListener('click', () => pushDirection(1, 0));
document.getElementById('btn-restart').addEventListener('click', startGame);

startGame();
