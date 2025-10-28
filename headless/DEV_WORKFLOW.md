# Local Development Workflow

## 🚀 Quick Start for Local Testing

### Step 1: Build Your Changes
```bash
npm run build
```

### Step 2: Start Local Server (from project root!)
```bash
# IMPORTANT: Run from project root, not examples folder!
python3 -m http.server 8000
```

### Step 3: Open Test Page
Open your browser to:
```
http://localhost:8000/headless/examples/local-test.html
```

---

## 🔄 Development Loop

```bash
# 1. Make changes to headless/src/LiveAvatarSDK.ts or types.ts
vim headless/src/LiveAvatarSDK.ts

# 2. Rebuild
npm run build

# 3. Refresh browser (Cmd/Ctrl + R)
# Your changes are now live!
```

**No npm publishing needed!** 🎉

---

## 🐛 Debugging Tips

### Check Build Output
```bash
# See what was built
ls -lh dist/headless*

# Verify types were generated
ls -lh dist/types/
```

### Console Logging
The local test file has extensive console logging:
- `🔄 Connecting...` - Connection starting
- `✅ Connected!` - Successfully connected
- `🤖 Bot joined the call!` - Bot entered session
- `🗣️ User said: ...` - User transcript
- `🤖 Bot said: ...` - Bot transcript
- `🎤 Mic: ON/OFF` - Microphone state changes

### Check SDK State
Open browser console and type:
```javascript
avatar.connectionState  // 'disconnected' | 'connecting' | 'connected' | 'error'
avatar.isConnected      // boolean
avatar.isMicEnabled     // boolean
avatar.getTracks()      // MediaStreamTrack info
```

---

## 📁 File Structure

```
live-widgets/
├── headless/
│   ├── src/
│   │   ├── LiveAvatarSDK.ts   ← Edit here
│   │   ├── types.ts            ← Edit here
│   │   └── index.ts            ← Exports
│   ├── examples/
│   │   ├── local-test.html     ← Local testing (uses ../../dist/)
│   │   └── vanilla-js.html     ← Production (uses unpkg CDN)
│   └── tsconfig.json
├── dist/
│   ├── headless.esm.js         ← Built ESM bundle
│   ├── headless.min.js         ← Built UMD bundle
│   ├── headless.js             ← Built CommonJS bundle
│   └── types/                  ← Generated .d.ts files
└── rollup.config.js
```

---

## 🔧 Common Issues

### ❌ Module not found error
**Problem:** `Failed to load ../../dist/headless.esm.js`

**Solution:** Make sure you're running the server from project root:
```bash
# Wrong (from examples folder):
cd headless/examples
python3 -m http.server 8000  # ❌ Won't work!

# Right (from project root):
cd /path/to/live-widgets
python3 -m http.server 8000  # ✅ Works!
```

### ❌ CORS errors
**Problem:** CORS policy blocking local files

**Solution:** Always use a local HTTP server, never `file://` protocol.

### ❌ Changes not appearing
**Problem:** Modified code but browser shows old version

**Solution:**
1. Run `npm run build` again
2. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
3. Check browser console for build errors

---

## 🧪 Testing Checklist

Before committing changes:
- [ ] `npm run build` completes without errors
- [ ] Local test page loads successfully
- [ ] "Start Call" button triggers connection
- [ ] Video element receives bot video stream
- [ ] Audio visualization shows mic levels
- [ ] "Mic" button toggles microphone state
- [ ] "End Call" button disconnects cleanly
- [ ] Console shows all expected log messages
- [ ] No errors in browser console

---

## 🚢 Publishing Workflow

Once you've tested locally and everything works:

```bash
# 1. Commit your changes
git add .
git commit -m "feat(headless): your changes"

# 2. Bump version
npm version patch  # or minor/major

# 3. Publish to npm
npm publish

# 4. Test from CDN
# Wait 1-2 minutes, then open vanilla-js.html
# It will use the published version from unpkg
```

---

## 💡 Pro Tips

### Fast Iteration
Use `nodemon` to auto-rebuild on changes:
```bash
npm install -g nodemon
nodemon --watch headless/src --exec "npm run build"
```

### Multiple Test Files
Create different test scenarios:
```
local-test.html           # Full featured test
local-test-minimal.html   # Minimal integration test
local-test-error.html     # Error handling test
```

### Check Production Build Size
```bash
ls -lh dist/headless.min.js
# Should be ~330-350KB (includes Pipecat dependencies)
```

### Verify TypeScript Declarations
```bash
cat dist/types/index.d.ts
# Should export LiveAvatarSDK and all types
```

---

## 📞 Need Help?

- Check browser console for errors
- Check terminal for build errors
- Verify you're on latest build: `npm run build`
- Try hard refresh: Cmd+Shift+R / Ctrl+Shift+R
