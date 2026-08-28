// ─── Estado ───────────────────────────────────────────────────
let isShaking = false;
let shakeFrameId = null;
let shakeStartTime = null;
let currentM = 0;

// Sismógrafo
let seismoOffset = 0;
let seismoData = [];

const slider       = document.getElementById('magnitudeSlider');
const sliderValue  = document.getElementById('sliderValue');
const magnitudeNum = document.getElementById('magnitudeNumber');
const houseWrapper = document.getElementById('houseWrapper');
const groundEl     = document.getElementById('ground');
const startBtn     = document.getElementById('startBtn');
const stopBtn      = document.getElementById('stopBtn');
const seismoCanvas = document.getElementById('seismograph2');
const seismoCtx    = seismoCanvas.getContext('2d');

// ─── Dados de intensidade por faixa ──────────────────────────
const INTENSITY_LEVELS = [
  { min: 0,   max: 2.0, label: 'Sem Atividade',  color: '#4CAF50',  badgeBg: 'rgba(76,175,80,0.15)',  badgeBorder: 'rgba(76,175,80,0.4)'  },
  { min: 2.0, max: 4.0, label: 'Menor',           color: '#8BC34A',  badgeBg: 'rgba(139,195,74,0.15)', badgeBorder: 'rgba(139,195,74,0.4)' },
  { min: 4.0, max: 5.0, label: 'Leve',            color: '#FFC107',  badgeBg: 'rgba(255,193,7,0.15)',  badgeBorder: 'rgba(255,193,7,0.4)'  },
  { min: 5.0, max: 6.0, label: 'Moderado',        color: '#FF9800',  badgeBg: 'rgba(255,152,0,0.15)',  badgeBorder: 'rgba(255,152,0,0.4)'  },
  { min: 6.0, max: 7.0, label: 'Forte',           color: '#FF5722',  badgeBg: 'rgba(255,87,34,0.15)',  badgeBorder: 'rgba(255,87,34,0.4)'  },
  { min: 7.0, max: 9.1, label: 'Devastador',      color: '#F44336',  badgeBg: 'rgba(244,67,54,0.15)',  badgeBorder: 'rgba(244,67,54,0.4)'  },
];

// ─── Parâmetros de tremor por magnitude ─────────────────────
function getShakeParams(M) {
  if (M < 2.0) return { amplitude: 0,  frequency: 0  };
  if (M < 3.0) return { amplitude: 1.5, frequency: 3  };
  if (M < 4.0) return { amplitude: 4,  frequency: 5  };
  if (M < 5.0) return { amplitude: 9,  frequency: 8  };
  if (M < 6.0) return { amplitude: 18, frequency: 12 };
  if (M < 7.0) return { amplitude: 34, frequency: 18 };
  if (M < 8.0) return { amplitude: 55, frequency: 25 };
  return               { amplitude: 80, frequency: 35 };
}

// ─── Imagem da casa por magnitude ────────────────────────────
function getHouseImage(M) {
  if (M <= 3.0) return 'images/img.jpeg';
  if (M <= 5.5) return 'images/img2.jpeg';
  if (M <= 7.5) return 'images/img3.jpeg';
  return               'images/img4.jpeg';
}

// ─── Nível de intensidade ─────────────────────────────────────
function getLevel(M) {
  return INTENSITY_LEVELS.find(l => M >= l.min && M < l.max)
      || INTENSITY_LEVELS[INTENSITY_LEVELS.length - 1];
}

// ─── Atualiza UI ──────────────────────────────────────────────
function updateUI(M) {
  currentM = M;

  // Número de magnitude
  magnitudeNum.textContent = M.toFixed(1);

  // Troca background-image da casa conforme a magnitude
  const newSrc = getHouseImage(M);
  const currentBg = houseWrapper.style.backgroundImage;
  if (!currentBg.includes(newSrc.replace('images/', ''))) {
    houseWrapper.style.backgroundImage = `url('${newSrc}')`;
  }

  // Efeito de tela
  document.body.classList.remove('shaking-low', 'shaking-medium', 'shaking-high');
  if (isShaking) {
    if (M >= 7) document.body.classList.add('shaking-high');
    else if (M >= 5) document.body.classList.add('shaking-medium');
    else if (M >= 3) document.body.classList.add('shaking-low');
  }
}

