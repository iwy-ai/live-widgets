# Audio Visualizer Component

A lightweight, embeddable audio visualizer with WebGL-powered plasma effects that reacts to audio input in real-time. Built for Pipecat voice AI applications.

## Features

- 🎨 **WebGL Plasma Visualization** - Animated plasma effects using Three.js
- 🎤 **Real-time Audio Reactivity** - Responds to microphone input dynamically
- 📦 **Easy Integration** - Simple web component that fills its container
- 🔌 **Pipecat Ready** - Built-in support for Pipecat Client SDK with Daily transport
- 📱 **Responsive** - Automatically adapts to container size

## Installation

### Via npm

```bash
npm install @iwy/live-widgets
```

### Via CDN

```html
<!-- unpkg -->
<script src="https://unpkg.com/@iwy/live-widgets@latest/dist/audio-visualizer.min.js"></script>

<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@iwy/live-widgets@latest/dist/audio-visualizer.min.js"></script>
```

## Quick Start

### HTML

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .container {
            width: 100%;
            height: 500px;
        }
    </style>
</head>
<body>
    <div class="container">
        <audio-visualizer agentid="your-agent-id"></audio-visualizer>
    </div>

    <script src="https://unpkg.com/@iwy/live-widgets@latest/dist/audio-visualizer.min.js"></script>
</body>
</html>
```

### React/TypeScript

```tsx
import '@iwy/live-widgets/audio-visualizer';

function App() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <audio-visualizer agentid="your-agent-id"></audio-visualizer>
    </div>
  );
}
```

### Vue

```vue
<template>
  <div class="container">
    <audio-visualizer agentid="your-agent-id"></audio-visualizer>
  </div>
</template>

<script setup>
import '@iwy/live-widgets/audio-visualizer';
</script>

<style scoped>
.container {
  width: 100%;
  height: 500px;
}
</style>
```

### Angular

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@iwy/live-widgets/audio-visualizer';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <audio-visualizer agentid="your-agent-id"></audio-visualizer>
    </div>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {}
```

## Configuration

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentid` | string | Yes | Your Pipecat agent ID |
| `data-endpoint` | string | No | Custom session endpoint (default: `https://api.iwy.ai/api/start-agent-session`) |

## Styling

The component fills its container. Control size via the parent element:

```css
.my-container {
    width: 800px;
    height: 600px;
}
```

## How It Works

- **WebGL Visualization**: Custom GLSL shaders with simplex noise create organic plasma movement
- **Audio Analysis**: Web Audio API analyzes microphone input via FFT (256 bins)
- **Pipecat Integration**: Connects via SmallWebRTC (Daily.co) transport, audio-only mode
- **Performance**: ~60fps animation loop with responsive canvas resizing

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full (iOS 11+) |

**Requirements:**
- WebGL 1.0+
- Web Audio API
- WebRTC

## Development

```bash
# Clone repository
git clone https://github.com/iwy-ai/live-widgets.git
cd live-widgets

# Install dependencies
npm install

# Build
npm run build
```

## Examples

See the `examples/` directory for:
- `audio-visualizer-simple.html` - Minimal integration example
- `audio-visualizer-layouts.html` - Multiple layout patterns (full-width, card, sidebar, grid, wide)
- `audio-visualizer-react.tsx` - React/TypeScript integration examples

## Technical Details

- **Renderer**: Three.js with OrthographicCamera
- **Shader**: Custom GLSL fragment shader
- **Audio**: AnalyserNode with 256 FFT size
- **Bundle Size**: 803KB (minified), includes Three.js

## License

MIT License - see LICENSE file

## Links

- [Website](https://www.iwy.ai)
- [Issues](https://github.com/iwy-ai/live-widgets/issues)
- [Documentation](https://docs.iwy.ai)

## Credits

Built by [iwy.ai](https://www.iwy.ai) with:
- [Pipecat](https://github.com/pipecat-ai/pipecat)
- [Three.js](https://threejs.org/)
- [Daily.co](https://daily.co/)
