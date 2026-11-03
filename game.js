const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const starCountEl = document.getElementById('starCount');
const mountNameEl = document.getElementById('mountName');
const gameTitleEl = document.getElementById('gameTitle');
const gameEditionEl = document.getElementById('gameEdition');
const screenMessage = document.getElementById('screenMessage');
const screenTitle = document.getElementById('screenTitle');
const screenText = document.getElementById('screenText');

const world = {
  width: 1200,
  height: 760,
};

const keys = new Set();
const touchButtons = document.querySelectorAll('[data-key]');

for (const button of touchButtons) {
  const key = button.dataset.key;
  const setKey = (active) => {
    if (active) keys.add(key);
    else keys.delete(key);
  };

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (key === 'KeyE') {
      swapMount();
      return;
    }
    button.setPointerCapture?.(e.pointerId);
    setKey(true);
  });
  button.addEventListener('pointerup', () => setKey(false));
  button.addEventListener('pointercancel', () => setKey(false));
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyE' && !event.repeat) {
    event.preventDefault();
    swapMount();
  }
  if (event.code === 'KeyR' && !event.repeat) resetGame();
  keys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

const state = {
  time: 0,
  stars: 0,
  totalStars: 6,
  win: false,
  phase: 'playing',
  noticeTimer: 0,
  mounted: 'Bootin’',
  mountIndex: 0,
  campfire: { x: 1050, y: 640, r: 48 },
  player: {
    x: 180,
    y: 520,
    vx: 0,
    vy: 0,
    radius: 20,
    speed: 240,
  },
  starsList: [
    { x: 210, y: 160, r: 12 },
    { x: 332, y: 315, r: 12 },
    { x: 520, y: 198, r: 12 },
    { x: 660, y: 390, r: 12 },
    { x: 840, y: 220, r: 12 },
    { x: 975, y: 120, r: 12 },
  ],
  obstacles: [
    { x: 260, y: 460, w: 120, h: 170 },
    { x: 432, y: 335, w: 180, h: 140 },
    { x: 615, y: 500, w: 190, h: 140 },
    { x: 845, y: 360, w: 210, h: 160 },
  ],
};

const mounts = [
  { name: 'Bootin’', title: 'Rootin’ Tootin’ Bootin’', edition: 'Black Version · Bootin’s wild west', color: '#f2e7d0', patch: '#a94e31', muzzle: '#e9c9a0', boot: '#a44d30', hat: '#8b452d', trail: 'rgba(255, 194, 103, 0.45)' },
  { name: 'Chewy', title: 'What the Hell, Chewy?', edition: 'White Version · Chewy’s wild west', color: '#332522', patch: '#b57850', muzzle: '#b57850', boot: '#c88a4e', hat: '#26201d', trail: 'rgba(139, 211, 255, 0.38)' },
];

function swapMount() {
  state.mountIndex = (state.mountIndex + 1) % mounts.length;
  const pup = mounts[state.mountIndex];
  state.mounted = pup.name;
  mountNameEl.textContent = state.mounted;
  gameTitleEl.textContent = pup.title;
  gameEditionEl.textContent = pup.edition;
}

function setMessage(title, text, visible = true, duration = 0) {
  screenTitle.textContent = title;
  screenText.textContent = text;
  state.noticeTimer = duration;
  screenMessage.classList.toggle('visible', visible);
}

