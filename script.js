const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const message = document.querySelector('#message');
const messageKicker = document.querySelector('.message-kicker');
const messageTitle = document.querySelector('.message h2');
const messageText = document.querySelector('.message p:not(.message-kicker)');
const startButton = document.querySelector('#start-button');
const coinCount = document.querySelector('#coin-count');
const livesText = document.querySelector('#lives');
const checkpointText = document.querySelector('#checkpoint');
const gameTimeText = document.querySelector('#game-time');
const powerStatusText = document.querySelector('#power-status');
const ammoCountText = document.querySelector('#ammo-count');
const stageNumberText = document.querySelector('#stage-number');

const WORLD_WIDTH = 4300;
const keys = new Set();
let gameState = 'ready';
let cameraX = 0;
let coins = 0;
let lives = 3;
let lastTime = 0;
let audioContext;
let checkpointIndex = -1;
let elapsedTime = 0;
let jumpWasPressed = false;
let stageNumber = 1;
let weaponAmmo = 0;
let shotCooldown = 0;
const bullets = [];

const player = { x: 100, y: 380, width: 30, height: 42, baseWidth: 30, baseHeight: 42, vx: 0, vy: 0, onGround: false, jumpCount: 0, facing: 1, invincibleUntil: 0, giantUntil: 0 };
const platforms = [
  { x: 0, y: 470, width: 480, height: 70 }, { x: 600, y: 410, width: 260, height: 130 },
  { x: 980, y: 330, width: 270, height: 210 }, { x: 1370, y: 430, width: 290, height: 110 },
  { x: 1780, y: 360, width: 330, height: 180 }, { x: 2230, y: 450, width: 310, height: 90 },
  { x: 2660, y: 300, width: 340, height: 240 }, { x: 3120, y: 400, width: 320, height: 140 },
  { x: 3560, y: 330, width: 340, height: 210 }, { x: 4000, y: 420, width: 300, height: 120 }
];
const coinItems = [
  [180, 410], [700, 350], [1100, 270], [1470, 370], [1900, 300], [2380, 410], [2800, 250], [3260, 360], [3700, 280], [4120, 380]
].map(([x, y]) => ({ x, y, collected: false }));
const powerItems = [
  { x: 390, y: 390, type: 'shield', collected: false },
  { x: 1810, y: 370, type: 'giant', collected: false },
  { x: 2850, y: 250, type: 'shield', collected: false }
];
const weaponItems = [
  { x: 900, y: 370, collected: false }, { x: 2600, y: 340, collected: false }, { x: 3800, y: 300, collected: false }
];
const enemies = [
  { x: 300, y: 434, baseY: 434, width: 30, height: 36, min: 120, max: 430, vx: 1, type: 'walker' },
  { x: 1870, y: 324, baseY: 324, width: 30, height: 36, min: 1810, max: 2050, vx: 1.2, type: 'runner' },
  { x: 3190, y: 372, baseY: 372, width: 34, height: 28, min: 3150, max: 3380, vx: 1, type: 'drone' }
];
const movingPlatforms = [
  { x: 730, y: 450, width: 100, height: 18, startX: 730, min: 730, max: 920, vx: 1.4 },
  { x: 2110, y: 420, width: 100, height: 18, startX: 2110, min: 2110, max: 2300, vx: 1.2 },
  { x: 3560, y: 360, width: 120, height: 18, startX: 3560, min: 3500, max: 3730, vx: 1.5 }
];
const spikes = [
  { x: 410, y: 446, width: 44, height: 24 }, { x: 1180, y: 306, width: 44, height: 24 },
  { x: 1530, y: 406, width: 52, height: 24 }, { x: 2940, y: 276, width: 44, height: 24 },
  { x: 3370, y: 376, width: 52, height: 24 }
];
const springs = [
  { x: 720, y: 382, width: 34, height: 28 }, { x: 2380, y: 422, width: 34, height: 28 },
  { x: 3260, y: 372, width: 34, height: 28 }
];
const checkpoints = [{ x: 1900, y: 280 }, { x: 3260, y: 320 }];
const goal = { x: 4050, y: 330, width: 34, height: 90 };
const stageTwo = {
  platforms: [{ x: 0, y: 470, width: 520, height: 70 }, { x: 650, y: 400, width: 260, height: 140 }, { x: 1040, y: 320, width: 240, height: 220 }, { x: 1410, y: 430, width: 360, height: 110 }, { x: 1900, y: 350, width: 280, height: 190 }, { x: 2310, y: 450, width: 300, height: 90 }, { x: 2750, y: 300, width: 350, height: 240 }, { x: 3240, y: 410, width: 330, height: 130 }, { x: 3700, y: 330, width: 600, height: 210 }],
  coins: [[220, 410], [760, 340], [1130, 270], [1510, 370], [2010, 300], [2430, 410], [2880, 250], [3400, 360], [3900, 280]],
  enemies: [{ x: 360, y: 434, baseY: 434, width: 30, height: 36, min: 200, max: 480, vx: 1.4, type: 'walker' }, { x: 1500, y: 394, baseY: 394, width: 30, height: 36, min: 1430, max: 1730, vx: 1.2, type: 'runner' }, { x: 3310, y: 374, baseY: 374, width: 34, height: 28, min: 3260, max: 3520, vx: 1.5, type: 'drone' }],
  movingPlatforms: [{ x: 520, y: 440, width: 110, height: 18, startX: 520, min: 520, max: 720, vx: 1.6 }, { x: 1770, y: 400, width: 110, height: 18, startX: 1770, min: 1770, max: 1990, vx: 1.5 }, { x: 3570, y: 360, width: 120, height: 18, startX: 3570, min: 3500, max: 3760, vx: 1.7 }],
  spikes: [{ x: 455, y: 446, width: 44, height: 24 }, { x: 1180, y: 296, width: 44, height: 24 }, { x: 1660, y: 406, width: 52, height: 24 }, { x: 2110, y: 326, width: 44, height: 24 }, { x: 3010, y: 276, width: 52, height: 24 }, { x: 3480, y: 386, width: 44, height: 24 }],
  springs: [{ x: 770, y: 372, width: 34, height: 28 }, { x: 1530, y: 402, width: 34, height: 28 }, { x: 2860, y: 272, width: 34, height: 28 }],
  checkpoints: [{ x: 2050, y: 260 }, { x: 3350, y: 320 }],
  goalX: 4050,
  goalY: 240
};
const stageOne = { platforms: platforms.map((platform) => ({ ...platform })), coins: coinItems.map((coin) => ({ x: coin.x, y: coin.y, collected: false })), enemies: enemies.map((enemy) => ({ ...enemy })), movingPlatforms: movingPlatforms.map((platform) => ({ ...platform })), spikes: spikes.map((spike) => ({ ...spike })), springs: springs.map((spring) => ({ ...spring })), checkpoints: checkpoints.map((checkpoint) => ({ ...checkpoint })), goalX: goal.x, goalY: goal.y };

