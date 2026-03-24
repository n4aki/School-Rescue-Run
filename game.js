const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const stageNameEl = document.getElementById("stage-name");
const heroNameEl = document.getElementById("hero-name");
const rescuedCountEl = document.getElementById("rescued-count");
const coinCountEl = document.getElementById("coin-count");
const lifeCountEl = document.getElementById("life-count");
const bossPanelEl = document.getElementById("boss-panel");
const bossHpEl = document.getElementById("boss-hp");
const statusTextEl = document.getElementById("status-text");
const orientationHintEl = document.getElementById("orientation-hint");
const touchLeftEl = document.getElementById("touch-left");
const touchRightEl = document.getElementById("touch-right");
const touchJumpEl = document.getElementById("touch-jump");
const touchAttackEl = document.getElementById("touch-attack");
const touchSwitchEl = document.getElementById("touch-switch");

const WORLD_HEIGHT = 540;
const GRAVITY = 0.65;
const MAX_FALL_SPEED = 14;
const INITIAL_LIVES = 3;
const ATTACK_DURATION = 12;
const ATTACK_COOLDOWN = 20;
const ATTACK_RANGE = 28;
const ATTACK_HEIGHT = 26;
const MAX_MESSAGE_FRAMES = 210;

const keys = new Set();
const holdButtonBindings = [];

const CHARACTERS = {
  freshman: {
    id: "freshman",
    name: "新入生",
    club: "主人公",
    color: "#ef7d57",
    moveSpeed: 4.2,
    jumpPower: 13.5,
    attackPower: 1,
    skill: null,
    description: "標準性能の新入生。最初から使える。"
  },
  art: {
    id: "art",
    name: "美術部",
    club: "美術部",
    color: "#b07dff",
    moveSpeed: 4.0,
    jumpPower: 13.4,
    attackPower: 1,
    skill: "platformReveal",
    description: "隠し足場を見つけて渡れる。"
  },
  science: {
    id: "science",
    name: "科学部",
    club: "科学部",
    color: "#36b6b2",
    moveSpeed: 3.9,
    jumpPower: 13.2,
    attackPower: 1,
    skill: "switchHack",
    description: "スイッチ扉を解除できる。"
  },
  basket: {
    id: "basket",
    name: "バスケ部",
    club: "バスケ部",
    color: "#f59f00",
    moveSpeed: 4.1,
    jumpPower: 15.7,
    attackPower: 1,
    skill: "highJump",
    description: "ジャンプが高い。"
  },
  track: {
    id: "track",
    name: "陸上部",
    club: "陸上部",
    color: "#ff7a59",
    moveSpeed: 5.4,
    jumpPower: 13.3,
    attackPower: 1,
    skill: "speed",
    description: "移動が速く、長い区間に強い。"
  }
};

const RESCUE_CHARACTER_TOTAL = 4;

