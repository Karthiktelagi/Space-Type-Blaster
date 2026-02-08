const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");
const hud = document.getElementById("hud");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const accuracyEl = document.getElementById("accuracy");

/* ======================
   GAME STATE
====================== */
let score = 0;
let lives = 3;
let typed = 0;
let correct = 0;
let running = false;
let gameOver = false;

let level = 1;
let enemies = [];
let lasers = [];
let gameStartTime = Date.now();

/* ======================
   RESTART BUTTON
====================== */
const restartBtn = {
  x: canvas.width / 2 - 90,
  y: canvas.height / 2 + 140,
  width: 180,
  height: 50
};

/* ======================
   STARFIELD
====================== */
const stars = Array.from({ length: 200 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2 + 0.5
}));

/* ======================
   WORD POOLS
====================== */
const wordLevels = {
  1: ["api","css","html","linux","node"],
  2: ["server","docker","python","kernel","cloud"],
  3: ["database","javascript","frontend","backend"],
  4: ["microservice","virtualization","authentication","asynchronous"]
};

/* ======================
   SPACESHIP
====================== */
const ship = {
  x: canvas.width / 2,
  y: canvas.height - 90
};

/* ======================
   START GAME
====================== */
startBtn.onclick = () => {
  startScreen.classList.add("hidden");
  canvas.classList.remove("hidden");
  hud.classList.remove("hidden");

  running = true;
  spawnEnemy();
  gameLoop();
};

/* ======================
   SPAWN WORD
====================== */
function spawnEnemy() {
  const pool = wordLevels[level] || wordLevels[4];
  const word = pool[Math.floor(Math.random() * pool.length)];

  enemies.push({
    word,
    remaining: word,
    x: Math.random() * (canvas.width - 120) + 60,
    y: -40,
    speed: 0.8 + level * 0.4,
    flash: 0
  });
}

/* ======================
   KEYBOARD INPUT
====================== */
document.addEventListener("keydown", e => {
  if (!running || gameOver || !enemies.length) return;
  if (e.key.length !== 1) return;

  const char = e.key.toLowerCase();
  typed++;

  const enemy = enemies[0];
  if (enemy.remaining.startsWith(char)) {
    correct++;
    fireLaser(enemy);
    enemy.remaining = enemy.remaining.slice(1);
    enemy.flash = 4;

    if (enemy.remaining.length === 0) {
      score += 100 * level;
      enemies.shift();
      lasers = [];

      if (score % 500 === 0) level++;
      spawnEnemy();
    }
  }

  updateAccuracy();
});

/* ======================
   FIRE LASER
====================== */
function fireLaser(target) {
  lasers.push({
    progress: 0,
    target
  });
}

/* ======================
   UPDATE
====================== */
function update() {
  // Stars
  stars.forEach(s => {
    s.y += 0.5;
    if (s.y > canvas.height) s.y = 0;
  });

  // Enemies
  enemies.forEach(e => e.y += e.speed);

  // Lasers
  lasers.forEach(l => l.progress += 0.18);
  lasers = lasers.filter(l => l.progress < 1);

  // GAME OVER if word touches ship
  if (enemies.length && enemies[0].y > ship.y - 25) {
    endGame();
  }

  scoreEl.textContent = score;
  livesEl.textContent = lives;
}

/* ======================
   DRAW
====================== */
function draw() {
  if (gameOver) {
    drawGameOverReport();
    return;
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  ctx.fillStyle = "#fff";
  stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

  drawShip();

  // Words
  enemies.forEach(e => {
    ctx.font = "20px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = e.flash ? "#00ffa2" : "#ff6b6b";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;

    ctx.fillText(e.remaining, e.x, e.y);
    if (e.flash) e.flash--;
  });

  ctx.shadowBlur = 0;

  // Lasers
  lasers.forEach(l => {
    const t = l.target;
    const x = ship.x + (t.x - ship.x) * l.progress;
    const y = ship.y + (t.y - ship.y) * l.progress;

    ctx.strokeStyle = "rgba(0,255,200,0.4)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - 20);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.strokeStyle = "#00ffa2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - 20);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  drawHUDOverlay();
}

/* ======================
   SPACESHIP DRAW
====================== */
function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);

  ctx.fillStyle = "#0ff";
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(0, -8, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0cc";
  ctx.beginPath();
  ctx.moveTo(-20, 10);
  ctx.lineTo(-40, 28);
  ctx.lineTo(-10, 26);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(20, 10);
  ctx.lineTo(40, 28);
  ctx.lineTo(10, 26);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#00ffa2";
  ctx.beginPath();
  ctx.arc(0, 34, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ======================
   HUD OVERLAY
====================== */
function drawHUDOverlay() {
  ctx.fillStyle = "#00e5ff";
  ctx.font = "14px monospace";
  ctx.textAlign = "left";

  const elapsed = (Date.now() - gameStartTime) / 60000;
  const wpm = elapsed > 0 ? Math.round(correct / elapsed) : 0;

  ctx.fillText(`Level: ${level}`, 10, 20);
  ctx.fillText(`Speed: ${wpm} WPM`, 10, 40);
  ctx.fillText(`Accuracy: ${accuracyEl.textContent}`, 10, 60);
}

/* ======================
   ACCURACY
====================== */
function updateAccuracy() {
  accuracyEl.textContent =
    typed === 0 ? "100%" : Math.round((correct / typed) * 100) + "%";
}

/* ======================
   GAME OVER
====================== */
function endGame() {
  running = false;
  gameOver = true;
}

/* ======================
   GAME OVER REPORT
====================== */
function drawGameOverReport() {
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#00e5ff";
  ctx.font = "42px Segoe UI";
  ctx.fillText("GAME OVER", canvas.width / 2, 160);

  ctx.font = "18px monospace";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, 230);
  ctx.fillText(`Level Reached: ${level}`, canvas.width / 2, 260);
  ctx.fillText(`Accuracy: ${accuracyEl.textContent}`, canvas.width / 2, 290);

  const elapsed = (Date.now() - gameStartTime) / 60000;
  const wpm = elapsed > 0 ? Math.round(correct / elapsed) : 0;
  ctx.fillText(`Typing Speed: ${wpm} WPM`, canvas.width / 2, 320);

  // Restart button
  ctx.fillStyle = "#00ffa2";
  ctx.fillRect(restartBtn.x, restartBtn.y, restartBtn.width, restartBtn.height);

  ctx.fillStyle = "#000";
  ctx.font = "20px Segoe UI";
  ctx.fillText("RESTART", canvas.width / 2, restartBtn.y + 32);
}

/* ======================
   RESTART CLICK
====================== */
canvas.addEventListener("click", e => {
  if (!gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (
    mx > restartBtn.x &&
    mx < restartBtn.x + restartBtn.width &&
    my > restartBtn.y &&
    my < restartBtn.y + restartBtn.height
  ) {
    restartGame();
  }
});

/* ======================
   RESTART GAME
====================== */
function restartGame() {
  score = 0;
  typed = 0;
  correct = 0;
  level = 1;

  enemies = [];
  lasers = [];

  gameStartTime = Date.now();
  gameOver = false;
  running = true;

  spawnEnemy();
  gameLoop();
}

/* ======================
   LOOP
====================== */
function gameLoop() {
  if (!running) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
