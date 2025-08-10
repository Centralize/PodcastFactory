import { VideoGenerator } from './VideoGenerator';
import { VIDEO_PRESETS, QUALITY_PRESETS } from '../../types/video';

export interface VideoGeneratorUIConfig {
  containerId: string;
  showAdvancedSettings?: boolean;
  enablePresets?: boolean;
  enableEffects?: boolean;
}

export class VideoGeneratorUI {
  private videoGenerator: VideoGenerator;
  private config: VideoGeneratorUIConfig;
  private container: HTMLElement;

  constructor(videoGenerator: VideoGenerator, config: VideoGeneratorUIConfig) {
    this.videoGenerator = videoGenerator;
    this.config = config;
    this.container = document.getElementById(config.containerId)!;
    
    if (!this.container) {
      throw new Error(`Container with ID '${config.containerId}' not found`);
    }

    this.render();
    this.setupEventListeners();
    console.log('VideoGeneratorUI initialized');
  }

  private render(): void {
    this.container.innerHTML = this.getUITemplate();
  }

  private getUITemplate(): string {
    return `
      <div class="video-generator-ui">
        <h3>Video Generator</h3>
        
        <!-- Quick Actions -->
        <div class="uk-card uk-card-default uk-card-body uk-margin">
          <h4 class="uk-card-title">Quick Actions</h4>
          <div class="uk-button-group uk-width-1-1">
            <button id="quick-youtube" class="uk-button uk-button-default">
              <span uk-icon="social"></span> YouTube Video
            </button>
            <button id="quick-instagram" class="uk-button uk-button-default">
              <span uk-icon="instagram"></span> Instagram Post
            </button>
            <button id="quick-tiktok" class="uk-button uk-button-default">
              <span uk-icon="play-circle"></span> TikTok Video
            </button>
          </div>
        </div>

        <div class="uk-grid-small" uk-grid>
          <!-- Video Settings Panel -->
          <div class="uk-width-1-3@m">
            ${this.getVideoSettingsPanel()}
          </div>

          <!-- Background Panel -->
          <div class="uk-width-1-3@m">
            ${this.getBackgroundPanel()}
          </div>

          <!-- Effects Panel -->
          <div class="uk-width-1-3@m">
            ${this.getEffectsPanel()}
          </div>

          <!-- Preview Panel -->
          <div class="uk-width-1-1">
            ${this.getPreviewPanel()}
          </div>

          <!-- Export Panel -->
          <div class="uk-width-1-1">
            ${this.getExportPanel()}
          </div>
        </div>
      </div>
    `;
  }

  private getVideoSettingsPanel(): string {
    return `
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Video Settings</h4>
        
        <div class="uk-margin">
          <label class="uk-form-label">Preset</label>
          <select id="video-preset" class="uk-select">
            ${Object.keys(VIDEO_PRESETS).map(preset => 
              `<option value="${preset}">${this.formatPresetName(preset)}</option>`
            ).join('')}
          </select>
        </div>

        <div class="uk-grid-small uk-margin" uk-grid>
          <div class="uk-width-1-2">
            <label class="uk-form-label">Width</label>
            <input id="video-width" class="uk-input" type="number" value="1920">
          </div>
          <div class="uk-width-1-2">
            <label class="uk-form-label">Height</label>
            <input id="video-height" class="uk-input" type="number" value="1080">
          </div>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">Quality</label>
          <select id="video-quality" class="uk-select">
            ${Object.keys(QUALITY_PRESETS).map(quality => 
              `<option value="${quality}" ${quality === 'medium' ? 'selected' : ''}>${quality.charAt(0).toUpperCase() + quality.slice(1)}</option>`
            ).join('')}
          </select>
        </div>

        <div class="uk-grid-small uk-margin" uk-grid>
          <div class="uk-width-1-2">
            <label class="uk-form-label">Frame Rate</label>
            <select id="video-framerate" class="uk-select">
              <option value="24">24 fps</option>
              <option value="30" selected>30 fps</option>
              <option value="60">60 fps</option>
            </select>
          </div>
          <div class="uk-width-1-2">
            <label class="uk-form-label">Duration (s)</label>
            <input id="video-duration" class="uk-input" type="number" value="10" min="1" max="300">
          </div>
        </div>

        ${this.config.showAdvancedSettings ? this.getAdvancedSettings() : ''}
      </div>
    `;
  }

