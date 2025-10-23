# Run the examples

WebRTC has strict security requirements. You cannot open HTML files directly in the browser via the `file://` protocol.

## Quick Start

### Option 1: Use a simple HTTP server (recommended for local testing)

```bash
cd /home/sve/iwy/live-widgets
python3 -m http.server 8000
```

Then open: http://localhost:8000/webrtc-live-avatar-rectangular/examples/simple.html

### Option 2: Use the Vite dev server

If you have the dev server running:

```bash
npm run dev
```

Then open: http://localhost:5174/webrtc-live-avatar-rectangular/examples/simple.html

## Important Notes

- **Pure JavaScript**: These examples use the standalone JavaScript file (`dist/src.js`) - no TypeScript compilation needed!
- **WebSocket URL**: Set as a `WEBSOCKET_URL` constant at the top of `dist/src.js` (defaults to `wss://iwy-ai--wr-start.modal.run/ws`)
- **Easy Configuration**: Simply edit the `WEBSOCKET_URL` constant to use a different server
- **Security**: WebRTC with microphone access requires `http://localhost` at minimum (not `file://`)

## Examples

- `simple.html` - Minimal example showing basic usage
- `index.html` - Full example with styled interface