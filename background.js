// =====================================================================
// Kognetic Extension — background.js (Service Worker)
// Handles: Context menu creation + right-click highlight capture
// Reads JWT session from chrome.storage.local for secure requests
// =====================================================================

const API_BASE = 'https://api.kognetic.space';

// --- Context Menu ---
// Created once when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-kognetic',
    title: 'Save to Kognetic',
    contexts: ['selection']
  });
});

// --- Handle Right-Click Save ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-to-kognetic') return;

  // Edge case: no selection or empty selection
  if (!info.selectionText || info.selectionText.trim().length === 0) {
    console.log('Kognetic: No text selected, ignoring.');
    return;
  }

  // Read session from chrome.storage.local
  const session = await getSessionFromStorage();

  if (!session || !session.access_token) {
    console.warn('Kognetic: No active session. User must sign in via the popup first.');
    return;
  }

  const payload = {
    user_id: session.user_id,
    type: 'highlight',
    title: tab.title || 'No Title',
    url: tab.url || 'No URL',
    content: info.selectionText
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
      console.log('Kognetic: Highlight saved successfully.');
    } else {
      console.error('Kognetic: Failed to save highlight. Status:', res.status);
    }
  } catch (err) {
    // Network error — backend might be offline
    console.error('Kognetic: Error saving highlight:', err);
  }
});

// =====================================================================
// STORAGE HELPER
// =====================================================================

function getSessionFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['kogneticSession'], (result) => {
      resolve(result.kogneticSession || null);
    });
  });
}
