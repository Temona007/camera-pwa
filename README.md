# Photo Capture - Static (HTML/CSS/JS only)

Standalone version with **no server, no npm, no build tools**. Just plain files.

## Contents

- `index.html` - Main app
- `styles.css` - Styles
- `app.js` - Logic
- `manifest.json` - PWA manifest
- `sw.js` - Service worker (offline)
- `offline.html` - Offline page
- `icon.svg` - App icon

## How to use

**Option 1: Open directly**  
Double-click `index.html` or open it in a browser. Login and timeline work. Camera and PWA install may not work over `file://` (browser security).

**Option 2: Deploy to Netlify**  
Drag the entire `static` folder onto [app.netlify.com/drop](https://app.netlify.com/drop). Camera and PWA will work over HTTPS.

**Option 3: Any static host**  
Upload the folder to GitHub Pages, Vercel, or any web server.

## Credentials

| User   | Password | Access             |
|--------|----------|--------------------|
| `user` | `user`   | Capture + timeline |
| `admin`| `admin`  | Admin: all photos  |
