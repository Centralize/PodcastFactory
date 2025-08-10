# Podcast Factory

A comprehensive web application for podcast creation featuring audio mixing, video generation, audio processing, and AI-powered content creation tools.

## 🎯 Overview

Podcast Factory is a browser-based digital audio workstation (DAW) designed specifically for podcast creation. It combines professional audio editing capabilities with modern web technologies to provide an intuitive, powerful platform for content creators.

## ✨ Features

### 🎵 Audio Mixing Engine
- **12-Track Timeline**: Professional multi-track audio editor with numbered tracks
- **Drag & Drop Interface**: Intuitive file management and track arrangement
- **Real-time Preview**: Play mixed audio before final export
- **Track Management**: Move audio clips between tracks and adjust timing
- **Waveform Display**: Visual representation of audio tracks
- **Context Menu**: Right-click for track operations (delete, duplicate, split, properties)

### 🎬 Video Generation *(Coming Soon)*
- **Image-to-Video**: Add static images to audio to create MP4 videos
- **Video Backgrounds**: Support for video backgrounds with audio overlay
- **Multiple Formats**: Support for different aspect ratios (16:9, 1:1, 9:16)
- **Duration Matching**: Automatically match video length to audio duration

### 🔧 Audio Processing *(Coming Soon)*
- **Audio Normalization**: Automatic level adjustment for consistent volume
- **Noise Reduction**: Remove background noise and improve audio quality
- **EQ Controls**: Basic equalizer for frequency adjustment
- **Compression**: Dynamic range compression for professional sound

### 🤖 AI-Powered Tools *(Coming Soon)*
- **NoteGPT Integration**: Convert text to dual persona speech
- **Voice Synthesis**: Generate natural-sounding dialogue between speakers
- **Script Processing**: Transform written content into conversational format
- **Custom Voice Options**: Different voice personalities and styles

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Modern web browser with Web Audio API support
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PodcastFactory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎮 Usage Guide

### Audio Mixing Workflow

1. **Adding Audio Files**
   - Click "Add Audio" button or drag files directly onto the timeline
   - Supported formats: MP3, WAV, AAC, OGG
   - Files are automatically assigned to available tracks

2. **Timeline Navigation**
   - **Horizontal Scroll**: Mouse wheel or arrow keys (←/→)
   - **Vertical Scroll**: Shift + mouse wheel or arrow keys (↑/↓)
   - **Zoom**: Ctrl + mouse wheel or zoom buttons (+/-/100%)
   - **Home/End**: Jump to beginning/end of timeline

3. **Track Management**
   - **Select Track**: Click on any audio clip
   - **Move Track**: Drag horizontally to change timing
   - **Change Track Lane**: Drag vertically between tracks
   - **Right-click Menu**: Access track operations

4. **Context Menu Options**
   - **🗑️ Delete Track**: Remove selected track
   - **📋 Duplicate Track**: Create a copy on available track
   - **✂️ Split Track**: Split track at midpoint
   - **⚙️ Properties**: View track information

5. **Project Management**
   - **New Project**: Clear all tracks and start fresh
   - **Save Project**: Export project as JSON file
   - **Open Project**: Load previously saved project

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `←/→` | Scroll timeline horizontally |
| `↑/↓` | Scroll tracks vertically |
| `Ctrl + Mouse Wheel` | Zoom in/out |
| `Home` | Go to timeline start |
| `End` | Go to timeline end |
| `Ctrl + Home` | Go to top-left corner |
| `Ctrl + End` | Go to bottom-right corner |

## 🏗️ Technical Architecture

### Frontend Stack
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **UIKit**: Responsive CSS framework
- **Web Audio API**: Real-time audio processing
- **Canvas API**: Timeline visualization and waveform rendering

### Project Structure
```
src/
├── components/
│   ├── audio-editor/     # Audio mixing components
│   ├── video-generator/  # Video creation tools
│   └── ai-tools/         # AI integration components
├── services/
│   ├── audio-processing/ # Audio manipulation services
│   ├── video-processing/ # Video generation services
│   └── ai-integration/   # AI API integrations
├── utils/
│   ├── file-handlers/    # File I/O utilities
│   └── audio-utils/      # Audio processing helpers
├── types/                # TypeScript type definitions
└── styles/               # CSS stylesheets
```

### Data Models

#### AudioClip
```typescript
interface AudioClip {
  id: string;
  filename: string;
  duration: number;
  filePath: string;
  startTime: number;
  endTime: number;
  volume: number;
  trackIndex: number;
  effects: AudioEffect[];
}
```

#### Project
```typescript
interface Project {
  id: string;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  audioTracks: AudioClip[];
  videoSettings: VideoSettings;
  exportPreferences: ExportPreferences;
}
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Development Guidelines

1. **Code Style**: Follow TypeScript best practices
2. **Components**: Use modular, reusable components
3. **Types**: Define interfaces for all data structures
4. **Performance**: Optimize canvas rendering and audio processing
5. **Testing**: Write tests for critical functionality

### Browser Compatibility

- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

*Requires Web Audio API support*

## 🗺️ Roadmap

### Phase 1: Core Audio Mixing ✅
- [x] Multi-track timeline interface
- [x] Drag and drop functionality
- [x] Basic audio file support
- [x] Project save/load
- [x] Context menu operations

### Phase 2: Audio Processing *(In Progress)*
- [ ] Audio normalization
- [ ] Noise reduction
- [ ] EQ controls
- [ ] Real-time effects

### Phase 3: Video Generation *(Planned)*
- [ ] Image-to-video conversion
- [ ] Video background support
- [ ] MP4 export functionality
- [ ] Multiple aspect ratios

### Phase 4: AI Integration *(Planned)*
- [ ] NoteGPT API integration
- [ ] Dual persona voice generation
- [ ] Script processing pipeline
- [ ] Voice customization

### Phase 5: Advanced Features *(Future)*
- [ ] Cloud storage integration
- [ ] Collaborative editing
- [ ] Advanced audio effects
- [ ] Mobile app version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Make your changes
4. Run tests: `npm test` (when available)
5. Run linting: `npm run lint`
6. Submit pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Audio files won't load**
- Ensure files are in supported formats (MP3, WAV, AAC, OGG)
- Check browser console for error messages
- Verify Web Audio API support in your browser

**Performance issues with large files**
- Use compressed audio formats
- Close other browser tabs
- Consider splitting large files

**Timeline not responding**
- Refresh the page
- Check if JavaScript is enabled
- Clear browser cache

### Getting Help

- 📧 Email: support@podcastfactory.com
- 💬 Discord: [Join our community](https://discord.gg/podcastfactory)
- 🐛 Issues: [GitHub Issues](https://github.com/username/podcastfactory/issues)
- 📖 Documentation: [Wiki](https://github.com/username/podcastfactory/wiki)

## 🙏 Acknowledgments

- UIKit for the responsive CSS framework
- Web Audio API for audio processing capabilities
- Vite for the excellent development experience
- TypeScript for type safety and developer experience

---

**Made with ❤️ for podcast creators worldwide**

*Podcast Factory - Where Audio Meets Innovation*