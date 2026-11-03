const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const catchCountEl = document.getElementById('catchCount');
const missionTextEl = document.getElementById('missionText');
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
    if (key === 'Space') {
      throwToy();
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
  if ((event.code === 'Space' || event.code === 'Enter') && !event.repeat) {
    event.preventDefault();
    throwToy();
  }
  keys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

const startingHotDogs = [
  { x: 205, y: 170, r: 22, phase: 0 },
  { x: 390, y: 260, r: 22, phase: 1.4 },
  { x: 650, y: 190, r: 22, phase: 2.8 },
  { x: 780, y: 310, r: 22, phase: 4.2 },
  { x: 960, y: 190, r: 22, phase: 5.6 },
  { x: 1050, y: 540, r: 22, phase: 0.8 },
];

const state = {
  time: 0,
  caught: 0,
  totalHotDogs: startingHotDogs.length,
  team: [],
  win: false,
  phase: 'playing',
  noticeTimer: 0,
  throwCooldown: 0,
  mounted: 'Bootin’',
  mountIndex: 0,
  facing: { x: 1, y: 0 },
  campfire: { x: 1050, y: 640, r: 48 },
  player: {
    x: 180,
    y: 520,
    vx: 0,
    vy: 0,
    radius: 20,
    speed: 240,
  },
  hotDogs: [],
  toys: [],
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

function updateHud() {
  catchCountEl.textContent = `${state.caught} / ${state.totalHotDogs}`;
  missionTextEl.textContent = state.caught === state.totalHotDogs
    ? 'All caught! Head back to the campfire with your hot-dog team.'
    : `Throw toys to catch hot dogs and add them to your team (${state.caught}/${state.totalHotDogs}).`;
}

function resetGame() {
  state.caught = 0;
  state.team = [];
  state.win = false;
  state.phase = 'playing';
  state.noticeTimer = 0;
  state.throwCooldown = 0;
  state.player.x = 180;
  state.player.y = 520;
  state.player.vx = 0;
  state.player.vy = 0;
  state.facing = { x: 1, y: 0 };
  state.toys = [];
  state.hotDogs = startingHotDogs.map((hotDog, index) => ({ ...hotDog, id: index, caught: false }));
  state.mountIndex = 0;
  state.mounted = mounts[0].name;
  updateHud();
  mountNameEl.textContent = state.mounted;
  gameTitleEl.textContent = mounts[0].title;
  gameEditionEl.textContent = mounts[0].edition;
  setMessage('Welcome to the Frontier', 'Find the roaming hot dogs, aim with your pup, and press Space to toss a squeaky toy. Catch the whole pack, then return to camp!', false);
}

function throwToy() {
  if (state.phase !== 'playing' || state.throwCooldown > 0) return;
  const { x, y } = state.player;
  const direction = state.facing;
  state.toys.push({
    x: x + direction.x * 36,
    y: y + direction.y * 36,
    vx: direction.x * 520,
    vy: direction.y * 520,
    life: 0.72,
    rotation: Math.atan2(direction.y, direction.x),
  });
  state.throwCooldown = 0.3;
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
  state.throwCooldown = Math.max(0, state.throwCooldown - dt);

  const moveX = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
  const moveY = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
  const length = Math.hypot(moveX, moveY) || 1;
  const vx = (moveX / length) * state.player.speed;
  const vy = (moveY / length) * state.player.speed;
  if (moveX || moveY) state.facing = { x: moveX / length, y: moveY / length };

  let nextX = state.player.x + vx * dt;
  let nextY = state.player.y + vy * dt;
  const radius = state.player.radius;
  for (const obstacle of state.obstacles) {
    if (rectCircleCollide(obstacle, { x: nextX, y: nextY, radius })) {
      const candidateX = state.player.x + vx * dt;
      const candidateY = state.player.y + vy * dt;
      nextX = rectCircleCollide(obstacle, { x: candidateX, y: state.player.y, radius }) ? state.player.x : candidateX;
      nextY = rectCircleCollide(obstacle, { x: nextX, y: candidateY, radius }) ? state.player.y : candidateY;
    }
  }

  const previousX = state.player.x;
  const previousY = state.player.y;
  state.player.x = clamp(nextX, radius + 10, world.width - radius - 10);
  state.player.y = clamp(nextY, radius + 10, world.height - radius - 10);
  state.player.vx = (state.player.x - previousX) / dt;
  state.player.vy = (state.player.y - previousY) / dt;

  for (const hotDog of state.hotDogs) {
    hotDog.x += Math.sin(state.time * 1.5 + hotDog.phase) * 9 * dt;
    hotDog.y += Math.cos(state.time * 1.2 + hotDog.phase) * 7 * dt;
  }

  for (let i = state.toys.length - 1; i >= 0; i--) {
    const toy = state.toys[i];
    toy.x += toy.vx * dt;
    toy.y += toy.vy * dt;
    toy.life -= dt;
    const target = state.hotDogs.find((hotDog) => !hotDog.caught && Math.hypot(toy.x - hotDog.x, toy.y - hotDog.y) < hotDog.r + 10);
    if (target) {
      target.caught = true;
      state.caught += 1;
      state.team.push(`Hot Dog ${state.caught}`);
      updateHud();
      state.toys.splice(i, 1);
      if (state.caught === state.totalHotDogs) {
        setMessage('The whole pack!', 'You caught every hot dog! Bring your new team back to the campfire.', true, 2.6);
      } else {
        setMessage('Gotcha!', `Hot Dog ${state.caught} joined your team!`, true, 1.3);
      }
      continue;
    }
    if (toy.life <= 0) state.toys.splice(i, 1);
  }

  const campDist = Math.hypot(state.player.x - state.campfire.x, state.player.y - state.campfire.y);
  if (campDist < 58 && state.caught === state.totalHotDogs && !state.win) {
    state.win = true;
    state.phase = 'ended';
    setMessage('A pack of legends!', `Bootin’ and Chewy brought all ${state.caught} hot dogs home! Press R to play again, or E to switch pups.`, true);
  } else if (campDist < 58 && state.caught < state.totalHotDogs && state.noticeTimer <= 0) {
    const left = state.totalHotDogs - state.caught;
    setMessage('Campfire ahead', `${left} hot dog${left === 1 ? '' : 's'} still out there. Catch them with your toys first!`, true, 1.8);
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

function drawHotDog(hotDog) {
  const bob = Math.sin(state.time * 4 + hotDog.phase) * 2;
  ctx.save();
  ctx.translate(hotDog.x, hotDog.y + bob);
  ctx.scale(1 + Math.sin(state.time * 3 + hotDog.phase) * 0.035, 1);
  ctx.shadowBlur = 12;
  ctx.shadowColor = 'rgba(255, 222, 125, 0.65)';
  // Toasted bun, sausage, and mustard make each roaming creature read as a hot dog.
  ctx.fillStyle = '#9b552d';
  ctx.beginPath(); ctx.ellipse(0, 7, 31, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c477';
  ctx.beginPath(); ctx.ellipse(0, 4, 28, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a93e32';
  ctx.beginPath(); ctx.roundRect(-25, -5, 45, 15, 8); ctx.fill();
  ctx.fillStyle = '#f5d451';
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#f5d451'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-11, 4); ctx.lineTo(-4, 0); ctx.lineTo(3, 4); ctx.lineTo(10, 0); ctx.stroke();
  // A tiny pup peeks out of the bun.
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#9b552d';
  ctx.beginPath(); ctx.ellipse(17, -10, 7, 12, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f1d3a0';
  ctx.beginPath(); ctx.ellipse(16, -12, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6e3828';
  ctx.beginPath(); ctx.ellipse(10, -19, 4, 8, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(21, -19, 4, 8, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#231715';
  ctx.beginPath(); ctx.arc(19, -13, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(25, -10, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawToy(toy) {
  ctx.save();
  ctx.translate(toy.x, toy.y);
  ctx.rotate(toy.rotation);
  ctx.fillStyle = '#8ed6d1';
  ctx.strokeStyle = '#235b5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-7, 0, 5, 0, Math.PI * 2);
  ctx.arc(7, 0, 5, 0, Math.PI * 2);
  ctx.roundRect(-8, -4, 16, 8, 4);
  ctx.fill(); ctx.stroke();
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
  if (state.facing.x < -0.25) ctx.scale(-1, 1);

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
  for (const hotDog of state.hotDogs) if (!hotDog.caught) drawHotDog(hotDog);
  for (const toy of state.toys) drawToy(toy);
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
