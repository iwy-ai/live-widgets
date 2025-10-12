# @iwy/live-widgets

Library of embeddable AI avatar widgets for live conversational video chat. This package allows you to easily embed interactive AI avatars on any website with just a few lines of code.

## Widget Types

This package provides two types of avatar widgets:

- **`<live-avatar>`** - A floating bubble widget that positions itself in the bottom-right corner of the page
- **`<live-avatar-rectangular>`** - A rectangular widget designed to be embedded inside a specific div or container

## Installation

### Via npm

```bash
npm install @iwy/live-widgets
```

### Via CDN

```html
<!-- For floating bubble widget -->
<script src="https://unpkg.com/@iwy/live-widgets@latest/dist/live-avatar.min.js"></script>

<!-- For rectangular widget -->
<script src="https://unpkg.com/@iwy/live-widgets@latest/dist/live-avatar-rectangular.min.js"></script>
```

## Usage

### Floating Bubble Widget

The floating bubble widget automatically positions itself in the bottom-right corner:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to my website</h1>

    <!-- Floating bubble widget -->
    <live-avatar agentid="your-agent-id-here"></live-avatar>
    <script src="https://unpkg.com/@iwy/live-widgets@latest/dist/live-avatar.min.js"></script>
</body>
</html>
```

### Rectangular Widget

The rectangular widget is designed to be embedded inside a container div:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
    <style>
        .avatar-container {
            width: 600px;
            height: 600px;
            border-radius: 8px;
            overflow: hidden;
        }
        
        live-avatar-rectangular {
            display: block;
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <h1>Welcome to my website</h1>
    
    <div class="avatar-container">
        <live-avatar-rectangular 
            agentid="your-agent-id-here"
            placeholder-src="https://talk.iwy.ai/assets/plc_grey_purple_2_loop.webp"
            language="en">
        </live-avatar-rectangular>
    </div>
    
    <script src="https://unpkg.com/@iwy/live-widgets@latest/dist/live-avatar-rectangular.min.js"></script>
</body>
</html>
```

### ES Module Usage

```javascript
import '@iwy/live-widgets';

// Now you can use the <live-avatar> custom element in your HTML
```

### React/Vue/Angular Usage

Since this is a web component, it works with any framework:

```jsx
// React
function App() {
  return (
    <div>
      <live-avatar agentid="your-agent-id-here"></live-avatar>
    </div>
  );
}
```

## Configuration

### Common Attributes

Both widgets accept the following attributes:

- `agentid` (required): Your agent ID from iwy.ai
- `placeholder-src` (optional): URL to a placeholder image/animation that displays in a loop (could be webp or gif, or just a static image) before the avatar loads
- `language` (optional): Language code for the avatar (Currently only supports "en" and "no")


### Custom Endpoint Example

```html
<!-- Floating bubble widget -->
<live-avatar
  agentid="your-agent-id">
</live-avatar>

<!-- Rectangular widget -->
<live-avatar-rectangular
  agentid="your-agent-id"
  placeholder-src="https://talk.iwy.ai/assets/plc_grey_purple_2_loop.webp"
  language="en">
</live-avatar-rectangular>
```

## Features

- ✨ Two widget types: floating bubble and embeddable rectangular
- 📱 Responsive design (scales on mobile)
- 🎥 Live video chat with AI agents
- 🎤 Real-time audio visualization (microphone access only)
- 🎛️ Interactive controls and status indicators
- 🎨 Smooth animations and transitions
- 🔧 Customizable via CSS custom properties

## Browser Support

- Chrome 60+
- Firefox 63+
- Safari 12+
- Edge 79+

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For support and questions, visit [iwy.ai/contact](https://www.iwy.ai/contact)