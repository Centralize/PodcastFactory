import { AudioMixer } from './components/audio-editor/AudioMixer';
import { VideoGenerator } from './components/video-generator/VideoGenerator';
import { VideoGeneratorUI } from './components/video-generator/VideoGeneratorUI';
import { AudioProcessor } from './services/audio-processing/AudioProcessor';
import { AudioProcessorUI } from './components/audio-editor/AudioProcessorUI';
import { AITools } from './components/ai-tools/AITools';
import { AudioVideoSync } from './services/video-processing/AudioVideoSync';
import { VideoExporter } from './services/video-processing/VideoExporter';

class PodcastFactory {
  private audioMixer!: AudioMixer;
  private videoGenerator!: VideoGenerator;
  private videoGeneratorUI!: VideoGeneratorUI;
  private audioProcessor!: AudioProcessor;
  private audioProcessorUI!: AudioProcessorUI;
  private aiTools!: AITools;
  private audioVideoSync!: AudioVideoSync;
  private videoExporter!: VideoExporter;
  private currentTool: string = 'audio-mixer';

  constructor() {
    this.init();
  }

  private init(): void {
    this.audioMixer = new AudioMixer();
    this.videoGenerator = new VideoGenerator();
    this.audioProcessor = new AudioProcessor();
    this.audioProcessorUI = new AudioProcessorUI();
    this.aiTools = new AITools();

    // Initialize video services
    this.audioVideoSync = new AudioVideoSync(
      this.videoGenerator.getVideoProcessor(),
      this.audioProcessor
    );
    this.videoExporter = new VideoExporter();

    // Initialize video UI (will replace the basic UI in VideoGenerator)
    this.videoGeneratorUI = new VideoGeneratorUI(this.videoGenerator, {
      containerId: 'video-generator-panel',
      showAdvancedSettings: true,
      enablePresets: true,
      enableEffects: true
    });

    this.setupEventListeners();
    this.setupVideoIntegration();
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

    document.getElementById('snap-toggle')?.addEventListener('click', () => {
      this.audioMixer.toggleSnap();
    });

    document.getElementById('generate-video-with-audio')?.addEventListener('click', () => {
      this.generateVideoWithCurrentAudio();
    });

    // Connect audio mixer selection to processor UI
    this.setupAudioProcessorIntegration();
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

  private setupAudioProcessorIntegration(): void {
    // Connect track selection from audio mixer to processor UI
    this.audioMixer.setTrackSelectionCallback((track) => {
      this.audioProcessorUI.setSelectedTrack(track);
    });
    console.log('Audio processor integration set up');
  }

  public selectTrackForProcessing(trackId: string): void {
    const track = this.audioMixer.getAudioTracks().find(t => t.id === trackId);
    this.audioProcessorUI.setSelectedTrack(track || null);

    if (track) {
      console.log(`Selected track for processing: ${track.filename}`);
    }
  }

  private setupVideoIntegration(): void {
    // Set up video generator event handlers
    this.videoGenerator.setEventHandlers({
      onVideoGenerated: (blob: Blob) => {
        console.log('Video generated:', blob.size, 'bytes');
        // Enable download or further processing
      },
      onProgress: (progress: number) => {
        console.log('Video generation progress:', progress + '%');
      },
      onError: (error: Error) => {
        console.error('Video generation error:', error);
        alert('Video generation failed: ' + error.message);
      }
    });

    // Set up video exporter event handlers
    this.videoExporter.setEventHandlers({
      onProgress: (progress) => {
        console.log('Export progress:', progress);
      },
      onComplete: (result) => {
        console.log('Export completed:', result);
        this.videoExporter.downloadResult(result);
      },
      onError: (error) => {
        console.error('Export error:', error);
        alert('Export failed: ' + error.message);
      }
    });

    console.log('Video integration set up');
  }

  public async generateVideoWithCurrentAudio(): Promise<void> {
    try {
      const audioTracks = this.audioMixer.getAudioTracks();

      if (audioTracks.length === 0) {
        alert('Please add some audio tracks first');
        return;
      }

      // Switch to video generator tool
      this.showTool('video-generator');

      // Generate video with synchronized audio
      const result = await this.audioVideoSync.generateVideoWithAudio(audioTracks);

      // Export the final video
      await this.videoExporter.exportVideo(
        result.videoBlob,
        this.audioVideoSync.exportAudioAsWAV(result.audioBuffer),
        {
          format: 'webm',
          quality: 'medium',
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          bitrate: 5000000
        },
        'podcast-with-audio'
      );

      console.log('Video with audio generated successfully');
    } catch (error) {
      console.error('Error generating video with audio:', error);
      alert('Failed to generate video: ' + (error as Error).message);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PodcastFactory();
});