const STAGES = [
  {
    id: "classroom",
    name: "教室",
    type: "rescue",
    worldWidth: 2200,
    playerSpawn: { x: 80, y: 380 },
    background: {
      sky: "#c7e8ff",
      floor: "#cdbb9b",
      detail: "#e8f2ff",
      banner: "#ffd166"
    },
    introText: "4月の入学初日。教室で最初の救出対象を探そう。",
    clearText: "美術部を救出した。次は理科室へ向かう。",
    platforms: [
      { x: 0, y: 470, w: 380, h: 70 },
      { x: 440, y: 470, w: 220, h: 70 },
      { x: 740, y: 410, w: 150, h: 18 },
      { x: 980, y: 470, w: 260, h: 70 },
      { x: 1320, y: 470, w: 180, h: 70 },
      { x: 1580, y: 390, w: 120, h: 18 },
      { x: 1760, y: 470, w: 440, h: 70 }
    ],
    hazards: [
      { x: 665, y: 446, w: 60, h: 24, type: "spikes" },
      { x: 1510, y: 446, w: 55, h: 24, type: "spikes" }
    ],
    enemies: [
      { x: 1080, y: 438, w: 34, h: 32, minX: 1020, maxX: 1210, dir: 1, speed: 1.4, type: "hall-monitor" }
    ],
    coins: [
      { x: 300, y: 420, r: 10, collected: false },
      { x: 800, y: 360, r: 10, collected: false },
      { x: 1360, y: 420, r: 10, collected: false },
      { x: 1630, y: 340, r: 10, collected: false }
    ],
    gimmicks: [
      {
        type: "switchDoor",
        x: 1540,
        y: 380,
        w: 30,
        h: 40,
        requiredSkill: "switchHack",
        hint: "科学部なら体育館のロックを解除できる。",
        active: false,
        door: { x: 1900, y: 248, w: 24, h: 140 }
      },
      {
        type: "hiddenPlatform",
        requiredSkill: "platformReveal",
        hint: "美術部なら隠し足場を見つけられる。",
        platform: { x: 1480, y: 320, w: 80, h: 16 }
      }
    ],
    rescueTarget: {
      x: 1640,
      y: 338,
      w: 34,
      h: 52,
      characterId: "art"
    },
    exit: { x: 2085, y: 350, w: 24, h: 120 }
  },
  {
    id: "lab",
    name: "理科室",
    type: "rescue",
    worldWidth: 2500,
    playerSpawn: { x: 80, y: 380 },
    background: {
      sky: "#d9f7f7",
      floor: "#aec7cb",
      detail: "#edf9ff",
      banner: "#4ecdc4"
    },
    introText: "理科室では装置のロックを解除して科学部を救い出そう。",
    clearText: "科学部を救出した。仕掛けの攻略が楽になる。",
    platforms: [
      { x: 0, y: 470, w: 450, h: 70 },
      { x: 520, y: 470, w: 260, h: 70 },
      { x: 860, y: 410, w: 140, h: 18 },
      { x: 1100, y: 470, w: 220, h: 70 },
      { x: 1400, y: 390, w: 140, h: 18 },
      { x: 1600, y: 470, w: 260, h: 70 },
      { x: 1940, y: 470, w: 220, h: 70 },
      { x: 2220, y: 410, w: 120, h: 18 },
      { x: 2320, y: 470, w: 180, h: 70 }
    ],
    hazards: [
      { x: 800, y: 446, w: 45, h: 24, type: "acid" },
      { x: 1880, y: 446, w: 45, h: 24, type: "acid" }
    ],
    enemies: [
      { x: 1180, y: 438, w: 34, h: 32, minX: 1140, maxX: 1280, dir: 1, speed: 1.3, type: "drone" },
      { x: 1980, y: 438, w: 34, h: 32, minX: 1960, maxX: 2080, dir: -1, speed: 1.5, type: "drone" }
    ],
    coins: [
      { x: 560, y: 420, r: 10, collected: false },
      { x: 900, y: 360, r: 10, collected: false },
      { x: 1460, y: 340, r: 10, collected: false },
      { x: 2250, y: 360, r: 10, collected: false }
    ],
    gimmicks: [
      {
        type: "switchDoor",
        x: 1510,
        y: 350,
        w: 30,
        h: 40,
        requiredSkill: "switchHack",
        hint: "科学部ならロック装置を解除できる。",
        active: false,
        door: { x: 2140, y: 300, w: 24, h: 170 }
      }
    ],
    rescueTarget: {
      x: 2260,
      y: 358,
      w: 34,
      h: 52,
      characterId: "science"
    },
    exit: { x: 2430, y: 350, w: 24, h: 120 }
  },
  {
    id: "gym",
    name: "体育館",
    type: "rescue",
    worldWidth: 2500,
    playerSpawn: { x: 80, y: 380 },
    background: {
      sky: "#ffe9cf",
      floor: "#d7b58a",
      detail: "#fff4e7",
      banner: "#f59f00"
    },
    introText: "体育館は高低差が激しい。高いジャンプが活きる。",
    clearText: "バスケ部を救出した。高い足場に届くようになった。",
    platforms: [
      { x: 0, y: 470, w: 360, h: 70 },
      { x: 430, y: 430, w: 120, h: 18 },
      { x: 620, y: 380, w: 120, h: 18 },
      { x: 820, y: 330, w: 120, h: 18 },
      { x: 1020, y: 280, w: 120, h: 18 },
      { x: 1210, y: 470, w: 240, h: 70 },
      { x: 1520, y: 420, w: 140, h: 18 },
      { x: 1740, y: 360, w: 140, h: 18 },
      { x: 1960, y: 300, w: 140, h: 18 },
      { x: 2180, y: 470, w: 320, h: 70 }
    ],
    hazards: [
      { x: 1465, y: 446, w: 35, h: 24, type: "spikes" }
    ],
    enemies: [
      { x: 1240, y: 438, w: 34, h: 32, minX: 1230, maxX: 1400, dir: 1, speed: 1.7, type: "guard" }
    ],
    coins: [
      { x: 470, y: 390, r: 10, collected: false },
      { x: 860, y: 290, r: 10, collected: false },
      { x: 1060, y: 240, r: 10, collected: false },
      { x: 1790, y: 320, r: 10, collected: false }
    ],
    gimmicks: [
      {
        type: "hiddenPlatform",
        requiredSkill: "platformReveal",
        hint: "美術部なら近道の足場を見つけられる。",
        platform: { x: 1610, y: 330, w: 90, h: 16 }
      }
    ],
    rescueTarget: {
      x: 1995,
      y: 248,
      w: 34,
      h: 52,
      characterId: "basket"
    },
    exit: { x: 2400, y: 350, w: 24, h: 120 }
  },
  {
    id: "yard",
    name: "校庭",
    type: "rescue",
    worldWidth: 3000,
    playerSpawn: { x: 80, y: 380 },
    background: {
      sky: "#c9f4d6",
      floor: "#91c26f",
      detail: "#eefbea",
      banner: "#ff7a59"
    },
    introText: "校庭では長い区間を駆け抜けて陸上部を救出しよう。",
    clearText: "陸上部を救出した。最後は校長室へ乗り込む。",
    platforms: [
      { x: 0, y: 470, w: 520, h: 70 },
      { x: 610, y: 470, w: 380, h: 70 },
      { x: 1100, y: 470, w: 340, h: 70 },
      { x: 1550, y: 470, w: 260, h: 70 },
      { x: 1920, y: 470, w: 300, h: 70 },
      { x: 2350, y: 410, w: 120, h: 18 },
      { x: 2550, y: 470, w: 450, h: 70 }
    ],
    hazards: [
      { x: 540, y: 446, w: 40, h: 24, type: "spikes" },
      { x: 1010, y: 446, w: 50, h: 24, type: "spikes" },
      { x: 1460, y: 446, w: 50, h: 24, type: "spikes" },
      { x: 1830, y: 446, w: 50, h: 24, type: "spikes" }
    ],
    enemies: [
      { x: 1200, y: 438, w: 34, h: 32, minX: 1150, maxX: 1390, dir: 1, speed: 2.0, type: "runner" },
      { x: 2600, y: 438, w: 34, h: 32, minX: 2580, maxX: 2860, dir: -1, speed: 2.2, type: "runner" }
    ],
    coins: [
      { x: 450, y: 420, r: 10, collected: false },
      { x: 1260, y: 420, r: 10, collected: false },
      { x: 2400, y: 360, r: 10, collected: false },
      { x: 2740, y: 420, r: 10, collected: false }
    ],
    gimmicks: [
      {
        type: "speedGate",
        x: 2240,
        y: 430,
        w: 60,
        h: 40,
        requiredSkill: "speed",
        hint: "陸上部なら勢いよく突破できる。",
        active: false
      }
    ],
    rescueTarget: {
      x: 2720,
      y: 418,
      w: 34,
      h: 52,
      characterId: "track"
    },
    exit: { x: 2920, y: 350, w: 24, h: 120 }
  },
  {
    id: "principal",
    name: "校長室",
    type: "boss",
    worldWidth: 2200,
    playerSpawn: { x: 120, y: 380 },
    background: {
      sky: "#e8d7ff",
      floor: "#8f7aa8",
      detail: "#f6eeff",
      banner: "#b42318"
    },
    introText: "最後の校長室。救出した仲間の力を借りて校長を止めよう。",
    clearText: "校長を倒して学校を救った。",
    platforms: [
      { x: 0, y: 470, w: 680, h: 70 },
      { x: 760, y: 470, w: 620, h: 70 },
      { x: 1480, y: 470, w: 720, h: 70 },
      { x: 980, y: 370, w: 100, h: 18 },
      { x: 1160, y: 310, w: 100, h: 18 }
    ],
    hazards: [
      { x: 700, y: 446, w: 40, h: 24, type: "spikes" },
      { x: 1400, y: 446, w: 40, h: 24, type: "spikes" }
    ],
    enemies: [],
    coins: [
      { x: 1010, y: 330, r: 10, collected: false },
      { x: 1190, y: 270, r: 10, collected: false }
    ],
    gimmicks: [
      {
        type: "hiddenPlatform",
        requiredSkill: "platformReveal",
        hint: "美術部なら校長室の隠し足場を見抜ける。",
        platform: { x: 720, y: 340, w: 90, h: 16 }
      }
    ],
    boss: {
      x: 1760,
      y: 390,
      w: 64,
      h: 80,
      minX: 1540,
      maxX: 2080,
      dir: -1,
      speed: 1.5,
      hp: 8,
      attackCooldown: 100,
      attackTimer: 90,
      dashCooldown: 180,
      dashTimer: 140,
      invulnerableTimer: 0
    }
  }
];

