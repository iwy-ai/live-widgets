# Live Avatar Rectangular Component

A rectangular AI avatar widget that fills its container div, perfect for embedding video chat experiences directly into your page layout. Built for Pipecat voice AI applications with video streaming support.

## Features

- **Video Avatar** - Real-time video streaming from AI agent
- **Rectangular Layout** - Fills parent container like an iframe
- **Interactive UI** - Overlay controls with Start/End call and mic toggle
- **Audio Level Visualization** - Real-time microphone input visualization
- **Multi-language Support** - Built-in English and Norwegian language options
- **Easy Integration** - Simple web component that adapts to any container
- **Pipecat Ready** - Built-in support for Pipecat Client SDK with Daily transport
- **Responsive** - Automatically adapts to container size

## What Makes It Different

**Live Avatar Rectangular vs Other Components:**
- **live-avatar**: Circular floating bubble in bottom-right corner with video
- **live-avatar-rectangular** (this component): Rectangular container with video that fills its parent div
- **audio-visualizer**: Audio-only component with WebGL plasma visualization (no video)

Choose this component if you want a **rectangular video container** that fits naturally into your page layout, similar to embedding a video player or iframe.

## Installation

### Via npm

```bash
npm install @iwy/live-widgets
```

### Via CDN

```html
<!-- unpkg -->
<script src="https://unpkg.com/@iwy/live-widgets@latest/dist/live-avatar-rectangular.min.js"></script>

<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@iwy/live-widgets@latest/dist/live-avatar-rectangular.min.js"></script>
```

## Quick Start

### HTML

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .avatar-container {
            width: 100%;
            height: 600px;
        }
    </style>
</head>
<body>
    <div class="avatar-container">
        <live-avatar-rectangular agentid="your-agent-id"></live-avatar-rectangular>
    </div>

    <script src="https://unpkg.com/@iwy/live-widgets@latest/dist/live-avatar-rectangular.min.js"></script>
</body>
</html>
```

### React/TypeScript

```tsx
import '@iwy/live-widgets/rectangular';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'live-avatar-rectangular': {
        agentid: string;
        'data-endpoint'?: string;
        language?: 'en' | 'no';
      };
    }
  }
}

function App() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <live-avatar-rectangular agentid="your-agent-id"></live-avatar-rectangular>
    </div>
  );
}
```

### Vue

```vue
<template>
  <div class="avatar-container">
    <live-avatar-rectangular agentid="your-agent-id"></live-avatar-rectangular>
  </div>
</template>

<script setup>
import '@iwy/live-widgets/rectangular';
</script>

<style scoped>
.avatar-container {
  width: 100%;
  height: 600px;
}
</style>
```

### Angular

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@iwy/live-widgets/rectangular';

@Component({
  selector: 'app-root',
  template: `
    <div class="avatar-container">
      <live-avatar-rectangular agentid="your-agent-id"></live-avatar-rectangular>
    </div>
  `,
  styles: [`
    .avatar-container {
      width: 100%;
      height: 600px;
    }
  `],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {}
```

## Configuration

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `agentid` | string | Yes | - | Your Pipecat agent ID |
| `data-endpoint` | string | No | `https://api.iwy.ai/api/start-agent-session` | Custom session endpoint |
| `language` | string | No | `en` | Language for UI text (`en` or `no`) |

Languages currently supported: `en` and `no`

## Styling

The component fills its container. Control size via the parent element:

```css
.my-container {
    width: 800px;
    height: 600px;
}
```

**Common Layouts:**

```html
<!-- Full width -->
<div style="width: 100%; height: 600px;">
    <live-avatar-rectangular agentid="your-agent-id"></live-avatar-rectangular>
</div>

<!-- Card layout -->
<div style="width: 400px; height: 500px; border-radius: 12px; overflow: hidden;">
    <live-avatar-rectangular agentid="your-agent-id"></live-avatar-rectangular>
</div>

<!-- Sidebar layout -->
<div style="width: 300px; height: 100vh;">
    <live-avatar-rectangular agentid="your-agent-id"></live-avatar-rectangular>
</div>
```

## How It Works

- **Container Filling**: Component fills its parent container (100% width/height)
- **Video Stream**: Displays real-time video from the Pipecat AI agent via WebRTC
- **Overlay Controls**: Buttons for Start Call, End Call, and Mic Toggle
- **Audio Visualization**: Real-time microphone level visualization with Web Audio API
- **Pipecat Integration**: Connects via DailyTransport (Daily.co) for WebRTC streaming
- **Multi-language**: Supports English and Norwegian UI text

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full (iOS 11+) |

**Requirements:**
- WebRTC
- Web Audio API
- Shadow DOM

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

See the `examples/` directory for integration examples.

## Technical Details

- **Architecture**: Web Component with Shadow DOM
- **Video**: WebRTC video element with Pipecat/Daily.co transport
- **Audio**: Web Audio API with AnalyserNode for mic level visualization
- **Layout**: CSS flexbox with 100% width/height fill
- **Bundle Size**: ~160KB (minified), includes Pipecat Client SDK and Daily transport

## License

MIT License - see LICENSE file

## Links

- [Website](https://www.iwy.ai)
- [Issues](https://github.com/iwy-ai/live-widgets/issues)
- [Documentation](https://docs.iwy.ai)

## Credits

Built by [iwy.ai](https://www.iwy.ai) with:
- [Pipecat](https://github.com/pipecat-ai/pipecat)
- [Daily.co](https://daily.co/)