function resetPlayer() { const respawn = checkpointIndex >= 0 ? checkpoints[checkpointIndex] : { x: 100, y: 380 }; player.x = respawn.x; player.y = respawn.y; player.vx = 0; player.vy = 0; player.jumpCount = 0; cameraX = Math.max(0, player.x - 280); }
function loadStage(stage) { const data = stage === 1 ? stageOne : stageTwo; platforms.splice(0, platforms.length, ...data.platforms.map((platform) => ({ ...platform }))); coinItems.splice(0, coinItems.length, ...(stage === 1 ? data.coins.map((coin) => ({ ...coin, collected: false })) : data.coins.map(([x, y]) => ({ x, y, collected: false })))); enemies.splice(0, enemies.length, ...data.enemies.map((enemy) => ({ ...enemy }))); movingPlatforms.splice(0, movingPlatforms.length, ...data.movingPlatforms.map((platform) => ({ ...platform }))); spikes.splice(0, spikes.length, ...data.spikes.map((spike) => ({ ...spike }))); springs.splice(0, springs.length, ...data.springs.map((spring) => ({ ...spring }))); checkpoints.splice(0, checkpoints.length, ...data.checkpoints.map((checkpoint) => ({ ...checkpoint }))); goal.x = data.goalX; goal.y = data.goalY; }
function startGame() { gameState = 'playing'; loadStage(1); stageNumber = 1; coins = 0; lives = 3; checkpointIndex = -1; elapsedTime = 0; jumpWasPressed = false; weaponAmmo = 0; bullets.length = 0; powerItems.forEach((item) => { item.collected = false; }); weaponItems.forEach((item) => { item.collected = false; }); player.invincibleUntil = 0; player.giantUntil = 0; coinItems.forEach((coin) => { coin.collected = false; }); enemies.forEach((enemy) => { enemy.x = enemy.min; }); movingPlatforms.forEach((platform) => { platform.x = platform.startX; }); resetPlayer(); updateHud(); startAudio(); message.classList.add('hidden'); }
function showMessage(kicker, title, text, buttonText) { messageKicker.textContent = kicker; messageTitle.textContent = title; messageText.textContent = text; startButton.textContent = buttonText; message.classList.remove('hidden'); }
function updateHud() { coinCount.textContent = coins; livesText.textContent = lives; checkpointText.textContent = checkpointIndex >= 0 ? checkpointIndex + 1 : '-'; stageNumberText.textContent = stageNumber; ammoCountText.textContent = weaponAmmo || '-'; const totalSeconds = Math.floor(elapsedTime); gameTimeText.textContent = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`; const shieldLeft = Math.max(0, player.invincibleUntil - elapsedTime); const giantLeft = Math.max(0, player.giantUntil - elapsedTime); powerStatusText.textContent = shieldLeft > 0 ? `無敵 ${Math.ceil(shieldLeft)}s` : giantLeft > 0 ? `巨大 ${Math.ceil(giantLeft)}s` : '---'; }
function overlaps(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
function startAudio() { if (!audioContext) audioContext = new AudioContext(); if (audioContext.state === 'suspended') audioContext.resume(); }
function sound(frequency, duration = .1, type = 'square') { if (!audioContext) return; const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.18, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration); }
function shoot() { if (gameState !== 'playing' || weaponAmmo <= 0 || shotCooldown > 0) return; weaponAmmo -= 1; shotCooldown = .18; bullets.push({ x: player.facing === 1 ? player.x + player.width : player.x - 12, y: player.y + player.height * .45, width: 14, height: 5, vx: player.facing * 12 }); sound(740, .08, 'sawtooth'); updateHud(); }

function update(delta) {
  const speed = 4.4;
  elapsedTime += delta / 60;
  shotCooldown = Math.max(0, shotCooldown - delta / 60);
  updateHud();
  const isGiant = elapsedTime < player.giantUntil;
  player.width = isGiant ? 42 : player.baseWidth;
  player.height = isGiant ? 58 : player.baseHeight;
  movingPlatforms.forEach((platform) => { platform.x += platform.vx * delta; if (platform.x < platform.min || platform.x > platform.max) platform.vx *= -1; });
  if (keys.has('ArrowLeft') || keys.has('a')) { player.vx = -speed; player.facing = -1; }
  else if (keys.has('ArrowRight') || keys.has('d')) { player.vx = speed; player.facing = 1; }
  else player.vx *= .78;
  const jumpPressed = (keys.has(' ') || keys.has('w') || keys.has('ArrowUp')) && !jumpWasPressed;
  jumpWasPressed = keys.has(' ') || keys.has('w') || keys.has('ArrowUp');
  if (jumpPressed && player.jumpCount < 2) { player.vy = player.jumpCount === 0 ? -12 : -10; player.onGround = false; player.jumpCount += 1; sound(player.jumpCount === 2 ? 380 : 280, .12); }
  player.vy += .55 * delta;
  player.x += player.vx * delta;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
  const previousBottom = player.y + player.height;
  player.y += player.vy * delta;
  player.onGround = false;
  for (const platform of [...platforms, ...movingPlatforms]) {
    if (player.x + player.width > platform.x && player.x < platform.x + platform.width && player.y + player.height >= platform.y && player.y + player.height <= platform.y + 24 && player.vy >= 0) {
      player.y = platform.y - player.height; player.vy = 0; player.onGround = true; player.jumpCount = 0; if (movingPlatforms.includes(platform)) player.x += platform.vx * delta;
    }
  }
  if (player.y > canvas.height + 80) loseLife();
  bullets.forEach((bullet) => { bullet.x += bullet.vx * delta; });
  for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) { const bullet = bullets[bulletIndex]; if (bullet.x < 0 || bullet.x > WORLD_WIDTH) bullets.splice(bulletIndex, 1); }
  for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
    const enemy = enemies[enemyIndex];
    const enemySpeed = enemy.type === 'runner' ? 1.8 : enemy.type === 'drone' ? 1.3 : 1;
    enemy.x += enemy.vx * enemySpeed * delta;
    if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
    if (enemy.type === 'drone') enemy.y = enemy.baseY + Math.sin(elapsedTime * 4 + enemy.x) * 28;
    if (!overlaps(player, enemy)) continue;
    const isStomping = player.vy > 0 && previousBottom <= enemy.y + 10;
    if (isStomping) {
      enemies.splice(enemyIndex, 1);
      player.y = enemy.y - player.height;
      player.vy = -9;
      player.jumpCount = 1;
      sound(260, .12, 'square');
    } else {
      loseLife();
    }
  }
  for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) { const bullet = bullets[bulletIndex]; const hit = enemies.findIndex((enemy) => overlaps(bullet, enemy)); if (hit >= 0) { enemies.splice(hit, 1); bullets.splice(bulletIndex, 1); sound(180, .16, 'square'); } }
  spikes.forEach((spike) => { if (overlaps(player, spike)) loseLife(); });
  springs.forEach((spring) => { if (overlaps(player, spring) && player.vy >= 0) { player.y = spring.y - player.height; player.vy = -17; sound(520, .2, 'sine'); } });
  checkpoints.forEach((checkpoint, index) => { if (player.x > checkpoint.x && checkpointIndex < index) { checkpointIndex = index; updateHud(); sound(700, .25, 'sine'); } });
  coinItems.forEach((coin) => { if (!coin.collected && overlaps(player, { x: coin.x - 10, y: coin.y - 10, width: 20, height: 20 })) { coin.collected = true; coins += 1; updateHud(); sound(880, .1, 'sine'); } });
  powerItems.forEach((item) => { if (!item.collected && overlaps(player, { x: item.x - 16, y: item.y - 16, width: 32, height: 32 })) { item.collected = true; if (item.type === 'shield') player.invincibleUntil = elapsedTime + 8; else player.giantUntil = elapsedTime + 8; sound(item.type === 'shield' ? 620 : 220, .35, 'sawtooth'); updateHud(); } });
  weaponItems.forEach((item) => { if (!item.collected && overlaps(player, { x: item.x - 17, y: item.y - 17, width: 34, height: 34 })) { item.collected = true; weaponAmmo += 8; sound(960, .25, 'square'); updateHud(); } });
  if (overlaps(player, goal)) { gameState = 'transition'; sound(660, .4, 'triangle'); if (stageNumber === 1) { showMessage('STAGE CLEAR!', 'ステージ 1 クリア', `コイン ${coins} 枚を集めました`, '次のステージへ'); window.setTimeout(nextStage, 1400); } else { showMessage('ALL CLEAR!', '全ステージクリア', `コイン ${coins} 枚を集めました`, '最初から遊ぶ'); } }
  cameraX += (Math.max(0, player.x - 280) - cameraX) * .12 * delta; cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraX));
}

function loseLife() { if (gameState !== 'playing' || elapsedTime < player.invincibleUntil) return; lives -= 1; updateHud(); sound(110, .25, 'sawtooth'); if (lives <= 0) { gameState = 'lost'; showMessage('GAME OVER', 'もう一度挑戦', '夕暮れの道はまだ続いている', 'リスタート'); } else resetPlayer(); }
function nextStage() { if (stageNumber !== 1) return; stageNumber = 2; loadStage(2); coins = 0; lives = 3; checkpointIndex = -1; elapsedTime = 0; weaponAmmo = 0; bullets.length = 0; powerItems.forEach((item) => { item.collected = false; }); weaponItems.forEach((item) => { item.collected = false; }); player.invincibleUntil = 0; player.giantUntil = 0; movingPlatforms.forEach((platform) => { platform.x = platform.startX; }); enemies.forEach((enemy) => { enemy.x = enemy.min; }); resetPlayer(); updateHud(); sound(520, .35, 'triangle'); message.classList.add('hidden'); gameState = 'playing'; }
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); drawBackground(); ctx.save(); ctx.translate(-cameraX, 0);
  platforms.forEach((platform) => { ctx.fillStyle = stageNumber === 1 ? '#132c3b' : '#21133f'; ctx.shadowBlur = stageNumber === 1 ? 8 : 18; ctx.shadowColor = stageNumber === 1 ? '#45f3ff' : '#ff4fd8'; if (stageNumber === 1) { ctx.fillRect(platform.x, platform.y, platform.width, platform.height); } else { ctx.beginPath(); ctx.moveTo(platform.x + 12, platform.y); ctx.lineTo(platform.x + platform.width, platform.y); ctx.lineTo(platform.x + platform.width - 14, platform.y + platform.height); ctx.lineTo(platform.x, platform.y + platform.height); ctx.closePath(); ctx.fill(); } ctx.shadowBlur = 0; ctx.fillStyle = stageNumber === 1 ? '#45f3ff' : '#ff4fd8'; ctx.fillRect(platform.x, platform.y, platform.width, 6); });
  movingPlatforms.forEach((platform) => { ctx.fillStyle = stageNumber === 1 ? '#ff4fd8' : '#45f3ff'; ctx.shadowBlur = 16; ctx.shadowColor = ctx.fillStyle; ctx.fillRect(platform.x, platform.y, platform.width, platform.height); ctx.shadowBlur = 0; ctx.fillStyle = '#d9f8ff'; ctx.fillRect(platform.x + 8, platform.y + 6, platform.width - 16, 4); });
  spikes.forEach((spike) => { ctx.fillStyle = '#20252b'; for (let x = spike.x; x < spike.x + spike.width; x += 14) { ctx.beginPath(); ctx.moveTo(x, spike.y + spike.height); ctx.lineTo(x + 7, spike.y); ctx.lineTo(x + 14, spike.y + spike.height); ctx.fill(); } });
  springs.forEach((spring) => { ctx.fillStyle = '#f4c95d'; ctx.fillRect(spring.x, spring.y + 10, spring.width, spring.height - 10); ctx.strokeStyle = '#20252b'; ctx.lineWidth = 3; ctx.strokeRect(spring.x + 4, spring.y, spring.width - 8, spring.height); });
  checkpoints.forEach((checkpoint, index) => { ctx.fillStyle = '#f5f0e6'; ctx.fillRect(checkpoint.x, checkpoint.y, 5, 80); ctx.fillStyle = checkpointIndex >= index ? '#f4c95d' : '#ef765d'; ctx.fillRect(checkpoint.x + 5, checkpoint.y, 30, 20); });
  powerItems.forEach((item) => { if (!item.collected) { const pulse = 1 + Math.sin(elapsedTime * 5 + item.x) * .12; ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(elapsedTime * (item.type === 'shield' ? 1 : -1)); ctx.scale(pulse, pulse); ctx.shadowBlur = 18; ctx.shadowColor = item.type === 'shield' ? '#45f3ff' : '#ff4fd8'; ctx.fillStyle = item.type === 'shield' ? '#45f3ff' : '#ff4fd8'; ctx.beginPath(); if (item.type === 'shield') { ctx.arc(0, 0, 13, 0, Math.PI * 2); } else { ctx.moveTo(0, -15); ctx.lineTo(13, 0); ctx.lineTo(0, 15); ctx.lineTo(-13, 0); } ctx.fill(); ctx.restore(); } });
  weaponItems.forEach((item) => { if (!item.collected) { ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(Math.sin(elapsedTime * 3 + item.x) * .12); ctx.shadowBlur = 20; ctx.shadowColor = '#ffe45c'; ctx.fillStyle = '#ffe45c'; ctx.fillRect(-15, -7, 30, 14); ctx.fillStyle = '#10182c'; ctx.fillRect(5, -3, 15, 6); ctx.restore(); } });
  coinItems.forEach((coin) => { if (!coin.collected) { const pulse = 1 + Math.sin(elapsedTime * 6 + coin.x) * .12; ctx.save(); ctx.translate(coin.x, coin.y); ctx.scale(pulse, pulse); ctx.fillStyle = '#f4c95d'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff0ae'; ctx.fillRect(-2, -5, 3, 8); ctx.restore(); } });
  bullets.forEach((bullet) => { ctx.shadowBlur = 14; ctx.shadowColor = '#45f3ff'; ctx.fillStyle = '#45f3ff'; ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); ctx.shadowBlur = 0; });
  enemies.forEach((enemy) => { const bob = Math.sin(elapsedTime * 5 + enemy.x) * 2; ctx.save(); ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height); ctx.scale(1 + Math.sin(elapsedTime * 5 + enemy.x) * .08, 1 - Math.sin(elapsedTime * 5 + enemy.x) * .08); ctx.fillStyle = enemy.type === 'drone' ? '#45f3ff' : enemy.type === 'runner' ? '#ffe45c' : '#ff4fd8'; if (enemy.type === 'drone') { ctx.rotate(Math.sin(elapsedTime * 5) * .1); ctx.fillRect(-enemy.width / 2, -enemy.height + bob, enemy.width, enemy.height); ctx.fillStyle = '#10182c'; ctx.fillRect(-4, -enemy.height + 8 + bob, 8, 5); } else { ctx.fillRect(-enemy.width / 2, -enemy.height + bob, enemy.width, enemy.height); ctx.fillStyle = '#10182c'; ctx.fillRect(-9, -enemy.height + 10 + bob, 5, 5); ctx.fillRect(4, -enemy.height + 10 + bob, 5, 5); } ctx.restore(); });
  ctx.fillStyle = '#ef765d'; ctx.fillRect(goal.x, goal.y, 7, goal.height); ctx.fillStyle = '#f4c95d'; ctx.beginPath(); ctx.moveTo(goal.x + 7, goal.y); ctx.lineTo(goal.x + 45, goal.y + 16); ctx.lineTo(goal.x + 7, goal.y + 31); ctx.fill();
  const stride = player.onGround ? Math.sin(elapsedTime * 14) * Math.min(Math.abs(player.vx) / 4, 1) * 3 : 0; const squash = player.onGround ? 1 + Math.abs(player.vx) * .012 : .92; ctx.save(); ctx.translate(player.x + player.width / 2, player.y + player.height); ctx.scale(squash, 2 - squash); ctx.shadowBlur = 20; ctx.shadowColor = elapsedTime < player.invincibleUntil ? '#45f3ff' : elapsedTime < player.giantUntil ? '#ff4fd8' : '#45f3ff'; ctx.fillStyle = '#e8fbff'; ctx.fillRect(-player.width / 2, -player.height, player.width, player.height); ctx.shadowBlur = 0; ctx.fillStyle = '#ff4fd8'; ctx.fillRect(player.facing === 1 ? 5 : -12, -player.height + 10, 7, 7); ctx.fillStyle = '#10182c'; ctx.fillRect(-10, -4 + stride, 8, 4); ctx.fillRect(2, -4 - stride, 8, 4); ctx.restore(); ctx.restore();
}
function drawBackground() { const phase = Math.min(elapsedTime / 90, 1); const stageHue = stageNumber === 1 ? 172 : 266; ctx.fillStyle = `hsl(${stageHue - phase * 45}, ${stageNumber === 1 ? 48 : 58}%, ${66 - phase * 36}%)`; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = stageNumber === 1 ? '#183b4b' : '#321853'; for (let index = -1; index < 8; index += 1) { const x = index * 180 - (cameraX * .18 % 180); ctx.beginPath(); if (stageNumber === 1) { ctx.moveTo(x, 350); ctx.lineTo(x + 90, 180); ctx.lineTo(x + 210, 350); } else { ctx.moveTo(x, 350); ctx.lineTo(x + 70, 230); ctx.lineTo(x + 130, 280); ctx.lineTo(x + 210, 150); ctx.lineTo(x + 250, 350); } ctx.fill(); } if (stageNumber === 2) { ctx.strokeStyle = 'rgba(69, 243, 255, .2)'; ctx.lineWidth = 1; for (let line = 0; line < 8; line += 1) { const y = 340 + line * 28; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y - 80); ctx.stroke(); } } const celestialX = 130 + (elapsedTime % 90) / 90 * 700; ctx.fillStyle = phase < .55 ? '#fff0ae' : '#f5f0e6'; ctx.beginPath(); ctx.arc(celestialX, 110 + phase * 60, 52, 0, Math.PI * 2); ctx.fill(); if (phase > .35) { ctx.fillStyle = `rgba(245, 240, 230, ${phase * .25})`; for (let index = 0; index < 12; index += 1) { ctx.fillRect((index * 97 + 40) % canvas.width, 80 + (index * 53) % 190, 2, 2); } } }
function loop(time) { const delta = Math.min((time - lastTime) / 16.67 || 1, 2); lastTime = time; if (gameState === 'playing') update(delta); draw(); requestAnimationFrame(loop); }

window.addEventListener('keydown', (event) => { const key = event.key.length === 1 ? event.key.toLowerCase() : event.key; keys.add(key); if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault(); if (key === 'r') startGame(); });
window.addEventListener('keyup', (event) => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
window.addEventListener('keydown', (event) => { if (event.key.toLowerCase() === 'f') shoot(); });
canvas.addEventListener('click', shoot);
startButton.addEventListener('click', startGame);
updateHud(); requestAnimationFrame(loop);