const player = {
  x: 0,
  y: 0,
  w: 36,
  h: 52,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
  attackTimer: 0,
  attackCooldown: 0,
  invulnerableTimer: 0
};

const gameState = {
  cameraX: 0,
  lives: INITIAL_LIVES,
  coins: 0,
  mode: "playing",
  stageIndex: 0,
  unlockedCharacters: ["freshman"],
  rescuedCharacters: [],
  currentCharacterId: "freshman",
  rescueComplete: false,
  endingTimer: 0,
  messageFrames: 0
};

let currentStage = null;
let bossProjectiles = [];

function cloneStage(stageTemplate) {
  return structuredClone(stageTemplate);
}

function getCurrentCharacter() {
  return CHARACTERS[gameState.currentCharacterId];
}

function getWorldWidth() {
  return currentStage.worldWidth;
}

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

function setStatus(message, duration = MAX_MESSAGE_FRAMES) {
  statusTextEl.textContent = message;
  gameState.messageFrames = duration;
}

function getActivePlatforms() {
  const platforms = [...currentStage.platforms];
  const currentCharacter = getCurrentCharacter();

  for (const gimmick of currentStage.gimmicks) {
    if (gimmick.type === "hiddenPlatform") {
      if (currentCharacter.skill === gimmick.requiredSkill) {
        platforms.push(gimmick.platform);
      }
    }
  }

  return platforms;
}