  private getAdvancedSettings(): string {
    return `
      <div class="uk-margin">
        <button class="uk-button uk-button-text" type="button" uk-toggle="target: #advanced-settings">
          <span uk-icon="settings"></span> Advanced Settings
        </button>
        <div id="advanced-settings" class="uk-margin-top" hidden>
          <div class="uk-margin">
            <label class="uk-form-label">Bitrate (Mbps)</label>
            <input id="video-bitrate" class="uk-input" type="number" value="5" min="1" max="50" step="0.1">
          </div>
          <div class="uk-margin">
            <label class="uk-form-label">Codec</label>
            <select id="video-codec" class="uk-select">
              <option value="vp9">VP9</option>
              <option value="vp8">VP8</option>
              <option value="h264">H.264</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private getBackgroundPanel(): string {
    return `
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Background</h4>
        
        <div class="uk-margin">
          <label class="uk-form-label">Type</label>
          <select id="background-type" class="uk-select">
            <option value="color">Solid Color</option>
            <option value="gradient">Gradient</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div id="color-settings" class="background-setting">
          <div class="uk-margin">
            <label class="uk-form-label">Color</label>
            <input id="background-color" class="uk-input" type="color" value="#000000">
          </div>
        </div>

        <div id="gradient-settings" class="background-setting" style="display: none;">
          <div class="uk-grid-small uk-margin" uk-grid>
            <div class="uk-width-1-2">
              <label class="uk-form-label">Start Color</label>
              <input id="gradient-start" class="uk-input" type="color" value="#000000">
            </div>
            <div class="uk-width-1-2">
              <label class="uk-form-label">End Color</label>
              <input id="gradient-end" class="uk-input" type="color" value="#ffffff">
            </div>
          </div>
          <div class="uk-margin">
            <label class="uk-form-label">Direction</label>
            <select id="gradient-direction" class="uk-select">
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="diagonal">Diagonal</option>
              <option value="radial">Radial</option>
            </select>
          </div>
        </div>

        <div id="file-settings" class="background-setting" style="display: none;">
          <div class="uk-margin">
            <div uk-form-custom="target: true">
              <input id="background-file" type="file" accept="image/*,video/*">
              <input class="uk-input" type="text" placeholder="Select file..." disabled>
            </div>
          </div>
          
          <div class="uk-margin">
            <label class="uk-form-label">Fit</label>
            <select id="background-fit" class="uk-select">
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="stretch">Stretch</option>
            </select>
          </div>
        </div>

        <div class="uk-margin">
          <button id="apply-background-btn" class="uk-button uk-button-primary uk-width-1-1">
            Apply Background
          </button>
        </div>
      </div>
    `;
  }

  private getEffectsPanel(): string {
    if (!this.config.enableEffects) {
      return '<div class="uk-card uk-card-default uk-card-body"><h4 class="uk-card-title">Effects</h4><p class="uk-text-muted">Effects coming soon...</p></div>';
    }

    return `
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Effects</h4>
        
        <div class="uk-margin">
          <label class="uk-form-label">
            <input id="effect-fade" class="uk-checkbox" type="checkbox"> Fade In/Out
          </label>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">
            <input id="effect-zoom" class="uk-checkbox" type="checkbox"> Ken Burns Effect
          </label>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">Brightness</label>
          <input id="effect-brightness" class="uk-range" type="range" min="-100" max="100" value="0">
          <span id="brightness-value">0</span>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">Contrast</label>
          <input id="effect-contrast" class="uk-range" type="range" min="0" max="200" value="100">
          <span id="contrast-value">100%</span>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">Blur</label>
          <input id="effect-blur" class="uk-range" type="range" min="0" max="20" value="0">
          <span id="blur-value">0px</span>
        </div>
      </div>
    `;
  }

  private getPreviewPanel(): string {
    return `
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Preview</h4>
        
        <div id="video-preview-container" class="uk-text-center uk-margin">
          <canvas id="video-preview-canvas" 
                  style="max-width: 100%; max-height: 400px; border: 1px solid #e5e5e5; background: #f8f8f8;">
          </canvas>
        </div>
        
        <div class="uk-margin uk-text-center">
          <button id="preview-btn" class="uk-button uk-button-secondary uk-margin-small-right">
            <span uk-icon="play"></span> Update Preview
          </button>
          <button id="fullscreen-preview-btn" class="uk-button uk-button-default">
            <span uk-icon="expand"></span> Fullscreen
          </button>
        </div>
      </div>
    `;
  }

  private getExportPanel(): string {
    return `
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Export</h4>
        
        <div class="uk-grid-small uk-margin" uk-grid>
          <div class="uk-width-1-2">
            <label class="uk-form-label">Format</label>
            <select id="export-format" class="uk-select">
              <option value="webm">WebM</option>
              <option value="mp4">MP4 (coming soon)</option>
            </select>
          </div>
          <div class="uk-width-1-2">
            <label class="uk-form-label">Filename</label>
            <input id="export-filename" class="uk-input" type="text" value="podcast-video">
          </div>
        </div>

        <div class="uk-margin uk-text-center">
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
          <div id="progress-details" class="uk-text-small uk-text-muted"></div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Quick action buttons
    this.setupQuickActions();

    // Background type change
    const backgroundType = this.container.querySelector('#background-type') as HTMLSelectElement;
    backgroundType?.addEventListener('change', () => this.handleBackgroundTypeChange());

    // File upload
    const backgroundFile = this.container.querySelector('#background-file') as HTMLInputElement;
    backgroundFile?.addEventListener('change', () => this.handleFileUpload());

    // Apply background button
    const applyBackgroundBtn = this.container.querySelector('#apply-background-btn');
    applyBackgroundBtn?.addEventListener('click', () => this.applyBackground());

    // Effect sliders
    this.setupEffectSliders();

    // Preview and generation buttons
    const previewBtn = this.container.querySelector('#preview-btn');
    previewBtn?.addEventListener('click', () => this.handlePreview());

    const generateBtn = this.container.querySelector('#generate-btn');
    generateBtn?.addEventListener('click', () => this.videoGenerator.generateVideo());
  }

