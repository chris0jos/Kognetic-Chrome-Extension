// =====================================================================
// Kognetic Extension — popup.js
// Handles: Supabase auth (REST API), secure page capture, toast UX
// =====================================================================

// --- Supabase Config (publishable anon key — safe for client-side) ---
const SUPABASE_URL = 'https://epwzmixzewyyecklfrge.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9LmHN5zePuFR_uEkMmvK-Q__nBDslZM';
const API_BASE = 'https://api.kognetic.space';

// --- State ---
let currentTab = null;
let currentSession = null; // { access_token, refresh_token, user_id, email, expires_at }
let selectedTagIds = new Set();

// =====================================================================
// INITIALIZATION
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Try to restore session from storage
  const stored = await getFromStorage('kogneticSession');

  if (stored && stored.access_token) {
    currentSession = stored;

    // Check if token is expired and try to refresh
    if (isTokenExpired(currentSession)) {
      const refreshed = await refreshSession(currentSession.refresh_token);
      if (refreshed) {
        currentSession = refreshed;
      } else {
        // Refresh failed — force re-login
        currentSession = null;
        await clearStorage();
      }
    }
  }

  if (currentSession) {
    showCaptureView();
  } else {
    showLoginView();
  }

  // 2. Wire up event listeners
  document.getElementById('loginForm').addEventListener('submit', handleAuth);
  document.getElementById('loginToggle').addEventListener('click', toggleAuthMode);
  document.getElementById('saveBtn').addEventListener('click', handleSave);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// =====================================================================
// AUTH — Supabase REST API (no SDK needed)
// =====================================================================

let authMode = 'login'; // 'login' | 'register'

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const submitBtn = document.getElementById('loginSubmit');
  const toggleBtn = document.getElementById('loginToggle');
  const errorEl = document.getElementById('loginError');

  submitBtn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
  toggleBtn.textContent = authMode === 'login'
    ? "Don't have an account? Sign up"
    : "Already have an account? Sign in";
  errorEl.classList.add('hidden');
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmit');

  if (!email || !password) return;

  submitBtn.disabled = true;
  submitBtn.textContent = authMode === 'login' ? 'Signing in…' : 'Signing up…';
  errorEl.classList.add('hidden');

  try {
    if (authMode === 'login') {
      // POST /auth/v1/token?grant_type=password
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');

      // Store session
      currentSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_id: data.user.id,
        email: data.user.email,
        expires_at: Date.now() + (data.expires_in * 1000)
      };
      await saveToStorage('kogneticSession', currentSession);
      showCaptureView();

    } else {
      // POST /auth/v1/signup
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Signup failed');

      // Show success message, switch to login
      errorEl.textContent = '✓ Registration successful. Try signing in.';
      errorEl.classList.remove('hidden');
      errorEl.classList.add('info');
      authMode = 'login';
      document.getElementById('loginSubmit').textContent = 'Sign In';
      document.getElementById('loginToggle').textContent = "Don't have an account? Sign up";
    }
  } catch (err) {
    errorEl.textContent = `* ${err.message}`;
    errorEl.classList.remove('hidden', 'info');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
  }
}

async function handleLogout() {
  currentSession = null;
  await clearStorage();
  showLoginView();
}

// =====================================================================
// SESSION MANAGEMENT
// =====================================================================

function isTokenExpired(session) {
  if (!session || !session.expires_at) return true;
  // Expired if within 60 seconds of expiry
  return Date.now() >= (session.expires_at - 60000);
}

async function refreshSession(refreshToken) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) return null;
    const data = await res.json();

    const newSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user.id,
      email: data.user.email,
      expires_at: Date.now() + (data.expires_in * 1000)
    };

    await saveToStorage('kogneticSession', newSession);
    return newSession;
  } catch (err) {
    console.error('Kognetic: session refresh failed', err);
    return null;
  }
}

// Ensures we have a valid token before making API calls
async function getValidSession() {
  if (!currentSession) return null;

  if (isTokenExpired(currentSession)) {
    const refreshed = await refreshSession(currentSession.refresh_token);
    if (refreshed) {
      currentSession = refreshed;
      return currentSession;
    } else {
      // Force re-login
      currentSession = null;
      await clearStorage();
      showLoginView();
      return null;
    }
  }

  return currentSession;
}

// =====================================================================
// SECURE CAPTURE — POST /save with Bearer token
// =====================================================================

async function handleSave() {
  if (!currentTab) return;

  const session = await getValidSession();
  if (!session) {
    showToast('Session expired. Please sign in again.', 'error');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  const noteContent = document.getElementById('noteInput').value;

  // Disable button during request
  saveBtn.disabled = true;
  clearChildren(saveBtn);
  const savingSpan = document.createElement('span');
  savingSpan.textContent = 'Saving…';
  saveBtn.appendChild(savingSpan);

  const payload = {
    user_id: session.user_id,
    type: 'page',
    title: currentTab.title || 'No Title',
    url: currentTab.url || 'No URL',
    note: noteContent,
    tag_ids: Array.from(selectedTagIds)
  };

  try {
    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Saved to your second brain', 'success');
      document.getElementById('noteInput').value = '';
    } else {
      showToast('Failed to save. Try again.', 'error');
    }
  } catch (err) {
    console.error('Kognetic: save failed', err);
    showToast('Network error. Is the backend running?', 'error');
  } finally {
    saveBtn.disabled = false;
    resetSaveButton(saveBtn);
  }
}