function getBlockingDoors() {
  const doors = [];

  for (const gimmick of currentStage.gimmicks) {
    if (gimmick.type === "switchDoor" && !gimmick.active) {
      doors.push(gimmick.door);
    }
    if (gimmick.type === "speedGate" && !gimmick.active) {
      doors.push({ x: gimmick.x, y: gimmick.y - 60, w: gimmick.w, h: 100 });
    }
  }

  return doors;
}

function resetPlayerPosition() {
  player.x = currentStage.playerSpawn.x;
  player.y = currentStage.playerSpawn.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.attackTimer = 0;
}

function resetStageState() {
  currentStage = cloneStage(STAGES[gameState.stageIndex]);
  bossProjectiles = [];
  gameState.rescueComplete = false;
  gameState.mode = "playing";
  resetPlayerPosition();
  setStatus(currentStage.introText);
  updateHud();
}

function resetGame() {
  gameState.cameraX = 0;
  gameState.lives = INITIAL_LIVES;
  gameState.coins = 0;
  gameState.mode = "playing";
  gameState.stageIndex = 0;
  gameState.unlockedCharacters = ["freshman"];
  gameState.rescuedCharacters = [];
  gameState.currentCharacterId = "freshman";
  gameState.rescueComplete = false;
  gameState.endingTimer = 0;
  resetStageState();
}

function loseLife(reason) {
  if (gameState.mode !== "playing") {
    return;
  }

  if (player.invulnerableTimer > 0) {
    return;
  }

  gameState.lives -= 1;

  if (gameState.lives <= 0) {
    gameState.lives = 0;
    gameState.mode = "gameover";
    setStatus(`${reason} ゲームオーバー。Rで再挑戦。`, 999999);
  } else {
    resetPlayerPosition();
    player.invulnerableTimer = 60;
    setStatus(`${reason} スタート地点に戻った。`);
  }

  updateHud();
}

function unlockCharacter(characterId) {
  if (!gameState.unlockedCharacters.includes(characterId)) {
    gameState.unlockedCharacters.push(characterId);
  }

  if (!gameState.rescuedCharacters.includes(characterId)) {
    gameState.rescuedCharacters.push(characterId);
  }
}

function advanceStage() {
  if (gameState.stageIndex >= STAGES.length - 1) {
    gameState.mode = "ending";
    gameState.endingTimer = 300;
    setStatus("学校は救われた。新しい学園生活の始まりだ。", 999999);
    updateHud();
    return;
  }

  gameState.stageIndex += 1;
  resetStageState();
}