  private setupQuickActions(): void {
    const quickYoutube = this.container.querySelector('#quick-youtube');
    quickYoutube?.addEventListener('click', () => this.applyPreset('YOUTUBE_16_9'));

    const quickInstagram = this.container.querySelector('#quick-instagram');
    quickInstagram?.addEventListener('click', () => this.applyPreset('INSTAGRAM_POST'));

    const quickTiktok = this.container.querySelector('#quick-tiktok');
    quickTiktok?.addEventListener('click', () => this.applyPreset('TIKTOK'));
  }

  private setupEffectSliders(): void {
    const brightnessSlider = this.container.querySelector('#effect-brightness') as HTMLInputElement;
    const brightnessValue = this.container.querySelector('#brightness-value');
    
    brightnessSlider?.addEventListener('input', () => {
      if (brightnessValue) brightnessValue.textContent = brightnessSlider.value;
    });

    const contrastSlider = this.container.querySelector('#effect-contrast') as HTMLInputElement;
    const contrastValue = this.container.querySelector('#contrast-value');
    
    contrastSlider?.addEventListener('input', () => {
      if (contrastValue) contrastValue.textContent = contrastSlider.value + '%';
    });

    const blurSlider = this.container.querySelector('#effect-blur') as HTMLInputElement;
    const blurValue = this.container.querySelector('#blur-value');
    
    blurSlider?.addEventListener('input', () => {
      if (blurValue) blurValue.textContent = blurSlider.value + 'px';
    });
  }

  private handleBackgroundTypeChange(): void {
    const backgroundType = this.container.querySelector('#background-type') as HTMLSelectElement;
    const settings = this.container.querySelectorAll('.background-setting');
    
    // Hide all settings
    settings.forEach(setting => {
      (setting as HTMLElement).style.display = 'none';
    });
    
    // Show relevant setting
    const targetSetting = this.container.querySelector(`#${backgroundType.value}-settings`);
    if (targetSetting) {
      (targetSetting as HTMLElement).style.display = 'block';
    }
  }