function resetGame() {
  state.stars = 0;
  state.win = false;
  state.phase = 'playing';
  state.noticeTimer = 0;
  state.player.x = 180;
  state.player.y = 520;
  state.player.vx = 0;
  state.player.vy = 0;
  state.mountIndex = 0;
  state.starsList = [
    { x: 210, y: 160, r: 12 },
    { x: 332, y: 315, r: 12 },
    { x: 520, y: 198, r: 12 },
    { x: 660, y: 390, r: 12 },
    { x: 840, y: 220, r: 12 },
    { x: 975, y: 120, r: 12 },
  ];
  state.mounted = mounts[0].name;
  starCountEl.textContent = `0 / ${state.totalStars}`;
  mountNameEl.textContent = state.mounted;
  gameTitleEl.textContent = mounts[0].title;
  gameEditionEl.textContent = mounts[0].edition;
  setMessage('Welcome to the Frontier', 'Ride through the canyon, gather the legendary sparks, and return to camp before sundown.', false);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rectCircleCollide(rect, circle) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function update(dt) {
  if (state.phase === 'ended') return;
  if (state.noticeTimer > 0) {
    state.noticeTimer -= dt;
    if (state.noticeTimer <= 0) screenMessage.classList.remove('visible');
  }

  const moveX = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
  const moveY = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);

  const length = Math.hypot(moveX, moveY) || 1;
  const vx = (moveX / length) * state.player.speed;
  const vy = (moveY / length) * state.player.speed;

  let nextX = state.player.x + vx * dt;
  let nextY = state.player.y + vy * dt;

  const radius = state.player.radius;

  for (const obstacle of state.obstacles) {
    const hit = rectCircleCollide(obstacle, { x: nextX, y: nextY, radius });
    if (hit) {
      const prevX = state.player.x;
      const prevY = state.player.y;
      const candidateX = state.player.x + vx * dt;
      const candidateY = state.player.y + vy * dt;
      const safeX = rectCircleCollide(obstacle, { x: candidateX, y: prevY, radius }) ? state.player.x : candidateX;
      const safeY = rectCircleCollide(obstacle, { x: prevX, y: candidateY, radius }) ? state.player.y : candidateY;
      nextX = safeX;
      nextY = safeY;
    }
  }

  const previousX = state.player.x;
  const previousY = state.player.y;
  state.player.x = clamp(nextX, radius + 10, world.width - radius - 10);
  state.player.y = clamp(nextY, radius + 10, world.height - radius - 10);
  state.player.vx = (state.player.x - previousX) / dt;
  state.player.vy = (state.player.y - previousY) / dt;

  for (let i = state.starsList.length - 1; i >= 0; i--) {
    const star = state.starsList[i];
    const dist = Math.hypot(state.player.x - star.x, state.player.y - star.y);
    if (dist < star.r + state.player.radius + 8) {
      state.starsList.splice(i, 1);
      state.stars += 1;
      starCountEl.textContent = `${state.stars} / ${state.totalStars}`;
      if (state.stars >= state.totalStars) {
        setMessage('Treat trail complete!', 'You found all six golden treats! Bring Bootin’ and Chewy back to the ranch campfire.', true, 2.4);
      }
    }
  }

  const campDist = Math.hypot(state.player.x - state.campfire.x, state.player.y - state.campfire.y);
  if (campDist < 58 && state.stars >= state.totalStars && !state.win) {
    state.win = true;
    state.phase = 'ended';
    setMessage('Good dogs. Great legends.', 'Bootin’ and Chewy saved the ranch! Press R to run the trail again, or E to switch editions.', true);
  }

  if (campDist < 58 && state.stars < state.totalStars) {
    const treatsLeft = state.totalStars - state.stars;
    setMessage('Campfire ahead', `You still need ${treatsLeft} golden treat${treatsLeft === 1 ? '' : 's'}. Sniff out the rest!`, true, 1.8);
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, world.height);
  sky.addColorStop(0, '#8eb495');
  sky.addColorStop(0.42, '#e4cb89');
  sky.addColorStop(0.7, '#c98856');
  sky.addColorStop(1, '#744638');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, world.width, world.height);

  // Distant mesas and warm afternoon sun.
  ctx.fillStyle = '#f6d991';
  ctx.beginPath();
  ctx.arc(1030, 105, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9b6b50';
  ctx.beginPath();
  ctx.moveTo(0, 320); ctx.lineTo(110, 210); ctx.lineTo(186, 212); ctx.lineTo(270, 320);
  ctx.lineTo(360, 185); ctx.lineTo(450, 185); ctx.lineTo(540, 320);
  ctx.lineTo(650, 235); ctx.lineTo(760, 235); ctx.lineTo(875, 320);
  ctx.lineTo(990, 185); ctx.lineTo(1080, 185); ctx.lineTo(1200, 315);
  ctx.lineTo(1200, 525); ctx.lineTo(0, 525); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b77b53';
  ctx.beginPath();
  ctx.moveTo(0, 370); ctx.lineTo(150, 280); ctx.lineTo(250, 300); ctx.lineTo(365, 430);
  ctx.lineTo(470, 290); ctx.lineTo(580, 280); ctx.lineTo(720, 425);
  ctx.lineTo(840, 305); ctx.lineTo(950, 315); ctx.lineTo(1080, 430);
  ctx.lineTo(1200, 340); ctx.lineTo(1200, 610); ctx.lineTo(0, 610); ctx.closePath(); ctx.fill();

  // Sandy trail winding between sandstone outcrops.
  ctx.fillStyle = '#e2b875';
  ctx.beginPath();
  ctx.moveTo(0, 580); ctx.bezierCurveTo(250, 500, 300, 610, 475, 540);
  ctx.bezierCurveTo(650, 470, 730, 585, 850, 500);
  ctx.bezierCurveTo(1000, 410, 1060, 520, 1200, 440);
  ctx.lineTo(1200, 565); ctx.bezierCurveTo(1030, 640, 975, 545, 865, 640);
  ctx.bezierCurveTo(710, 735, 620, 610, 480, 675);
  ctx.bezierCurveTo(300, 750, 230, 635, 0, 710); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120, 71, 48, 0.2)'; ctx.lineWidth = 3;
  ctx.setLineDash([12, 14]);
  ctx.beginPath(); ctx.moveTo(0, 645); ctx.bezierCurveTo(260, 565, 310, 690, 480, 610);
  ctx.bezierCurveTo(655, 540, 735, 655, 870, 565); ctx.bezierCurveTo(1025, 475, 1080, 585, 1200, 510); ctx.stroke();
  ctx.setLineDash([]);

  // Scrub, cacti and scattered stones add landmarks to the trail.
  for (let i = 0; i < 23; i++) {
    const x = (i * 193 + 71) % world.width;
    const y = 330 + ((i * 97) % 310);
    if (state.obstacles.some((o) => x > o.x - 35 && x < o.x + o.w + 35 && y > o.y - 35 && y < o.y + o.h + 35)) continue;
    ctx.fillStyle = i % 2 ? '#6d8149' : '#887a43';
    ctx.beginPath(); ctx.ellipse(x, y, 15 + i % 7, 7 + i % 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4d633e';
    ctx.beginPath(); ctx.ellipse(x + 7, y - 5, 4, 9, 0.25, 0, Math.PI * 2); ctx.fill();
  }

  // Ranch settlement at the finish line.
  ctx.fillStyle = '#5c372b';
  ctx.fillRect(1000, 590, 150, 72);
  ctx.fillStyle = '#d7ae6f';
  ctx.fillRect(1010, 600, 130, 62);
  ctx.fillStyle = '#703f32';
  ctx.beginPath(); ctx.moveTo(990, 601); ctx.lineTo(1075, 548); ctx.lineTo(1160, 601); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#63392e';
  ctx.fillRect(1058, 620, 28, 42);
  ctx.fillStyle = '#efcf86';
  ctx.font = '12px "DM Mono", monospace';
  ctx.fillText('RANCH', 1038, 614);

  // Natural frame vignette.
  const shade = ctx.createRadialGradient(600, 370, 290, 600, 370, 760);
  shade.addColorStop(0, 'rgba(39, 25, 20, 0)');
  shade.addColorStop(1, 'rgba(39, 25, 20, 0.28)');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, world.width, world.height);
}