function switchCharacter() {
  if (gameState.mode !== "playing" || !player.onGround || gameState.unlockedCharacters.length <= 1) {
    return;
  }

  const currentIndex = gameState.unlockedCharacters.indexOf(gameState.currentCharacterId);
  const nextIndex = (currentIndex + 1) % gameState.unlockedCharacters.length;
  gameState.currentCharacterId = gameState.unlockedCharacters[nextIndex];
  setStatus(`${getCurrentCharacter().name} に交代した。`, 120);
  updateHud();
}

function updateHud() {
  stageNameEl.textContent = currentStage.name;
  heroNameEl.textContent = getCurrentCharacter().name;
  rescuedCountEl.textContent = `${gameState.rescuedCharacters.length} / ${RESCUE_CHARACTER_TOTAL}`;
  coinCountEl.textContent = String(gameState.coins);
  lifeCountEl.textContent = String(gameState.lives);

  const hasBoss = currentStage.type === "boss" && currentStage.boss && currentStage.boss.hp > 0;
  bossPanelEl.hidden = !hasBoss;
  if (hasBoss) {
    bossHpEl.textContent = String(currentStage.boss.hp);
  }
}

function getAttackHitbox() {
  return {
    x: player.facing === 1 ? player.x + player.w : player.x - ATTACK_RANGE,
    y: player.y + 14,
    w: ATTACK_RANGE,
    h: ATTACK_HEIGHT
  };
}

function tryAttack() {
  if (gameState.mode !== "playing") {
    return;
  }

  if (player.attackCooldown > 0 || player.attackTimer > 0) {
    return;
  }

  player.attackTimer = ATTACK_DURATION;
  player.attackCooldown = ATTACK_COOLDOWN;
}

function tryJump() {
  if (!player.onGround || gameState.mode !== "playing") {
    return;
  }

  player.vy = -getCurrentCharacter().jumpPower;
  player.onGround = false;
}

function clearInputState() {
  keys.clear();
  for (const binding of holdButtonBindings) {
    binding.element.classList.remove("is-active");
  }
}

function bindHoldButton(element, code) {
  const release = (event) => {
    if (event) {
      event.preventDefault();
    }
    keys.delete(code);
    element.classList.remove("is-active");
  };

  element.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    keys.add(code);
    element.classList.add("is-active");
  });
  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
  element.addEventListener("pointerleave", release);

  holdButtonBindings.push({ element, code });
}

function bindActionButton(element, handler) {
  const release = (event) => {
    if (event) {
      event.preventDefault();
    }
    element.classList.remove("is-active");
  };

  element.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    element.classList.add("is-active");
    handler();
  });
  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
  element.addEventListener("pointerleave", release);
}

function updateOrientationHint() {
  const portrait = window.innerHeight > window.innerWidth;
  orientationHintEl.hidden = !portrait;
}

function updatePlayer() {
  const currentCharacter = getCurrentCharacter();
  const moveLeft = keys.has("ArrowLeft") || keys.has("KeyA");
  const moveRight = keys.has("ArrowRight") || keys.has("KeyD");

  player.vx = 0;
  if (moveLeft) {
    player.vx = -currentCharacter.moveSpeed;
    player.facing = -1;
  }
  if (moveRight) {
    player.vx = currentCharacter.moveSpeed;
    player.facing = 1;
  }

  player.x += player.vx;
  resolveHorizontalCollisions();

  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);
  player.y += player.vy;
  player.onGround = false;
  resolveVerticalCollisions();

  if (player.attackTimer > 0) {
    player.attackTimer -= 1;
  }
  if (player.attackCooldown > 0) {
    player.attackCooldown -= 1;
  }
  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer -= 1;
  }
  if (gameState.messageFrames > 0) {
    gameState.messageFrames -= 1;
    if (gameState.messageFrames === 0 && gameState.mode === "playing") {
      statusTextEl.textContent = currentStage.type === "boss"
        ? "校長を倒して学校を救え。"
        : gameState.rescueComplete
          ? "出口へ向かおう。"
          : "捕まっている仲間を探そう。";
    }
  }

  if (player.y > WORLD_HEIGHT + 120) {
    loseLife("落下した。");
  }
}

function resolveHorizontalCollisions() {
  const colliders = [...getActivePlatforms(), ...getBlockingDoors()];

  for (const platform of colliders) {
    if (!rectsOverlap(player, platform)) {
      continue;
    }

    if (player.vx > 0) {
      player.x = platform.x - player.w;
    } else if (player.vx < 0) {
      player.x = platform.x + platform.w;
    }
  }

  player.x = Math.max(0, Math.min(player.x, getWorldWidth() - player.w));
}

