const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const coinCountEl = document.getElementById("coin-count");
const lifeCountEl = document.getElementById("life-count");
const statusTextEl = document.getElementById("status-text");

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 540;
const GRAVITY = 0.65;
const MOVE_SPEED = 4.2;
const JUMP_SPEED = 13.5;
const MAX_FALL_SPEED = 14;
const PLAYER_SPAWN = { x: 80, y: 380 };
const INITIAL_LIVES = 3;

const keys = new Set();

const level = {
  platforms: [
    { x: 0, y: 470, w: 420, h: 70 },
    { x: 510, y: 470, w: 380, h: 70 },
    { x: 980, y: 470, w: 300, h: 70 },
    { x: 1320, y: 410, w: 150, h: 22 },
    { x: 1510, y: 350, w: 140, h: 22 },
    { x: 1710, y: 470, w: 520, h: 70 },
    { x: 1860, y: 390, w: 120, h: 18 },
    { x: 2060, y: 330, w: 120, h: 18 },
    { x: 2280, y: 470, w: 420, h: 70 },
    { x: 2780, y: 470, w: 420, h: 70 }
  ],
  hazards: [
    { x: 720, y: 446, w: 70, h: 24, type: "spikes" },
    { x: 2450, y: 446, w: 80, h: 24, type: "spikes" }
  ],
  enemies: [
    { x: 1120, y: 438, w: 34, h: 32, minX: 1010, maxX: 1230, dir: 1, speed: 1.5 },
    { x: 2350, y: 438, w: 34, h: 32, minX: 2310, maxX: 2620, dir: -1, speed: 1.2 }
  ],
  coins: [
    { x: 285, y: 408, r: 10, collected: false },
    { x: 580, y: 408, r: 10, collected: false },
    { x: 1070, y: 408, r: 10, collected: false },
    { x: 1370, y: 350, r: 10, collected: false },
    { x: 1560, y: 290, r: 10, collected: false },
    { x: 1900, y: 330, r: 10, collected: false },
    { x: 2110, y: 270, r: 10, collected: false },
    { x: 2600, y: 408, r: 10, collected: false }
  ],
  goal: { x: 3070, y: 350, w: 24, h: 120 }
};

const player = {
  x: PLAYER_SPAWN.x,
  y: PLAYER_SPAWN.y,
  w: 36,
  h: 52,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1
};

const gameState = {
  cameraX: 0,
  lives: INITIAL_LIVES,
  coins: 0,
  mode: "playing"
};

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function circleRectOverlap(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function resetPlayerPosition() {
  player.x = PLAYER_SPAWN.x;
  player.y = PLAYER_SPAWN.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
}

function resetGame() {
  gameState.lives = INITIAL_LIVES;
  gameState.coins = 0;
  gameState.mode = "playing";
  level.coins.forEach((coin) => {
    coin.collected = false;
  });
  resetPlayerPosition();
  updateHud();
}

function loseLife(reason) {
  if (gameState.mode !== "playing") {
    return;
  }

  gameState.lives -= 1;
  if (gameState.lives <= 0) {
    gameState.lives = 0;
    gameState.mode = "gameover";
    statusTextEl.textContent = `${reason} Game over. Press R.`;
  } else {
    resetPlayerPosition();
    statusTextEl.textContent = `${reason} Try again.`;
  }
  updateHud();
}

function updateHud() {
  coinCountEl.textContent = String(gameState.coins);
  lifeCountEl.textContent = String(gameState.lives);

  if (gameState.mode === "playing" && !statusTextEl.textContent.includes("Try again.")) {
    statusTextEl.textContent = "Reach the goal.";
  }
  if (gameState.mode === "cleared") {
    statusTextEl.textContent = "Goal reached. Press R to play again.";
  }
}

function updatePlayer() {
  const moveLeft = keys.has("ArrowLeft") || keys.has("KeyA");
  const moveRight = keys.has("ArrowRight") || keys.has("KeyD");

  player.vx = 0;
  if (moveLeft) {
    player.vx = -MOVE_SPEED;
    player.facing = -1;
  }
  if (moveRight) {
    player.vx = MOVE_SPEED;
    player.facing = 1;
  }

  player.x += player.vx;
  resolveHorizontalCollisions();

  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);
  player.y += player.vy;
  player.onGround = false;
  resolveVerticalCollisions();

  if (player.y > WORLD_HEIGHT + 120) {
    loseLife("You fell.");
  }
}

function resolveHorizontalCollisions() {
  for (const platform of level.platforms) {
    if (!rectsOverlap(player, platform)) {
      continue;
    }

    if (player.vx > 0) {
      player.x = platform.x - player.w;
    } else if (player.vx < 0) {
      player.x = platform.x + platform.w;
    }
  }

  player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.w));
}

function resolveVerticalCollisions() {
  for (const platform of level.platforms) {
    if (!rectsOverlap(player, platform)) {
      continue;
    }

    if (player.vy > 0) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (player.vy < 0) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  }
}

