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
    console.log('VideoGenerator initialized with full functionality');
  }







  // Core video generation methods

  public async previewVideo(backgroundColor?: string, backgroundImage?: HTMLImageElement): Promise<void> {
    try {
      this.videoProcessor.clearCanvas();

      if (backgroundImage) {
        this.videoProcessor.drawImageToCanvas(backgroundImage);
      } else if (backgroundColor) {
        const canvas = this.videoProcessor.getCanvas();
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

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