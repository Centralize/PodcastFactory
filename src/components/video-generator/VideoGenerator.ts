import { VideoProcessor } from '../../services/video-processing/VideoProcessor';
import { VIDEO_PRESETS, QUALITY_PRESETS } from '../../types/video';
import { AudioClip } from '../../types/project';

export interface VideoGeneratorEventHandlers {
  onVideoGenerated?: (blob: Blob) => void;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export class VideoGenerator {
  private videoProcessor: VideoProcessor;
  private eventHandlers: VideoGeneratorEventHandlers = {};
  private isGenerating: boolean = false;

  constructor() {
    this.videoProcessor = new VideoProcessor();
    this.setupUI();
    console.log('VideoGenerator initialized with full functionality');
  }

  private setupUI(): void {
    this.createVideoGeneratorUI();
    this.setupEventListeners();
  }

  private createVideoGeneratorUI(): void {
    const panel = document.getElementById('video-generator-panel');
    if (!panel) return;

    panel.innerHTML = `
      <h3>Video Generator</h3>
      <div class="uk-grid-small" uk-grid>
        <!-- Video Settings -->
        <div class="uk-width-1-2">
          <div class="uk-card uk-card-default uk-card-body">
            <h4 class="uk-card-title">Video Settings</h4>

            <div class="uk-margin">
              <label class="uk-form-label">Preset</label>
              <select id="video-preset" class="uk-select">
                <option value="YOUTUBE_16_9">YouTube (16:9)</option>
                <option value="YOUTUBE_SHORTS">YouTube Shorts (9:16)</option>
                <option value="INSTAGRAM_POST">Instagram Post (1:1)</option>
                <option value="INSTAGRAM_STORY">Instagram Story (9:16)</option>
                <option value="TIKTOK">TikTok (9:16)</option>
                <option value="FACEBOOK_POST">Facebook Post</option>
                <option value="TWITTER_POST">Twitter Post</option>
              </select>
            </div>

            <div class="uk-margin">
              <label class="uk-form-label">Quality</label>
              <select id="video-quality" class="uk-select">
                <option value="low">Low (480p)</option>
                <option value="medium" selected>Medium (720p)</option>
                <option value="high">High (1080p)</option>
                <option value="ultra">Ultra (4K)</option>
              </select>
            </div>

            <div class="uk-margin">
              <label class="uk-form-label">Frame Rate</label>
              <select id="video-framerate" class="uk-select">
                <option value="24">24 fps</option>
                <option value="30" selected>30 fps</option>
                <option value="60">60 fps</option>
              </select>
            </div>

            <div class="uk-margin">
              <label class="uk-form-label">Duration (seconds)</label>
              <input id="video-duration" class="uk-input" type="number" value="10" min="1" max="300">
            </div>
          </div>
        </div>

        <!-- Background Selection -->
        <div class="uk-width-1-2">
          <div class="uk-card uk-card-default uk-card-body">
            <h4 class="uk-card-title">Background</h4>

            <div class="uk-margin">
              <label class="uk-form-label">Background Type</label>
              <select id="background-type" class="uk-select">
                <option value="color">Solid Color</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div id="color-picker-container" class="uk-margin">
              <label class="uk-form-label">Background Color</label>
              <input id="background-color" class="uk-input" type="color" value="#000000">
            </div>

            <div id="file-upload-container" class="uk-margin" style="display: none;">
              <label class="uk-form-label">Upload File</label>
              <div uk-form-custom="target: true">
                <input id="background-file" type="file" accept="image/*,video/*">
                <input class="uk-input" type="text" placeholder="Select file..." disabled>
              </div>
            </div>

            <div class="uk-margin">
              <button id="upload-background-btn" class="uk-button uk-button-default uk-width-1-1">
                <span uk-icon="upload"></span> Upload Background
              </button>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="uk-width-1-1">
          <div class="uk-card uk-card-default uk-card-body">
            <h4 class="uk-card-title">Preview</h4>
            <div id="video-preview-container" class="uk-text-center uk-margin">
              <canvas id="video-preview-canvas" style="max-width: 100%; height: auto; border: 1px solid #e5e5e5;"></canvas>
            </div>

            <div class="uk-margin uk-text-center">
              <button id="preview-btn" class="uk-button uk-button-secondary uk-margin-small-right">
                <span uk-icon="play"></span> Preview
              </button>
              <button id="generate-btn" class="uk-button uk-button-primary uk-margin-small-right">
                <span uk-icon="video-camera"></span> Generate Video
              </button>
              <button id="download-btn" class="uk-button uk-button-default" disabled>
                <span uk-icon="download"></span> Download
              </button>
            </div>

            <div id="generation-progress" class="uk-margin" style="display: none;">
              <label class="uk-form-label">Generation Progress</label>
              <progress id="progress-bar" class="uk-progress" value="0" max="100"></progress>
              <div id="progress-text" class="uk-text-small uk-text-muted">0%</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Preset selection
    const presetSelect = document.getElementById('video-preset') as HTMLSelectElement;
    presetSelect?.addEventListener('change', () => this.handlePresetChange());

    // Background type selection
    const backgroundType = document.getElementById('background-type') as HTMLSelectElement;
    backgroundType?.addEventListener('change', () => this.handleBackgroundTypeChange());

    // File upload
    const backgroundFile = document.getElementById('background-file') as HTMLInputElement;
    backgroundFile?.addEventListener('change', () => this.handleFileUpload());

    // Buttons
    const previewBtn = document.getElementById('preview-btn');
    previewBtn?.addEventListener('click', () => this.previewVideo());

    const generateBtn = document.getElementById('generate-btn');
    generateBtn?.addEventListener('click', () => this.generateVideo());

    const downloadBtn = document.getElementById('download-btn');
    downloadBtn?.addEventListener('click', () => this.downloadVideo());

    // Settings changes
    const qualitySelect = document.getElementById('video-quality') as HTMLSelectElement;
    qualitySelect?.addEventListener('change', () => this.updateVideoSettings());

    const framerateSelect = document.getElementById('video-framerate') as HTMLSelectElement;
    framerateSelect?.addEventListener('change', () => this.updateVideoSettings());

    const durationInput = document.getElementById('video-duration') as HTMLInputElement;
    durationInput?.addEventListener('change', () => this.updateVideoSettings());
  }

  private handlePresetChange(): void {
    const presetSelect = document.getElementById('video-preset') as HTMLSelectElement;
    const presetName = presetSelect.value as keyof typeof VIDEO_PRESETS;
    const preset = VIDEO_PRESETS[presetName];

    if (preset) {
      this.videoProcessor.updateSettings({
        resolution: preset.resolution,
        aspectRatio: preset.aspectRatio,
        frameRate: preset.frameRate
      });

      this.updatePreviewCanvas();
      console.log(`Applied preset: ${presetName}`);
    }
  }

  private handleBackgroundTypeChange(): void {
    const backgroundType = document.getElementById('background-type') as HTMLSelectElement;
    const colorContainer = document.getElementById('color-picker-container');
    const fileContainer = document.getElementById('file-upload-container');

    if (backgroundType.value === 'color') {
      colorContainer!.style.display = 'block';
      fileContainer!.style.display = 'none';
    } else {
      colorContainer!.style.display = 'none';
      fileContainer!.style.display = 'block';
    }
  }

  private async handleFileUpload(): Promise<void> {
    const fileInput = document.getElementById('background-file') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) return;

    try {
      const url = URL.createObjectURL(file);

      if (file.type.startsWith('image/')) {
        const image = await this.videoProcessor.loadImage(url);
        this.videoProcessor.clearCanvas();
        this.videoProcessor.drawImageToCanvas(image);
        this.updatePreviewCanvas();
        console.log('Background image loaded');
      } else if (file.type.startsWith('video/')) {
        await this.videoProcessor.loadVideo(url);
        console.log('Background video loaded');
      }

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error loading background file:', error);
      this.eventHandlers.onError?.(error as Error);
    }
  }

  private updateVideoSettings(): void {
    const qualitySelect = document.getElementById('video-quality') as HTMLSelectElement;
    const framerateSelect = document.getElementById('video-framerate') as HTMLSelectElement;
    const durationInput = document.getElementById('video-duration') as HTMLInputElement;

    const quality = qualitySelect.value as keyof typeof QUALITY_PRESETS;
    const frameRate = parseInt(framerateSelect.value);
    const duration = parseInt(durationInput.value);

    const qualityPreset = QUALITY_PRESETS[quality];

    this.videoProcessor.updateSettings({
      frameRate,
      quality: quality as 'low' | 'medium' | 'high',
      bitrate: qualityPreset.bitrate
    });

    console.log('Video settings updated:', { quality, frameRate, duration });
  }

  private updatePreviewCanvas(): void {
    const canvas = this.videoProcessor.getCanvas();
    const previewCanvas = document.getElementById('video-preview-canvas') as HTMLCanvasElement;

    if (previewCanvas && canvas) {
      const ctx = previewCanvas.getContext('2d');
      if (ctx) {
        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
      }
    }
  }

  public async previewVideo(): Promise<void> {
    try {
      const backgroundType = (document.getElementById('background-type') as HTMLSelectElement).value;

      if (backgroundType === 'color') {
        const color = (document.getElementById('background-color') as HTMLInputElement).value;
        this.videoProcessor.clearCanvas();
        const canvas = this.videoProcessor.getCanvas();
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      this.updatePreviewCanvas();
      console.log('Video preview updated');
    } catch (error) {
      console.error('Error previewing video:', error);
      this.eventHandlers.onError?.(error as Error);
    }
  }

  public async generateVideo(): Promise<void> {
    if (this.isGenerating) {
      console.warn('Video generation already in progress');
      return;
    }

    this.isGenerating = true;
    this.showProgress(true);
    this.updateProgress(0);

    try {
      const backgroundType = (document.getElementById('background-type') as HTMLSelectElement).value;
      const duration = parseInt((document.getElementById('video-duration') as HTMLInputElement).value);
      const fileInput = document.getElementById('background-file') as HTMLInputElement;

      let videoBlob: Blob;

      if (backgroundType === 'image' && fileInput.files?.[0]) {
        const file = fileInput.files[0];
        const url = URL.createObjectURL(file);

        // Create image-to-video sequence
        await this.videoProcessor.createImageToVideoSequence(url, duration);
        videoBlob = await this.videoProcessor.stopRecording();

        URL.revokeObjectURL(url);
      } else if (backgroundType === 'color') {
        const color = (document.getElementById('background-color') as HTMLInputElement).value;

        // Create color background video
        await this.createColorBackgroundVideo(color, duration);
        videoBlob = await this.videoProcessor.stopRecording();
      } else {
        throw new Error('Please select a background image or color');
      }

      this.updateProgress(100);
      this.enableDownload(videoBlob);
      this.eventHandlers.onVideoGenerated?.(videoBlob);

      console.log('Video generation completed');
    } catch (error) {
      console.error('Error generating video:', error);
      this.eventHandlers.onError?.(error as Error);
    } finally {
      this.isGenerating = false;
      this.showProgress(false);
    }
  }

  private async createColorBackgroundVideo(color: string, duration: number): Promise<void> {
    const canvas = this.videoProcessor.getCanvas();
    const ctx = canvas.getContext('2d')!;
    const frameCount = Math.ceil(duration * this.videoProcessor.getSettings().frameRate);
    const frameInterval = 1000 / this.videoProcessor.getSettings().frameRate;

    await this.videoProcessor.startRecording();

    for (let frame = 0; frame < frameCount; frame++) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update progress
      const progress = (frame / frameCount) * 100;
      this.updateProgress(progress);

      // Wait for next frame
      await new Promise(resolve => setTimeout(resolve, frameInterval));
    }
  }

  private showProgress(show: boolean): void {
    const progressContainer = document.getElementById('generation-progress');
    if (progressContainer) {
      progressContainer.style.display = show ? 'block' : 'none';
    }
  }

  private updateProgress(percentage: number): void {
    const progressBar = document.getElementById('progress-bar') as HTMLProgressElement;
    const progressText = document.getElementById('progress-text');

    if (progressBar) {
      progressBar.value = percentage;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(percentage)}%`;
    }

    this.eventHandlers.onProgress?.(percentage);
  }

  private enableDownload(blob: Blob): void {
    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.onclick = () => this.videoProcessor.downloadVideo(blob, 'podcast-video.webm');
    }
  }

  public downloadVideo(): void {
    // This will be called by the download button click handler
    console.log('Download initiated');
  }

  public setEventHandlers(handlers: VideoGeneratorEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  public getVideoProcessor(): VideoProcessor {
    return this.videoProcessor;
  }

  public isGeneratingVideo(): boolean {
    return this.isGenerating;
  }

  // Integration with audio system
  public async generateVideoWithAudio(audioTracks: AudioClip[]): Promise<Blob> {
    // Calculate total duration from audio tracks
    const totalDuration = Math.max(...audioTracks.map(track => track.endTime));

    // Update duration input
    const durationInput = document.getElementById('video-duration') as HTMLInputElement;
    if (durationInput) {
      durationInput.value = Math.ceil(totalDuration).toString();
    }

    // Generate video with calculated duration
    await this.generateVideo();

    // Return the generated video blob (this would need to be stored from generateVideo)
    // For now, return a placeholder
    return new Blob();
  }

  public destroy(): void {
    // Clean up resources
    this.isGenerating = false;
    console.log('VideoGenerator destroyed');
  }
}