function resolveVerticalCollisions() {
  const colliders = [...getActivePlatforms(), ...getBlockingDoors()];

  for (const platform of colliders) {
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
  for (let i = currentStage.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = currentStage.enemies[i];
    enemy.x += enemy.dir * enemy.speed;
    if (enemy.x <= enemy.minX || enemy.x + enemy.w >= enemy.maxX) {
      enemy.dir *= -1;
    }

    if (player.attackTimer > 0 && rectsOverlap(getAttackHitbox(), enemy)) {
      currentStage.enemies.splice(i, 1);
      setStatus("敵を追い払った。", 90);
      continue;
    }

    if (rectsOverlap(player, enemy)) {
      loseLife("敵にぶつかった。");
    }
  }
}

function updateHazards() {
  for (const hazard of currentStage.hazards) {
    if (rectsOverlap(player, hazard)) {
      loseLife(hazard.type === "acid" ? "薬品に触れた。" : "トゲに当たった。");
    }
  }
}

function updateCoins() {
  for (const coin of currentStage.coins) {
    if (coin.collected) {
      continue;
    }

    if (circleRectOverlap({ x: coin.x, y: coin.y, r: coin.r }, player)) {
      coin.collected = true;
      gameState.coins += 1;
      setStatus("コインを回収した。", 80);
      updateHud();
    }
  }
}

function updateGimmicks() {
  const currentCharacter = getCurrentCharacter();

  for (const gimmick of currentStage.gimmicks) {
    if (gimmick.type === "switchDoor" && !gimmick.active) {
      const buttonRect = { x: gimmick.x, y: gimmick.y, w: gimmick.w, h: gimmick.h };
      if (rectsOverlap(player, buttonRect)) {
        if (currentCharacter.skill === gimmick.requiredSkill) {
          gimmick.active = true;
          setStatus("科学部がロックを解除した。", 150);
        } else {
          setStatus(gimmick.hint, 120);
        }
      }
    }

    if (gimmick.type === "speedGate" && !gimmick.active) {
      const gateRect = { x: gimmick.x, y: gimmick.y, w: gimmick.w, h: gimmick.h };
      if (rectsOverlap(player, gateRect)) {
        if (currentCharacter.skill === gimmick.requiredSkill || Math.abs(player.vx) >= 5) {
          gimmick.active = true;
          setStatus("勢いでゲートを突破した。", 120);
        } else {
          setStatus(gimmick.hint, 120);
        }
      }
    }
  }
}

function updateRescueTarget() {
  if (currentStage.type !== "rescue" || gameState.rescueComplete) {
    return;
  }

  const target = currentStage.rescueTarget;
  if (rectsOverlap(player, target)) {
    gameState.rescueComplete = true;
    unlockCharacter(target.characterId);
    setStatus(`${CHARACTERS[target.characterId].name} を救出した。出口へ向かおう。`, 180);
    updateHud();
  }
}

function updateExit() {
  if (currentStage.type !== "rescue" || !gameState.rescueComplete) {
    return;
  }

  if (rectsOverlap(player, currentStage.exit)) {
    setStatus(currentStage.clearText, 120);
    advanceStage();
  }
}

function spawnBossProjectile() {
  const boss = currentStage.boss;
  const direction = player.x < boss.x ? -1 : 1;
  bossProjectiles.push({
    x: boss.x + boss.w / 2,
    y: boss.y + 22,
    w: 18,
    h: 18,
    vx: direction * 4.5
  });
}

function updateBoss() {
  if (currentStage.type !== "boss" || !currentStage.boss || currentStage.boss.hp <= 0) {
    return;
  }

  const boss = currentStage.boss;
  boss.x += boss.dir * boss.speed;
  if (boss.x <= boss.minX || boss.x + boss.w >= boss.maxX) {
    boss.dir *= -1;
  }

  boss.attackTimer -= 1;
  boss.dashTimer -= 1;
  if (boss.invulnerableTimer > 0) {
    boss.invulnerableTimer -= 1;
  }

  if (boss.attackTimer <= 0) {
    spawnBossProjectile();
    boss.attackTimer = boss.attackCooldown;
  }

  if (boss.dashTimer <= 0) {
    boss.dir = player.x < boss.x ? -1 : 1;
    boss.x += boss.dir * 24;
    boss.dashTimer = boss.dashCooldown;
  }

  if (player.attackTimer > 0 && boss.invulnerableTimer === 0 && rectsOverlap(getAttackHitbox(), boss)) {
    boss.hp -= getCurrentCharacter().attackPower;
    boss.invulnerableTimer = 20;
    setStatus("校長にダメージ。", 70);
    if (boss.hp <= 0) {
      boss.hp = 0;
      gameState.mode = "ending";
      gameState.endingTimer = 360;
      setStatus("校長を倒した。学校に平和が戻った。", 999999);
    }
    updateHud();
  }

  if (rectsOverlap(player, boss)) {
    loseLife("校長の体当たりを受けた。");
  }
}

function updateBossProjectiles() {
  for (let i = bossProjectiles.length - 1; i >= 0; i -= 1) {
    const projectile = bossProjectiles[i];
    projectile.x += projectile.vx;

    if (player.attackTimer > 0 && rectsOverlap(getAttackHitbox(), projectile)) {
      bossProjectiles.splice(i, 1);
      continue;
    }

    if (rectsOverlap(player, projectile)) {
      bossProjectiles.splice(i, 1);
      loseLife("校長の書類攻撃が当たった。");
      continue;
    }

    if (projectile.x < gameState.cameraX - 80 || projectile.x > getWorldWidth() + 80) {
      bossProjectiles.splice(i, 1);
    }
  }
}

function updateCamera() {
  const target = player.x - canvas.width * 0.35;
  gameState.cameraX = Math.max(0, Math.min(target, getWorldWidth() - canvas.width));
}

function drawBackground() {
  const bg = currentStage.background;
  ctx.fillStyle = bg.sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = bg.detail;
  for (let i = 0; i < 5; i += 1) {
    const width = 120 + i * 10;
    const offset = (gameState.cameraX * 0.12 + i * 210) % (canvas.width + 200);
    ctx.fillRect(canvas.width - offset, 56 + i * 24, width, 26);
  }

  ctx.fillStyle = bg.banner;
  ctx.fillRect(0, 18, canvas.width, 18);

  ctx.fillStyle = bg.floor;
  ctx.fillRect(0, 430, canvas.width, 110);

  ctx.fillStyle = "rgba(31, 45, 61, 0.12)";
  for (let i = 0; i < canvas.width; i += 120) {
    ctx.fillRect(i, 440, 56, 90);
  }
}

function drawWorldRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - gameState.cameraX), Math.round(y), w, h);
}

