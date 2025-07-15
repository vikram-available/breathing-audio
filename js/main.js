// main.js

// Core DOM Elements
const roundInput = document.getElementById('roundInput');
const roundStatus = document.getElementById('roundStatus');
const circle = document.getElementById('circle');
const instruction = document.getElementById('instruction');
const timerDisplay = document.getElementById('timer');
const title = document.querySelector('h1');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const soundBtn = document.getElementById('soundToggle');
const audios = document.querySelectorAll('audio');

let soundOn = true;
let breathing = false;
let round = 1;
let startTime = null;
let timerInterval = null;
let targetRounds = null;
let currentEmotion = 'neutral';

// Audio Elements for breathing phases
const backgroundMusic = document.getElementById('backgroundMusic');
const chimeInhale = document.getElementById('chimeInhale');
const chimeHold = document.getElementById('chimeHold');
const chimeExhale = document.getElementById('chimeExhale');
const breathInhale = document.getElementById('breathInhale');
const breathExhale = document.getElementById('breathExhale');

// Emotion to Breathing Map
const breathingPatterns = {
  neutral: { inhale: 4000, hold: 7000, exhale: 8000 },   // 4-7-8
  happy: { inhale: 3000, hold: 3000, exhale: 3000 },     // 3-3-3
  sad: { inhale: 4000, hold: 4000, exhale: 4000 },       // box breathing
  angry: { inhale: 5000, hold: 2000, exhale: 6000 },     // calming style
  surprised: { inhale: 2000, hold: 2000, exhale: 2000 }  // rapid reset
};

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    timerDisplay.textContent = `Elapsed Time: ${m}m ${s}s`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerDisplay.textContent = 'Elapsed Time: 0m 0s';
}

function updateStatus() {
  const left = targetRounds - (round - 1);
  roundStatus.textContent = `Rounds left: ${left}`;
}

function toggleSound() {
  soundOn = !soundOn;
  audios.forEach(a => a.muted = !soundOn);
  soundBtn.textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) {
    backgroundMusic.play().catch(() => {});
  } else {
    backgroundMusic.pause();
  }
}

function getPattern() {
  return breathingPatterns[currentEmotion] || breathingPatterns['neutral'];
}

function playInhaleSound() {
  if (!soundOn) return;
  chimeInhale.currentTime = 0;
  chimeInhale.play().catch(() => {});
  breathInhale.currentTime = 0;
  breathInhale.play().catch(() => {});
}

function playHoldSound() {
  if (!soundOn) return;
  chimeHold.currentTime = 0;
  chimeHold.play().catch(() => {});
}

function playExhaleSound() {
  if (!soundOn) return;
  chimeExhale.currentTime = 0;
  chimeExhale.play().catch(() => {});
  breathExhale.currentTime = 0;
  breathExhale.play().catch(() => {});
}

async function breathingCycle() {
  document.body.classList.add('dark');
  startTimer();

  const val = parseInt(roundInput.value);
  targetRounds = (!isNaN(val) && val >= 1 && val <= 30) ? val : null;

  if (targetRounds) {
    roundStatus.style.opacity = '1';
    updateStatus();
  } else {
    document.getElementById('roundSelector').style.opacity = '0';
  }

  while (breathing) {
    if (targetRounds && round > targetRounds) break;

    const pattern = getPattern();

    // INHALE
    instruction.style.opacity = 0;
    await delay(800);
    instruction.textContent = `Round ${round}: Breathe In - ${pattern.inhale / 1000} seconds`;
    instruction.style.opacity = 1;
    circle.style.transform = 'scale(1.5)';
    circle.style.backgroundColor = '#10b981';
    playInhaleSound();
    await delay(pattern.inhale);
    if (!breathing) break;

    // HOLD
    instruction.style.opacity = 0;
    await delay(300);
    instruction.textContent = `Round ${round}: Hold - ${pattern.hold / 1000} seconds`;
    instruction.style.opacity = 1;
    circle.style.backgroundColor = '#facc15';
    playHoldSound();
    await delay(pattern.hold);
    if (!breathing) break;

    // EXHALE
    instruction.style.opacity = 0;
    await delay(300);
    instruction.textContent = `Round ${round}: Breathe Out - ${pattern.exhale / 1000} seconds`;
    instruction.style.opacity = 1;
    circle.style.transform = 'scale(1)';
    circle.style.backgroundColor = '#f87171';
    playExhaleSound();
    await delay(pattern.exhale);
    if (!breathing) break;

    const dot = document.createElement('span');
    dot.textContent = '●';
    dot.style.color = 'white';
    dot.style.fontSize = '1.5rem';
    document.getElementById('progress').appendChild(dot);

    round++;
    if (targetRounds) updateStatus();

    instruction.style.opacity = 0;
    await delay(300);
    instruction.textContent = `Get ready for round ${round}...`;
    instruction.style.opacity = 1;
    await delay(1000);
  }

  stopBreathing();
}

function startBreathing() {
  title.style.opacity = '0';
  startBtn.style.opacity = '0';
  if (soundOn) backgroundMusic.play().catch(() => {});
  if (!breathing) {
    breathing = true;
    breathingCycle();
  }
}

function stopBreathing() {
  title.style.opacity = '1';
  startBtn.style.opacity = '1';
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  document.getElementById('progress').innerHTML = '';
  round = 1;
  breathing = false;
  stopTimer();
  document.body.classList.remove('dark');
  document.getElementById('roundSelector').style.opacity = '1';
  roundStatus.style.opacity = '0';
}

// Start and Stop Event Listeners
startBtn.addEventListener('click', startBreathing);
stopBtn.addEventListener('click', stopBreathing);
soundBtn.addEventListener('click', toggleSound);

// Emotion Hook
window.setEmotion = (emotion) => {
  currentEmotion = emotion;
};