  private applyPreset(presetName: string): void {
    const presetSelect = this.container.querySelector('#video-preset') as HTMLSelectElement;
    if (presetSelect) {
      presetSelect.value = presetName;
      presetSelect.dispatchEvent(new Event('change'));
    }
  }

  private async handleFileUpload(): Promise<void> {
    const fileInput = this.container.querySelector('#background-file') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) return;

    try {
      const url = URL.createObjectURL(file);

      if (file.type.startsWith('image/')) {
        const image = await this.videoGenerator.getVideoProcessor().loadImage(url);
        this.videoGenerator.getVideoProcessor().clearCanvas();
        this.videoGenerator.getVideoProcessor().drawImageToCanvas(image);
        this.updatePreviewCanvas();
        console.log('Background image loaded');
      } else if (file.type.startsWith('video/')) {
        await this.videoGenerator.getVideoProcessor().loadVideo(url);
        console.log('Background video loaded');
      }

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error loading background file:', error);
      alert('Error loading file: ' + (error as Error).message);
    }
  }

  private applyBackground(): void {
    const backgroundType = this.container.querySelector('#background-type') as HTMLSelectElement;

    if (backgroundType.value === 'color') {
      const colorInput = this.container.querySelector('#background-color') as HTMLInputElement;
      const color = colorInput.value;

      const canvas = this.videoGenerator.getVideoProcessor().getCanvas();
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.updatePreviewCanvas();
      console.log('Applied color background:', color);
    } else if (backgroundType.value === 'gradient') {
      this.applyGradientBackground();
    }
  }

  private applyGradientBackground(): void {
    const startColor = (this.container.querySelector('#gradient-start') as HTMLInputElement).value;
    const endColor = (this.container.querySelector('#gradient-end') as HTMLInputElement).value;
    const direction = (this.container.querySelector('#gradient-direction') as HTMLSelectElement).value;

    const canvas = this.videoGenerator.getVideoProcessor().getCanvas();
    const ctx = canvas.getContext('2d')!;

    let gradient: CanvasGradient;

    switch (direction) {
      case 'horizontal':
        gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        break;
      case 'vertical':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        break;
      case 'diagonal':
        gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        break;
      case 'radial':
        gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2
        );
        break;
      default:
        gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    }

    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.updatePreviewCanvas();
    console.log('Applied gradient background');
  }

  private async handlePreview(): Promise<void> {
    const backgroundType = this.container.querySelector('#background-type') as HTMLSelectElement;

    if (backgroundType.value === 'color') {
      const colorInput = this.container.querySelector('#background-color') as HTMLInputElement;
      await this.videoGenerator.previewVideo(colorInput.value);
    } else if (backgroundType.value === 'gradient') {
      // Apply gradient first, then preview
      this.applyGradientBackground();
    } else if (backgroundType.value === 'image') {
      const fileInput = this.container.querySelector('#background-file') as HTMLInputElement;
      const file = fileInput.files?.[0];

      if (file && file.type.startsWith('image/')) {
        try {
          const url = URL.createObjectURL(file);
          const image = await this.videoGenerator.getVideoProcessor().loadImage(url);
          await this.videoGenerator.previewVideo(undefined, image);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error loading image for preview:', error);
          alert('Error loading image: ' + (error as Error).message);
        }
      } else {
        alert('Please select an image file first');
      }
    }

    this.updatePreviewCanvas();
  }

  private updatePreviewCanvas(): void {
    const canvas = this.videoGenerator.getVideoProcessor().getCanvas();
    const previewCanvas = this.container.querySelector('#video-preview-canvas') as HTMLCanvasElement;

    if (previewCanvas && canvas) {
      const ctx = previewCanvas.getContext('2d');
      if (ctx) {
        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
      }
    }
  }

  private formatPresetName(preset: string): string {
    return preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  public destroy(): void {
    // Clean up event listeners and resources
    console.log('VideoGeneratorUI destroyed');
  }
}