function updateEnemies() {
  for (const enemy of level.enemies) {
    enemy.x += enemy.dir * enemy.speed;
    if (enemy.x <= enemy.minX || enemy.x + enemy.w >= enemy.maxX) {
      enemy.dir *= -1;
    }

    if (rectsOverlap(player, enemy)) {
      loseLife("You hit an enemy.");
    }
  }
}

function updateHazards() {
  for (const hazard of level.hazards) {
    if (rectsOverlap(player, hazard)) {
      loseLife("You hit spikes.");
    }
  }
}

function updateCoins() {
  for (const coin of level.coins) {
    if (coin.collected) {
      continue;
    }

    if (circleRectOverlap({ x: coin.x, y: coin.y, r: coin.r }, player)) {
      coin.collected = true;
      gameState.coins += 1;
      statusTextEl.textContent = "Coin collected.";
      updateHud();
    }
  }
}

function updateGoal() {
  if (rectsOverlap(player, level.goal)) {
    gameState.mode = "cleared";
    updateHud();
  }
}

function updateCamera() {
  const target = player.x - canvas.width * 0.35;
  gameState.cameraX = Math.max(0, Math.min(target, WORLD_WIDTH - canvas.width));
}

function drawBackground() {
  ctx.fillStyle = "#a7e0ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 5; i += 1) {
    const offset = (gameState.cameraX * 0.15 + i * 210) % (canvas.width + 140);
    ctx.beginPath();
    ctx.arc(canvas.width - offset, 80 + i * 18, 28, 0, Math.PI * 2);
    ctx.arc(canvas.width - offset + 26, 76 + i * 18, 22, 0, Math.PI * 2);
    ctx.arc(canvas.width - offset - 24, 78 + i * 18, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#9fd18b";
  ctx.fillRect(0, 430, canvas.width, 110);
}

function drawWorldRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - gameState.cameraX), Math.round(y), w, h);
}

function drawPlatforms() {
  for (const platform of level.platforms) {
    drawWorldRect(platform.x, platform.y, platform.w, platform.h, "#6d8f4e");
    drawWorldRect(platform.x, platform.y, platform.w, 10, "#9dc46b");
  }
}

function drawHazards() {
  for (const hazard of level.hazards) {
    const drawX = hazard.x - gameState.cameraX;
    ctx.fillStyle = "#c43c3c";
    for (let x = drawX; x < drawX + hazard.w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, hazard.y + hazard.h);
      ctx.lineTo(x + 8, hazard.y);
      ctx.lineTo(x + 16, hazard.y + hazard.h);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawEnemies() {
  for (const enemy of level.enemies) {
    const drawX = enemy.x - gameState.cameraX;
    ctx.fillStyle = "#6c3eb8";
    ctx.fillRect(drawX, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(drawX + 6, enemy.y + 8, 6, 6);
    ctx.fillRect(drawX + 22, enemy.y + 8, 6, 6);
  }
}

function drawCoins() {
  for (const coin of level.coins) {
    if (coin.collected) {
      continue;
    }

    ctx.fillStyle = "#f9c74f";
    ctx.beginPath();
    ctx.arc(coin.x - gameState.cameraX, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d49500";
    ctx.beginPath();
    ctx.arc(coin.x - gameState.cameraX, coin.y, coin.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGoal() {
  drawWorldRect(level.goal.x, level.goal.y, level.goal.w, level.goal.h, "#f94144");
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(level.goal.x + level.goal.w - gameState.cameraX, level.goal.y, 50, 24);
}

function drawPlayer() {
  const drawX = player.x - gameState.cameraX;
  ctx.fillStyle = "#ef7d57";
  ctx.fillRect(drawX, player.y, player.w, player.h);
  ctx.fillStyle = "#1f2d3d";
  const eyeX = player.facing === 1 ? drawX + 22 : drawX + 8;
  ctx.fillRect(eyeX, player.y + 12, 6, 6);
}

function drawOverlay() {
  if (gameState.mode === "playing") {
    return;
  }

  ctx.fillStyle = "rgba(21, 32, 43, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 40px Trebuchet MS";
  ctx.fillText(
    gameState.mode === "cleared" ? "Stage Clear" : "Game Over",
    canvas.width / 2,
    canvas.height / 2 - 20
  );
  ctx.font = "24px Trebuchet MS";
  ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 26);
}

function render() {
  drawBackground();
  drawPlatforms();
  drawHazards();
  drawCoins();
  drawEnemies();
  drawGoal();
  drawPlayer();
  drawOverlay();
}

function tick() {
  if (gameState.mode === "playing") {
    updatePlayer();
    updateEnemies();
    updateHazards();
    updateCoins();
    updateGoal();
    updateCamera();
  }

  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === "KeyR") {
    resetGame();
    return;
  }

  const jumpPressed =
    event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW";
  if (jumpPressed && player.onGround && gameState.mode === "playing") {
    player.vy = -JUMP_SPEED;
    player.onGround = false;
  }

  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

updateHud();
tick();
