const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
let food = { x: 15, y: 7 };

let bombs = [];       // 紅色普通炸彈（每吃一個食物增加 1 顆）
let yellowBombs = []; // 黃色高能炸彈（開局固定 3 顆）

let dx = 1;
let dy = 0;
let score = 0;

let highScore = localStorage.getItem('snake_cyber_high_score') || 0;
let gameInterval;
const gameSpeed = 100; 
let inputQueue = [];
let isGameOver = false;

// 記錄重新開始按鈕在 Canvas 上的點擊區域
let retryBtnRect = { x: 0, y: 0, width: 0, height: 0 };

document.getElementById('highScore').innerText = highScore;

function main() {
    if (isGameOver) return;

    if (inputQueue.length > 0) {
        const nextMove = inputQueue.shift();
        if ((nextMove.dx !== 0 && dx === 0) || (nextMove.dy !== 0 && dy === 0)) {
            dx = nextMove.dx;
            dy = nextMove.dy;
        }
    }

    moveSnake();

    if (checkGameOver()) {
        isGameOver = true;
        clearInterval(gameInterval);
        handleGameOver();
        return;
    }

    clearCanvas();
    drawGrid();
    drawFood();
    drawBombs();       // 繪製純紅色炸彈
    drawYellowBombs(); // 繪製純黃色炸彈
    drawSnake();
}

function startGame() {
    clearInterval(gameInterval);
    isGameOver = false;
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    score = 0;
    document.getElementById('score').innerText = score;
    dx = 1;
    dy = 0;
    inputQueue = [];
    
    bombs = []; 
    yellowBombs = []; 
    
    generateFood();
    generateBomb(); // 生成第一顆紅炸彈
    
    // 開局生成 3 顆黃色固定炸彈
    for (let i = 0; i < 3; i++) {
        generateYellowBomb();
    }
    
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

// 🍓 繪製食物（亮粉色/霓虹紫紅）
function drawFood() {
    ctx.save();
    const x = food.x * gridSize;
    const y = food.y * gridSize;

    ctx.shadowBlur = 18;
    ctx.shadowColor = '#ff007f';
    
    let gradient = ctx.createRadialGradient(x + 10, y + 10, 1, x + 10, y + 10, 10);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, '#ff3399');
    gradient.addColorStop(1, '#ff007f');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, gridSize - 4, gridSize - 4, 6);
    ctx.fill();
    ctx.restore();
}

// 💣 繪製普通炸彈（紅色）
function drawBombs() {
    bombs.forEach(bomb => {
        ctx.save();
        const x = bomb.x * gridSize;
        const y = bomb.y * gridSize;

        const pulse = 12 + Math.sin(Date.now() * 0.01) * 5;
        ctx.shadowBlur = pulse;
        ctx.shadowColor = '#ff2a2a';

        ctx.fillStyle = '#ff2a2a';
        ctx.beginPath(); ctx.arc(x + 10, y + 10, 8, 0, 2 * Math.PI); ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(x + 10, y + 10, 3, 0, 2 * Math.PI); ctx.fill();

        // 炸彈引信
        ctx.strokeStyle = '#ff9999';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 14, y + 6); ctx.quadraticCurveTo(x + 18, y + 2, x + 16, y + 1); ctx.stroke();

        ctx.restore();
    });
}

// ⚡ 繪製高能炸彈（耀眼純黃色）
function drawYellowBombs() {
    yellowBombs.forEach(bomb => {
        ctx.save();
        const x = bomb.x * gridSize;
        const y = bomb.y * gridSize;

        const pulse = 12 + Math.sin(Date.now() * 0.01 + Math.PI) * 5;
        ctx.shadowBlur = pulse;
        ctx.shadowColor = '#ffd700'; 

        ctx.fillStyle = '#ffd700'; // 純亮黃
        ctx.beginPath(); ctx.arc(x + 10, y + 10, 8, 0, 2 * Math.PI); ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(x + 10, y + 10, 3, 0, 2 * Math.PI); ctx.fill();

        // 炸彈引信
        ctx.strokeStyle = '#fff59d';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 14, y + 6); ctx.quadraticCurveTo(x + 18, y + 2, x + 16, y + 1); ctx.stroke();

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
        generateBomb();
    } else {
        snake.pop();
    }
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) { generateFood(); return; }
    }
    for (let i = 0; i < bombs.length; i++) {
        if (bombs[i].x === food.x && bombs[i].y === food.y) { generateFood(); return; }
    }
    for (let i = 0; i < yellowBombs.length; i++) {
        if (yellowBombs[i].x === food.x && yellowBombs[i].y === food.y) { generateFood(); return; }
    }
}