function drawCampfire() {
  const { x, y, r } = state.campfire;
  ctx.fillStyle = '#1a120f';
  ctx.beginPath();
  ctx.arc(x, y + 12, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f0b556';
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + state.time * 1.4;
    const flameR = r * 0.55 + Math.sin(state.time * 8 + i) * 4;
    const px = x + Math.cos(angle) * flameR;
    const py = y - 10 + Math.sin(angle) * flameR;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTreat(treat) {
  const pulse = 1 + Math.sin(state.time * 5 + treat.x) * 0.12;
  ctx.save();
  ctx.translate(treat.x, treat.y);
  ctx.rotate(Math.sin(state.time * 2 + treat.y) * 0.12);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ffe49a';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#ffd45f';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#a76432';
  ctx.beginPath();
  ctx.roundRect(-10, -5, 20, 10, 4);
  ctx.fill();
  ctx.stroke();
  for (const x of [-10, 10]) {
    ctx.beginPath(); ctx.arc(x, -6, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, 6, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#fff5cb';
  ctx.beginPath(); ctx.arc(-3, -1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawObstacles() {
  ctx.fillStyle = '#8f5d3b';
  for (const obstacle of state.obstacles) {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    ctx.fillStyle = '#6b3d2c';
    ctx.fillRect(obstacle.x + 12, obstacle.y + 12, obstacle.w - 24, 10);
    ctx.fillStyle = '#8f5d3b';
  }
}

function drawPlayer() {
  const pup = mounts[state.mountIndex];
  const p = state.player;
  const moving = Math.hypot(p.vx, p.vy) > 10;
  const bounce = moving ? Math.sin(state.time * 17) * 2.5 : Math.sin(state.time * 3) * 1.2;
  ctx.save();
  ctx.translate(p.x, p.y + bounce);

  // Soft shadow under the little cowboy.
  ctx.fillStyle = 'rgba(42, 26, 19, 0.28)';
  ctx.beginPath(); ctx.ellipse(0, 24, 43, 13, 0, 0, Math.PI * 2); ctx.fill();

  // Four tiny boots, heel and spur details.
  ctx.fillStyle = pup.boot;
  for (const x of [-25, 16]) {
    ctx.fillRect(x, 15, 13, 22);
    ctx.fillStyle = '#e6bf72'; ctx.fillRect(x + 2, 29, 11, 3);
    ctx.fillStyle = pup.boot;
  }
  ctx.fillStyle = '#d7bd79';
  ctx.fillRect(-28, 19, 4, 5); ctx.fillRect(25, 19, 4, 5);

  // Long-bodied pup, built as clean layered shapes.
  ctx.fillStyle = pup.color;
  ctx.beginPath(); ctx.ellipse(-1, 5, 37, 22, -0.06, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pup.patch;
  ctx.beginPath(); ctx.ellipse(-15, 2, 18, 20, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pup.color;
  ctx.beginPath(); ctx.ellipse(22, -8, 21, 19, 0.12, 0, Math.PI * 2); ctx.fill();

  // Floppy ears, muzzle and shiny nose.
  ctx.fillStyle = pup.patch;
  ctx.beginPath(); ctx.ellipse(31, -22, 9, 17, -0.55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pup.color;
  ctx.beginPath(); ctx.ellipse(44, -15, 15, 11, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pup.muzzle;
  ctx.beginPath(); ctx.ellipse(51, -12, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#211a19';
  ctx.beginPath(); ctx.arc(56, -15, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff1d2';
  ctx.beginPath(); ctx.arc(36, -19, 3.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#211a19';
  ctx.beginPath(); ctx.arc(37, -19, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#76523a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(48, -5); ctx.quadraticCurveTo(55, 1, 61, -5); ctx.stroke();

  // Scout's bandana and comically oversized ten-gallon hat.
  ctx.fillStyle = state.mountIndex === 0 ? '#bd5035' : '#58a7bf';
  ctx.beginPath(); ctx.moveTo(20, -1); ctx.lineTo(39, 3); ctx.lineTo(27, 11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = pup.hat;
  ctx.beginPath(); ctx.ellipse(37, -34, 25, 5, -0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(24, -48, 27, 14);
  ctx.fillStyle = '#e4b85e'; ctx.fillRect(24, -39, 27, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(28, -45, 4, 5);

  ctx.restore();
}

function render() {
  drawBackground();
  drawCampfire();
  drawObstacles();
  for (const treat of state.starsList) drawTreat(treat);
  drawPlayer();
}

let last = 0;
function tick(timestamp) {
  const dt = Math.min((timestamp - last) / 1000 || 0.016, 0.032);
  last = timestamp;
  state.time += dt;
  update(dt);
  render();
  requestAnimationFrame(tick);
}

resetGame();
requestAnimationFrame(tick);