// ─── Animação de tremor ───────────────────────────────────────
function shakeLoop(timestamp) {
  if (!shakeStartTime) shakeStartTime = timestamp;
  const t = (timestamp - shakeStartTime) / 1000;

  const { amplitude, frequency } = getShakeParams(currentM);

  if (amplitude === 0) {
    stopShaking();
    return;
  }

  // Onda composta para parecer terremoto real
  const wave1 = Math.sin(t * frequency * Math.PI * 2);
  const wave2 = Math.sin(t * frequency * 1.73 * Math.PI * 2) * 0.4;
  const wave3 = Math.sin(t * frequency * 0.47 * Math.PI * 2) * 0.2;
  const shake = (wave1 + wave2 + wave3) * amplitude;

  // Move a casa apenas na vertical
  houseWrapper.style.transform = `translateY(${shake}px)`;

  // Chão também reage, mas com menor amplitude
  groundEl.style.transform = `translateY(${shake * 0.25}px)`;

  // Alimenta o sismógrafo
  seismoData.push(shake);
  if (seismoData.length > seismoCanvas.width) {
    seismoData.shift();
  }
  drawSeismograph();

  shakeFrameId = requestAnimationFrame(shakeLoop);
}

// ─── Inicia tremor ────────────────────────────────────────────
function startShaking() {
  if (isShaking) return;
  const M = parseFloat(slider.value);
  if (M < 2.0) {
    return;
  }

  isShaking = true;
  shakeStartTime = null;

  startBtn.disabled = true;
  stopBtn.disabled  = false;
  slider.disabled   = false; // permite ajuste durante o tremor

  updateUI(M);
  shakeFrameId = requestAnimationFrame(shakeLoop);
}

// ─── Para tremor
function stopShaking() {
  isShaking = false;
  shakeStartTime = null;

  if (shakeFrameId) {
    cancelAnimationFrame(shakeFrameId);
    shakeFrameId = null;
  }

  // Retorna casa e chão à posição original suavemente
  houseWrapper.style.transition = 'transform 0.4s ease-out';
  groundEl.style.transition     = 'transform 0.4s ease-out';
  houseWrapper.style.transform  = 'translateY(0)';
  groundEl.style.transform      = 'translateY(0)';

  setTimeout(() => {
    houseWrapper.style.transition = '';
    groundEl.style.transition     = '';
  }, 400);

  document.body.classList.remove('shaking-low', 'shaking-medium', 'shaking-high');

  startBtn.disabled = false;
  stopBtn.disabled  = true;
}

