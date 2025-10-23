# Run the examples

WebRTC has strict security. Can't open example html files directly in browser via file:// protocol.

### Option 1: Use a simple HTTP server (recommended for local testing)

```bash
cd /home/sve/iwy/live-widgets
python3 -m http.server 8000
```

Then open: http://localhost:8000/webrtc-live-avatar-rectangular/examples/simple.html


### Option 2: Use the Vite dev server (already running)
http://localhost:5174/webrtc-live-avatar-rectangular/examples/simple.html


### The bottom line:
WebRTC with microphone access cannot work with file:// protocol - you must use http://localhost
at minimum.