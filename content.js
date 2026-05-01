// =====================================================================
// Kognetic Extension — content.js
// Bridges the extension's Supabase session into the dashboard page
// so the user doesn't have to log in twice.
// =====================================================================

(async () => {
  // Only run on the Kognetic dashboard
  const url = window.location.href;
  if (!url.includes('localhost:3000') && !url.includes('kognetic')) return;

  // Read stored session from extension storage
  const session = await new Promise((resolve) => {
    chrome.storage.local.get(['kogneticSession'], (result) => {
      resolve(result.kogneticSession || null);
    });
  });

  if (session && session.access_token) {
    // Post session to the dashboard page
    window.postMessage({
      type: 'KOGNETIC_SESSION_BRIDGE',
      session: session
    }, '*');
  }
})();