function drawPlatforms() {
  const activePlatforms = getActivePlatforms();
  for (const platform of activePlatforms) {
    drawWorldRect(platform.x, platform.y, platform.w, platform.h, "#6d8f4e");
    drawWorldRect(platform.x, platform.y, platform.w, Math.min(10, platform.h), "#9dc46b");
  }
}

function drawGimmicks() {
  for (const gimmick of currentStage.gimmicks) {
    if (gimmick.type === "hiddenPlatform") {
      if (getCurrentCharacter().skill !== gimmick.requiredSkill) {
        drawWorldRect(gimmick.platform.x, gimmick.platform.y, gimmick.platform.w, gimmick.platform.h, "rgba(176, 125, 255, 0.18)");
      }
    }

    if (gimmick.type === "switchDoor") {
      drawWorldRect(gimmick.x, gimmick.y, gimmick.w, gimmick.h, gimmick.active ? "#7bd389" : "#36b6b2");
      if (!gimmick.active) {
        drawWorldRect(gimmick.door.x, gimmick.door.y, gimmick.door.w, gimmick.door.h, "#305f72");
      }
    }

    if (gimmick.type === "speedGate" && !gimmick.active) {
      drawWorldRect(gimmick.x, gimmick.y - 60, gimmick.w, 100, "#ff7a59");
    }
  }
}