// ─── Sismógrafo ───────────────────────────────────────────────
function renderSeismo(ctx, W, H) {
  const midY = H / 2;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0, 20, 10, 0.8)';
  ctx.fillRect(0, 0, W, H);

  // Grade
  ctx.strokeStyle = 'rgba(0, 180, 80, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (H / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Linha central
  ctx.strokeStyle = 'rgba(0, 180, 80, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(W, midY);
  ctx.stroke();

  if (seismoData.length < 2) return;

  const maxAmplitude = Math.max(...seismoData.map(Math.abs), 1);
  const scaleY = (midY - 4) / maxAmplitude;

  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 4;
  ctx.shadowColor = '#00E676';
  ctx.beginPath();

  seismoData.forEach((val, i) => {
    const x = (i / (W - 1)) * W;
    const y = midY - val * scaleY;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawSeismograph() {
  renderSeismo(seismoCtx, seismoCanvas.width, seismoCanvas.height);
}

function drawSeismographIdle() {
  const W = seismoCanvas.width;
  const H = seismoCanvas.height;
  const midY = H / 2;
  seismoCtx.clearRect(0, 0, W, H);
  seismoCtx.fillStyle = 'rgba(0, 20, 10, 0.8)';
  seismoCtx.fillRect(0, 0, W, H);
  seismoCtx.strokeStyle = 'rgba(0, 180, 80, 0.1)';
  seismoCtx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (H / 4) * i;
    seismoCtx.beginPath(); seismoCtx.moveTo(0, y); seismoCtx.lineTo(W, y); seismoCtx.stroke();
  }
  seismoCtx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
  seismoCtx.lineWidth = 1.5;
  seismoCtx.beginPath();
  seismoCtx.moveTo(0, midY);
  seismoCtx.lineTo(W, midY);
  seismoCtx.stroke();
}


// ─── Modo Mouse ───────────────────────────────────────────────
let mouseModeActive = false;
let lastMouseX = null;
let lastMouseY = null;
let mouseMagnitude = 0;
let mouseDecayId = null;

const mouseBtn  = document.getElementById('mouseBtn');

function startMouseMode() {
  mouseModeActive = true;
  lastMouseX = null;
  lastMouseY = null;
  mouseMagnitude = parseFloat(slider.value);

  mouseBtn.classList.add('active');
  document.body.classList.add('mouse-mode-active');

  // Start decay loop (quando mouse parado, cai devagar)
  startMouseDecay();

  // If not already shaking, start
  if (!isShaking) {
    isShaking = true;
    shakeStartTime = null;
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    shakeFrameId = requestAnimationFrame(shakeLoop);
  }
}

function stopMouseMode() {
  mouseModeActive = false;
  lastMouseX = null;
  lastMouseY = null;

  mouseBtn.classList.remove('active');
  document.body.classList.remove('mouse-mode-active');

  if (mouseDecayId) {
    clearInterval(mouseDecayId);
    mouseDecayId = null;
  }
}

function startMouseDecay() {
  if (mouseDecayId) clearInterval(mouseDecayId);
  mouseDecayId = setInterval(() => {
    if (!mouseModeActive) return;
    // Cai 0.05 por tick (a cada 50ms = ~1 por segundo)
    mouseMagnitude = Math.max(0, mouseMagnitude - 0.05);
    syncMouseMagnitude();

    if (mouseMagnitude <= 0 && isShaking) {
      stopShaking();
    }
  }, 50);
}

function syncMouseMagnitude() {
  const M = Math.min(9, Math.max(0, mouseMagnitude));
  slider.value = M;
  sliderValue.textContent = M.toFixed(1);
  updateUI(M);
}

// Movimento do mouse: velocidade (qualquer direção) aumenta magnitude
document.addEventListener('mousemove', (e) => {
  if (!mouseModeActive) return;

  if (lastMouseX === null) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    return;
  }

  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  const speed = Math.sqrt(dx * dx + dy * dy); // distância percorrida

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  // Cada pixel de movimento = +0.003 de magnitude
  const sensitivity = 0.003;
  mouseMagnitude += speed * sensitivity;
  mouseMagnitude = Math.min(9, Math.max(0, mouseMagnitude));

  // Se magnitude subiu acima de 2 e não está tremendo, inicia
  if (mouseMagnitude >= 2 && !isShaking) {
    isShaking = true;
    shakeStartTime = null;
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    shakeFrameId = requestAnimationFrame(shakeLoop);
  }

  syncMouseMagnitude();
});

// ─── Event Listeners ──────────────────────────────────────────
slider.addEventListener('input', () => {
  const M = parseFloat(slider.value);
  sliderValue.textContent = M.toFixed(1);
  updateUI(M);
});

startBtn.addEventListener('click', startShaking);
stopBtn.addEventListener('click', () => {
  if (mouseModeActive) stopMouseMode();
  stopShaking();
});
mouseBtn.addEventListener('click', () => {
  if (mouseModeActive) {
    stopMouseMode();
  } else {
    startMouseMode();
  }
});

// ─── Drawer ───────────────────────────────────────────────────
const drawer        = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');

function openDrawer() {
  drawer.classList.add('open');
  drawerOverlay.classList.add('visible');
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('visible');
}

document.getElementById('menuBtn').addEventListener('click', openDrawer);
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// ─── Histórico de Terremotos ──────────────────────────────────
function triggerHistoricalQuake(mag) {
  if (mouseModeActive) stopMouseMode();
  if (isShaking) stopShaking();

  // Atualiza slider (limitado ao max 9) e magnitude interna
  slider.value = Math.min(9, mag);
  currentM = mag;
  magnitudeNum.textContent = mag.toFixed(1);

  const newSrc = getHouseImage(mag);
  houseWrapper.style.backgroundImage = `url('${newSrc}')`;

  document.body.classList.remove('shaking-low', 'shaking-medium', 'shaking-high');
  if (mag >= 7) document.body.classList.add('shaking-high');
  else if (mag >= 5) document.body.classList.add('shaking-medium');
  else if (mag >= 3) document.body.classList.add('shaking-low');

  closeDrawer();

  setTimeout(() => {
    isShaking = true;
    shakeStartTime = null;
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    shakeFrameId = requestAnimationFrame(shakeLoop);
  }, 320);
}

document.querySelectorAll('.quake-item').forEach(item => {
  const mag = parseFloat(item.dataset.magnitude);
  item.addEventListener('click', () => triggerHistoricalQuake(mag));
});

// ─── Init ─────────────────────────────────────────────────────
drawSeismographIdle();
updateUI(0);
