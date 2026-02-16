/* Photo Capture PWA - MVP */

const STORAGE_KEY = 'photo-pwa-photos';

const USERS = {
  user: 'user',
  admin: 'admin',
};

function getDemoPhotos() {
  return [
    {
      id: 'demo-1',
      userId: 'user',
      username: 'user',
      dataUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#1e293b" width="100" height="100"/><circle fill="#38bdf8" cx="50" cy="50" r="30"/></svg>'),
      timestamp: Date.now() - 86400000,
    },
    {
      id: 'demo-2',
      userId: 'user',
      username: 'user',
      dataUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#1e293b" width="100" height="100"/><rect fill="#34d399" x="20" y="30" width="60" height="40" rx="4"/></svg>'),
      timestamp: Date.now() - 3600000,
    },
  ];
}

function loadPhotos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : getDemoPhotos();
    }
  } catch (_) {}
  return getDemoPhotos();
}

function savePhotos(photos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

function addPhoto(photo) {
  const photos = loadPhotos();
  photos.push({
    id: 'photo-' + Date.now(),
    userId: photo.userId,
    username: photo.username,
    dataUrl: photo.dataUrl,
    timestamp: photo.timestamp || Date.now(),
  });
  savePhotos(photos);
}

let currentUser = null;

const loginScreen = document.getElementById('loginScreen');
const userScreen = document.getElementById('userScreen');
const adminScreen = document.getElementById('adminScreen');
const capturePanel = document.getElementById('capturePanel');
const timelinePanel = document.getElementById('timelinePanel');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const videoEl = document.getElementById('videoEl');
const canvasEl = document.getElementById('canvasEl');
const captureBtn = document.getElementById('captureBtn');
const confirmWrap = document.getElementById('confirmWrap');
const previewImg = document.getElementById('previewImg');
const timelineView = document.getElementById('timelineView');
const adminTimeline = document.getElementById('adminTimeline');
const toast = document.getElementById('toast');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (USERS[username] === password) {
    currentUser = { username, isAdmin: username === 'admin' };
    showScreen(currentUser.isAdmin ? 'admin' : 'user');
    if (currentUser.isAdmin) renderAdminTimeline();
    else {
      showTab('capture');
      startCamera();
    }
  } else {
    showToast('Invalid username or password');
  }
});

document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    stopCamera();
    currentUser = null;
    usernameInput.value = '';
    passwordInput.value = '';
    showScreen('login');
  });
});

function showScreen(name) {
  [loginScreen, userScreen, adminScreen].forEach((s) => s.classList.remove('active'));
  if (name === 'login') loginScreen.classList.add('active');
  else if (name === 'user') userScreen.classList.add('active');
  else if (name === 'admin') adminScreen.classList.add('active');
}

function showTab(name) {
  capturePanel.classList.toggle('hidden', name !== 'capture');
  timelinePanel.classList.toggle('hidden', name !== 'timeline');
  if (name === 'timeline') renderTimeline();
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('active', t.dataset.tab === name)
  );
}

document.querySelectorAll('[data-tab]').forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    if (target === 'capture') {
      showTab('capture');
      startCamera();
    } else if (target === 'timeline') {
      stopCamera();
      showTab('timeline');
    }
  });
});

let stream = null;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 } },
      audio: false,
    });
    videoEl.srcObject = stream;
  } catch (err) {
    showToast('Camera access denied');
    console.error(err);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  videoEl.srcObject = null;
}

let capturedDataUrl = null;

captureBtn.addEventListener('click', () => {
  if (confirmWrap.classList.contains('active')) return;
  const w = videoEl.videoWidth;
  const h = videoEl.videoHeight;
  if (!w || !h) return;
  canvasEl.width = w;
  canvasEl.height = h;
  const ctx = canvasEl.getContext('2d');
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, -w, 0, w, h);
  ctx.restore();
  capturedDataUrl = canvasEl.toDataURL('image/jpeg', 0.85);
  previewImg.src = capturedDataUrl;
  confirmWrap.classList.add('active');
  capturePanel.classList.add('confirming');
});

document.querySelectorAll('[data-action]').forEach((btn) => {
  if (btn.dataset.action === 'retake') {
    btn.addEventListener('click', () => {
      capturedDataUrl = null;
      previewImg.src = '';
      confirmWrap.classList.remove('active');
      capturePanel.classList.remove('confirming');
    });
  } else if (btn.dataset.action === 'upload') {
    btn.addEventListener('click', () => {
      if (!capturedDataUrl) return;
      addPhoto({
        userId: currentUser.username,
        username: currentUser.username,
        dataUrl: capturedDataUrl,
        timestamp: Date.now(),
      });
      capturedDataUrl = null;
      previewImg.src = '';
      confirmWrap.classList.remove('active');
      capturePanel.classList.remove('confirming');
      showToast('Photo uploaded!');
      stopCamera();
      showTab('timeline');
    });
  }
});

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === new Date(today - 86400000).toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(photos) {
  const groups = {};
  photos
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach((p) => {
      const key = formatDate(p.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
  return groups;
}

function renderTimeline() {
  const photos = loadPhotos().filter((p) => p.userId === currentUser.username);
  const groups = groupByDate(photos);

  if (Object.keys(groups).length === 0) {
    timelineView.innerHTML = '<p class="timeline-empty">No photos yet. Capture your first one!</p>';
    return;
  }

  timelineView.innerHTML = Object.entries(groups)
    .map(
      ([date, items]) => `
    <div>
      <div class="timeline-date">${date}</div>
      ${items
        .map(
          (p) => `
        <div class="timeline-item">
          <img src="${p.dataUrl}" alt="Photo" loading="lazy" />
          <div class="timeline-meta">${formatTime(p.timestamp)}</div>
        </div>
      `
        )
        .join('')}
    </div>
  `
    )
    .join('');
}

function renderAdminTimeline() {
  const photos = loadPhotos();
  const groups = groupByDate(photos);

  if (Object.keys(groups).length === 0) {
    adminTimeline.innerHTML = '<p class="timeline-empty">No photos from any user.</p>';
    return;
  }

  adminTimeline.innerHTML = Object.entries(groups)
    .map(
      ([date, items]) => `
    <div>
      <div class="timeline-date">${date}</div>
      ${items
        .map(
          (p) => `
        <div class="timeline-item">
          <img src="${p.dataUrl}" alt="Photo" loading="lazy" />
          <div class="timeline-meta">${p.username} · ${formatTime(p.timestamp)}</div>
        </div>
      `
        )
        .join('')}
    </div>
  `
    )
    .join('');
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