function drawHazards() {
  for (const hazard of currentStage.hazards) {
    const drawX = hazard.x - gameState.cameraX;
    ctx.fillStyle = hazard.type === "acid" ? "#2a9d8f" : "#c43c3c";
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
  for (const enemy of currentStage.enemies) {
    const drawX = enemy.x - gameState.cameraX;
    ctx.fillStyle = enemy.type === "runner" ? "#ff7a59" : "#6c3eb8";
    ctx.fillRect(drawX, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(drawX + 6, enemy.y + 8, 6, 6);
    ctx.fillRect(drawX + 22, enemy.y + 8, 6, 6);
  }
}

function drawCoins() {
  for (const coin of currentStage.coins) {
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

function drawRescueTarget() {
  if (currentStage.type !== "rescue" || gameState.rescueComplete) {
    return;
  }

  const target = currentStage.rescueTarget;
  const rescuedCharacter = CHARACTERS[target.characterId];
  const drawX = target.x - gameState.cameraX;
  ctx.fillStyle = rescuedCharacter.color;
  ctx.fillRect(drawX, target.y, target.w, target.h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(drawX + 10, target.y + 10, 6, 6);
  ctx.fillRect(drawX + 18, target.y + 10, 6, 6);
}

function drawExit() {
  if (currentStage.type !== "rescue" || !gameState.rescueComplete) {
    return;
  }

  drawWorldRect(currentStage.exit.x, currentStage.exit.y, currentStage.exit.w, currentStage.exit.h, "#f94144");
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(currentStage.exit.x + currentStage.exit.w - gameState.cameraX, currentStage.exit.y, 50, 24);
}

function drawBoss() {
  if (currentStage.type !== "boss" || !currentStage.boss || currentStage.boss.hp <= 0) {
    return;
  }

  const boss = currentStage.boss;
  const drawX = boss.x - gameState.cameraX;
  ctx.fillStyle = boss.invulnerableTimer > 0 ? "#ffb4af" : "#b42318";
  ctx.fillRect(drawX, boss.y, boss.w, boss.h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(drawX + 14, boss.y + 16, 8, 8);
  ctx.fillRect(drawX + 42, boss.y + 16, 8, 8);
}

function drawBossProjectiles() {
  for (const projectile of bossProjectiles) {
    drawWorldRect(projectile.x, projectile.y, projectile.w, projectile.h, "#ffffff");
    drawWorldRect(projectile.x + 4, projectile.y + 4, 10, 10, "#b42318");
  }
}

function drawPlayer() {
  const drawX = player.x - gameState.cameraX;
  const currentCharacter = getCurrentCharacter();

  ctx.globalAlpha = player.invulnerableTimer > 0 && player.invulnerableTimer % 6 < 3 ? 0.35 : 1;
  ctx.fillStyle = currentCharacter.color;
  ctx.fillRect(drawX, player.y, player.w, player.h);
  ctx.fillStyle = "#1f2d3d";
  const eyeX = player.facing === 1 ? drawX + 22 : drawX + 8;
  ctx.fillRect(eyeX, player.y + 12, 6, 6);

  if (player.attackTimer > 0) {
    const attack = getAttackHitbox();
    drawWorldRect(attack.x, attack.y, attack.w, attack.h, "rgba(255, 209, 102, 0.55)");
  }

  ctx.globalAlpha = 1;
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

  let title = "一時停止";
  if (gameState.mode === "gameover") {
    title = "Game Over";
  }
  if (gameState.mode === "ending") {
    title = "School Saved";
  }

  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "24px Trebuchet MS";
  const subtitle = gameState.mode === "gameover"
    ? "Press R to restart"
    : "R でもう一度最初から遊べる";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 26);
}

function render() {
  drawBackground();
  drawPlatforms();
  drawGimmicks();
  drawHazards();
  drawCoins();
  drawEnemies();
  drawRescueTarget();
  drawExit();
  drawBoss();
  drawBossProjectiles();
  drawPlayer();
  drawOverlay();
}

function tick() {
  if (gameState.mode === "playing") {
    updatePlayer();
    updateGimmicks();
    updateEnemies();
    updateHazards();
    updateCoins();
    updateRescueTarget();
    updateExit();
    updateBoss();
    updateBossProjectiles();
    updateCamera();
  } else if (gameState.mode === "ending" && gameState.endingTimer > 0) {
    gameState.endingTimer -= 1;
  }

  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyC", "KeyF"].includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === "KeyR") {
    resetGame();
    return;
  }

  if (event.code === "KeyC") {
    switchCharacter();
    return;
  }

  if (event.code === "KeyF") {
    tryAttack();
    return;
  }

  const jumpPressed = event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW";
  if (jumpPressed) {
    tryJump();
  }

  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("blur", clearInputState);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInputState();
  }
});

bindHoldButton(touchLeftEl, "ArrowLeft");
bindHoldButton(touchRightEl, "ArrowRight");
bindActionButton(touchJumpEl, tryJump);
bindActionButton(touchAttackEl, tryAttack);
bindActionButton(touchSwitchEl, switchCharacter);

updateOrientationHint();
window.addEventListener("resize", updateOrientationHint);
window.addEventListener("orientationchange", updateOrientationHint);

resetGame();
tick();
