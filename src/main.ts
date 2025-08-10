import { AudioMixer } from './components/audio-editor/AudioMixer';
import { VideoGenerator } from './components/video-generator/VideoGenerator';
import { AudioProcessor } from './services/audio-processing/AudioProcessor';
import { AITools } from './components/ai-tools/AITools';

class PodcastFactory {
  private audioMixer: AudioMixer;
  private videoGenerator: VideoGenerator;
  private audioProcessor: AudioProcessor;
  private aiTools: AITools;
  private currentTool: string = 'audio-mixer';

  constructor() {
    this.init();
  }

  private init(): void {
    this.audioMixer = new AudioMixer();
    this.videoGenerator = new VideoGenerator();
    this.audioProcessor = new AudioProcessor();
    this.aiTools = new AITools();

    this.setupEventListeners();
    this.showTool('audio-mixer');
  }

  private setupEventListeners(): void {
    document.querySelectorAll('[data-tool]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const tool = (e.target as HTMLElement).getAttribute('data-tool');
        if (tool) {
          this.showTool(tool);
        }
      });
    });

    document.getElementById('new-project')?.addEventListener('click', () => {
      this.newProject();
    });

    document.getElementById('open-project')?.addEventListener('click', () => {
      this.openProject();
    });

    document.getElementById('save-project')?.addEventListener('click', () => {
      this.saveProject();
    });

    document.getElementById('zoom-in')?.addEventListener('click', () => {
      this.audioMixer.zoomIn();
    });

    document.getElementById('zoom-out')?.addEventListener('click', () => {
      this.audioMixer.zoomOut();
    });

    document.getElementById('zoom-reset')?.addEventListener('click', () => {
      this.audioMixer.resetZoom();
    });
  }

  private showTool(toolName: string): void {
    document.querySelectorAll('.tool-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    document.querySelectorAll('[data-tool]').forEach(button => {
      button.parentElement?.classList.remove('uk-active');
    });

    const panel = document.getElementById(`${toolName}-panel`);
    const button = document.querySelector(`[data-tool="${toolName}"]`);
    
    if (panel) {
      panel.classList.add('active');
    }
    
    if (button) {
      button.parentElement?.classList.add('uk-active');
    }

    this.currentTool = toolName;
  }

  private newProject(): void {
    if (confirm('Create a new project? Unsaved changes will be lost.')) {
      this.audioMixer.clearProject();
      console.log('New project created');
    }
  }

  private openProject(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const projectData = JSON.parse(e.target?.result as string);
            console.log('Project loaded:', projectData);
          } catch (error) {
            alert('Invalid project file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  private saveProject(): void {
    const projectData = {
      name: 'Untitled Project',
      createdDate: new Date(),
      audioTracks: this.audioMixer.getAudioTracks(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'podcast-project.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PodcastFactory();
});