// =====================================================================
// VIEW TOGGLING
// =====================================================================

function showLoginView() {
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('captureView').classList.add('hidden');
}

async function showCaptureView() {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('captureView').classList.remove('hidden');

  // Show user email
  if (currentSession) {
    document.getElementById('userEmail').textContent = currentSession.email || '';
  }

  // Get current tab info
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    if (tab) {
      document.getElementById('pageTitle').textContent = tab.title || 'No Title';
      document.getElementById('pageUrl').textContent = tab.url || 'No URL';
    }
  } catch (err) {
    console.error('Kognetic: failed to get tab info', err);
  }

  // Fetch and render tags
  fetchAndRenderTags();
}

async function fetchAndRenderTags() {
  const container = document.getElementById('tagsContainer');
  const session = await getValidSession();
  
  if (!session) {
    setTagsMessage(container, 'Please sign in to view tags.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/tags`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch tags');
    
    const tags = await res.json();
    
    if (tags.length === 0) {
      setTagsMessage(container, 'No tags found. Create them in the dashboard.');
      return;
    }

    clearChildren(container);
    tags.forEach(tag => {
      const pill = document.createElement('div');
      pill.className = 'tag-pill';
      pill.textContent = tag.name;
      
      // Toggle selection on click
      pill.addEventListener('click', () => {
        if (selectedTagIds.has(tag.id)) {
          selectedTagIds.delete(tag.id);
          pill.classList.remove('selected');
        } else {
          // Optional: limit to 3 tags to match backend max_length, though not strictly required by UI
          if (selectedTagIds.size >= 3) {
            showToast('Maximum 3 tags allowed', 'error');
            return;
          }
          selectedTagIds.add(tag.id);
          pill.classList.add('selected');
        }
      });
      
      container.appendChild(pill);
    });

  } catch (err) {
    console.error('Kognetic: failed to fetch tags', err);
    setTagsMessage(container, 'Failed to load tags.');
  }
}

// =====================================================================
// TOAST NOTIFICATIONS — animated success/error feedback
// =====================================================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');

  // Remove any existing toast
  clearChildren(container);

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Build SVG icon safely via namespace-aware DOM APIs
  if (type === 'success') {
    toast.appendChild(createCheckSvg());
  } else {
    toast.appendChild(createXSvg());
  }

  // Append message text safely
  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(span);

  container.appendChild(toast);

  // Auto-dismiss after 2.5s
  setTimeout(() => {
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// =====================================================================
// CHROME STORAGE HELPERS
// =====================================================================

function saveToStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

function getFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

function clearStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.remove('kogneticSession', resolve);
  });
}

// =====================================================================
// SAFE DOM HELPERS — XSS-safe element construction (no innerHTML)
// =====================================================================

/** Remove all child nodes from an element safely */
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/** Set a simple text message inside the tags container */
function setTagsMessage(container, text) {
  clearChildren(container);
  const div = document.createElement('div');
  div.className = 'tags-loading';
  div.textContent = text;
  container.appendChild(div);
}

/** Rebuild the save button to its default state (icon + label) */
function resetSaveButton(btn) {
  clearChildren(btn);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z');
  svg.appendChild(path);

  const poly1 = document.createElementNS(ns, 'polyline');
  poly1.setAttribute('points', '17 21 17 13 7 13 7 21');
  svg.appendChild(poly1);

  const poly2 = document.createElementNS(ns, 'polyline');
  poly2.setAttribute('points', '7 3 7 8 15 8');
  svg.appendChild(poly2);

  btn.appendChild(svg);
  const span = document.createElement('span');
  span.textContent = 'Save Page';
  btn.appendChild(span);
}

/** Create the animated success checkmark SVG */
function createCheckSvg() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'toast-check');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');

  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('class', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '10');
  circle.setAttribute('stroke-width', '2');
  circle.setAttribute('fill', 'none');
  svg.appendChild(circle);

  const check = document.createElementNS(ns, 'polyline');
  check.setAttribute('class', 'check');
  check.setAttribute('points', '8 12 11 15 16 9');
  check.setAttribute('stroke-width', '2');
  check.setAttribute('fill', 'none');
  check.setAttribute('stroke-linecap', 'round');
  check.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(check);

  return svg;
}

/** Create the animated error X SVG */
function createXSvg() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'toast-x');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');

  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('class', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '10');
  circle.setAttribute('stroke-width', '2');
  circle.setAttribute('fill', 'none');
  svg.appendChild(circle);

  const line1 = document.createElementNS(ns, 'line');
  line1.setAttribute('class', 'x-line');
  line1.setAttribute('x1', '9');
  line1.setAttribute('y1', '9');
  line1.setAttribute('x2', '15');
  line1.setAttribute('y2', '15');
  line1.setAttribute('stroke-width', '2');
  line1.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line1);

  const line2 = document.createElementNS(ns, 'line');
  line2.setAttribute('class', 'x-line');
  line2.setAttribute('x1', '15');
  line2.setAttribute('y1', '9');
  line2.setAttribute('x2', '9');
  line2.setAttribute('y2', '15');
  line2.setAttribute('stroke-width', '2');
  line2.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line2);

  return svg;
}