function generateBomb() {
    let newBomb = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === newBomb.x && snake[i].y === newBomb.y) { generateBomb(); return; }
    }
    if (food.x === newBomb.x && food.y === newBomb.y) { generateBomb(); return; }
    for (let i = 0; i < yellowBombs.length; i++) {
        if (yellowBombs[i].x === newBomb.x && yellowBombs[i].y === newBomb.y) { generateBomb(); return; }
    }

    bombs.push(newBomb);
}

function generateYellowBomb() {
    let newBomb = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    for (let i = 0; i < snake.length; i++) {
        const distance = Math.abs(snake[i].x - newBomb.x) + Math.abs(snake[i].y - newBomb.y);
        if (distance < 3) { generateYellowBomb(); return; }
    }
    if (food.x === newBomb.x && food.y === newBomb.y) { generateYellowBomb(); return; }
    for (let i = 0; i < bombs.length; i++) {
        if (bombs[i].x === newBomb.x && bombs[i].y === newBomb.y) { generateYellowBomb(); return; }
    }

    yellowBombs.push(newBomb);
}

function checkGameOver() {
    const head = snake[0];
    
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) return true;
    
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) return true;
    }

    for (let i = 0; i < bombs.length; i++) {
        if (bombs[i].x === head.x && bombs[i].y === head.y) return true;
    }

    for (let i = 0; i < yellowBombs.length; i++) {
        if (yellowBombs[i].x === head.x && yellowBombs[i].y === head.y) return true;
    }

    return false;
}

// 🏆 【全新升級】賽博霓虹風格死掉結算畫面
function handleGameOver() {
    let isNewHigh = false;
    if (score > highScore) {
        highScore = score;
        isNewHigh = true;
        localStorage.setItem('snake_cyber_high_score', highScore);
        document.getElementById('highScore').innerText = highScore;
    }

    ctx.save();
    // 全螢幕暗色遮罩
    ctx.fillStyle = "rgba(7, 10, 18, 0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 結算卡片尺寸
    const cardWidth = 260;
    const cardHeight = 220;
    const cardX = (canvas.width - cardWidth) / 2;
    const cardY = (canvas.height - cardHeight) / 2;

    // 繪製背景邊框卡片
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = 'rgba(16, 23, 42, 0.95)';
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.stroke();

    // GAME OVER 標題
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff007f";
    ctx.font = "900 24px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, cardY + 40);

    // 破紀錄標籤
    if (isNewHigh) {
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("🎉 NEW HIGH SCORE! 🎉", canvas.width / 2, cardY + 62);
    }

    // 本次分數 & 最高分
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "15px sans-serif";
    ctx.fillText(`本次得分: ${score}`, canvas.width / 2, cardY + (isNewHigh ? 90 : 80));
    
    ctx.fillStyle = "#8a99ad";
    ctx.font = "14px sans-serif";
    ctx.fillText(`最高紀錄: ${highScore}`, canvas.width / 2, cardY + (isNewHigh ? 115 : 105));

    // 再試一次按鈕
    const btnW = 140;
    const btnH = 36;
    const btnX = (canvas.width - btnW) / 2;
    const btnY = cardY + 148;
    retryBtnRect = { x: btnX, y: btnY, width: btnW, height: btnH };

    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#060914';
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("↻ 再試一次", canvas.width / 2, btnY + 23);

    ctx.restore();
}

function pushDirection(newDx, newDy) {
    const lastMove = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : { dx, dy };
    if ((newDx !== 0 && lastMove.dx === 0) || (newDy !== 0 && lastMove.dy === 0)) {
        inputQueue.push({ dx: newDx, dy: newDy });
    }
}

// 點擊 Canvas 畫面上的「再試一次」按鈕觸發重新開始
canvas.addEventListener('click', (e) => {
    if (!isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (
        clickX >= retryBtnRect.x &&
        clickX <= retryBtnRect.x + retryBtnRect.width &&
        clickY >= retryBtnRect.y &&
        clickY <= retryBtnRect.y + retryBtnRect.height
    ) {
        startGame();
    }
});

document.addEventListener('keydown', e => {
    if (isGameOver) {
        if (e.key === 'Enter' || e.key === ' ') {
            startGame();
        }
        return;
    }
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
