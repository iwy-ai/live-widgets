# @iwy/live-widgets

Library of embeddable AI avatar widgets for live conversational video chat. This package allows you to easily embed interactive AI avatars on any website.

## Installation

### Via npm

```bash
npm install @iwy/live-widgets
```

### Via CDN

```html
<!-- jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/npm/@iwy/live-widgets@1.0.0/dist/live-avatar.min.js"></script>

<!-- unpkg CDN -->
<script src="https://unpkg.com/@iwy/live-widgets@1.0.0/dist/live-avatar.min.js"></script>
```

## Usage

### Basic HTML Usage (CDN)

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to my website</h1>

    <!-- Live Avatar Widget -->
    <live-avatar agentid="your-agent-id-here"></live-avatar>
    <script src="https://cdn.jsdelivr.net/npm/@iwy/live-widgets@1.0.0/dist/live-avatar.min.js"></script>
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

The widget accepts the following attributes:

- `agentid` (required): Your agent ID from iwy.ai
- `data-endpoint` (optional): Custom API endpoint for session management

### Custom Endpoint

```html
<live-avatar
  agentid="your-agent-id"
  data-endpoint="https://your-api.com/start-session">
</live-avatar>
```

## Features

- ✨ Floating avatar widget in bottom-right corner
- 📱 Responsive design (scales on mobile)
- 🎥 Live video chat with AI agents
- 🎤 Real-time audio visualization
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