<div align="center">

<br />

<img src="https://kognetic.space/favicon.ico" alt="Kognetic" width="72" height="72" />

<br />
<br />

# Kognetic Extension

**Turn anything you read into structured knowledge.**

The Kognetic Chrome Extension lets you instantly save pages and highlights into your personal second brain — where everything becomes searchable, connected, and meaningful.

<br />

[![Website](https://img.shields.io/badge/Website-kognetic.space-0ea5e9?style=flat-square&logo=globe&logoColor=white)](https://kognetic.space)
[![App](https://img.shields.io/badge/Open_App-app.kognetic.space-6366f1?style=flat-square&logo=sparkles&logoColor=white)](https://app.kognetic.space)
[![Status](https://img.shields.io/badge/Status-Beta-f59e0b?style=flat-square)](https://github.com)
[![Manifest](https://img.shields.io/badge/Manifest-V3-10b981?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)

<br />

</div>

---

## What it does

Kognetic turns passive browsing into active learning. Every page you visit, every insight you highlight — saved instantly, organized automatically, and connected to everything else you know.

| Feature | Description |
|---|---|
| 🔖 **One-click saves** | Capture any webpage with a single click — no copy-pasting, no friction |
| ✂️ **Smart highlights** | Select any text, right-click, and store it directly to your second brain |
| 🧠 **Knowledge graph** | Everything you save connects to related ideas automatically |
| 🔍 **Semantic search** | Find anything by idea, not just keyword — your knowledge, finally retrievable |

---

## Installation

> **Note:** Kognetic is not yet on the Chrome Web Store. Install takes under 2 minutes.

### Step 1 — Download the extension

Click the green **Code** button at the top of this repo → **Download ZIP**, then extract it anywhere on your machine.

### Step 2 — Enable Developer Mode in Chrome

Navigate to [`chrome://extensions`](chrome://extensions) and toggle **Developer Mode** in the top-right corner.

### Step 3 — Load the extension

Click **Load unpacked** and select the folder you extracted in Step 1.

### Step 4 — Done

The Kognetic icon will appear in your Chrome toolbar. Pin it for easy access.

---

## How to use

### Saving a full page

1. Navigate to any webpage you want to keep
2. Click the **Kognetic icon** in your toolbar
3. Optionally add a note or tags
4. Hit **Save Page**

### Saving a highlight

1. Select any text on a webpage
2. Right-click the selection
3. Choose **"Save to Kognetic"**

### Viewing your knowledge base

All saved content lives at **[app.kognetic.space](https://app.kognetic.space)** — searchable, tagged, and connected.

> **Tip:** If a save doesn't register immediately, refresh the page and try again.

---

## Tech stack

```
Chrome Extension (Manifest V3)   — content scripts, service workers, context menus
React                            — extension popup UI
FastAPI                          — backend API
PostgreSQL                       — persistent knowledge storage
```

---

## Project status

Kognetic is in active **beta**. Core functionality is stable; new features ship regularly.

- [x] One-click page saves
- [x] Right-click highlight capture
- [x] Searchable knowledge base
- [ ] Chrome Web Store release *(coming soon)*
- [ ] Automatic tagging with AI
- [ ] Knowledge graph visualization
- [ ] Browser sync across devices

---

## Contributing & Feedback

Found a bug? Have a feature idea? We want to hear from you.

- **Open an issue** — [github.com/kognetic/extension/issues](https://github.com)
- **Email us** — [feedback@kognetic.space](mailto:feedback@kognetic.space)

When reporting a bug, please include your Chrome version, a description of what happened, and steps to reproduce it.

---

## Support

If Kognetic has been useful to you, consider **starring the repo** — it helps more people find the project and motivates continued development.

---

<div align="center">

<br />

**[kognetic.space](https://kognetic.space)** · **[app.kognetic.space](https://app.kognetic.space)** · [feedback@kognetic.space](mailto:feedback@kognetic.space)

<br />

*Kognetic — your second brain, finally connected.*

<br />

</div>