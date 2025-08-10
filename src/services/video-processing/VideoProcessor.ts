import { Resolution, AspectRatio } from '../../types/project';

export interface VideoProcessingSettings {
  resolution: Resolution;
  aspectRatio: AspectRatio;
  frameRate: number;
  quality: 'low' | 'medium' | 'high';
  bitrate: number;
}

export interface VideoClip {
  id: string;
  type: 'image' | 'video';
  src: string;
  duration: number;
  startTime: number;
  endTime: number;
  effects: VideoEffect[];
}

export interface VideoEffect {
  type: 'fade' | 'zoom' | 'pan' | 'blur' | 'brightness' | 'contrast';
  parameters: Record<string, number>;
  enabled: boolean;
}

export interface VideoFrame {
  canvas: HTMLCanvasElement;
  timestamp: number;
}

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: VideoProcessingSettings;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.settings = this.getDefaultSettings();
    this.setupCanvas();
    console.log('VideoProcessor initialized');
  }

  private getDefaultSettings(): VideoProcessingSettings {
    return {
      resolution: { width: 1920, height: 1080 },
      aspectRatio: { width: 16, height: 9 },
      frameRate: 30,
      quality: 'medium',
      bitrate: 5000000 // 5 Mbps
    };
  }

  private setupCanvas(): void {
    this.canvas.width = this.settings.resolution.width;
    this.canvas.height = this.settings.resolution.height;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public updateSettings(newSettings: Partial<VideoProcessingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.setupCanvas();
    console.log('Video processing settings updated:', this.settings);
  }

  public getSettings(): VideoProcessingSettings {
    return { ...this.settings };
  }

  public async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  public async loadVideo(src: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.onloadedmetadata = () => resolve(video);
      video.onerror = reject;
      video.src = src;
    });
  }

  public drawImageToCanvas(
    image: HTMLImageElement, 
    x: number = 0, 
    y: number = 0, 
    width?: number, 
    height?: number
  ): void {
    const drawWidth = width || this.canvas.width;
    const drawHeight = height || this.canvas.height;
    
    // Calculate aspect ratio preserving dimensions
    const imageAspect = image.width / image.height;
    const canvasAspect = drawWidth / drawHeight;
    
    let sourceX = 0, sourceY = 0, sourceWidth = image.width, sourceHeight = image.height;
    
    if (imageAspect > canvasAspect) {
      // Image is wider than canvas
      sourceWidth = image.height * canvasAspect;
      sourceX = (image.width - sourceWidth) / 2;
    } else {
      // Image is taller than canvas
      sourceHeight = image.width / canvasAspect;
      sourceY = (image.height - sourceHeight) / 2;
    }
    
    this.ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      x, y, drawWidth, drawHeight
    );
  }

  public drawVideoFrameToCanvas(
    video: HTMLVideoElement,
    x: number = 0,
    y: number = 0,
    width?: number,
    height?: number
  ): void {
    const drawWidth = width || this.canvas.width;
    const drawHeight = height || this.canvas.height;
    
    this.ctx.drawImage(video, x, y, drawWidth, drawHeight);
  }

  public clearCanvas(): void {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public applyEffect(effect: VideoEffect): void {
    switch (effect.type) {
      case 'brightness':
        this.applyBrightnessEffect(effect.parameters.value || 0);
        break;
      case 'contrast':
        this.applyContrastEffect(effect.parameters.value || 1);
        break;
      case 'blur':
        this.applyBlurEffect(effect.parameters.radius || 0);
        break;
      default:
        console.warn(`Effect ${effect.type} not implemented`);
    }
  }

  private applyBrightnessEffect(brightness: number): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + brightness));     // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness)); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness)); // Blue
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  private applyContrastEffect(contrast: number): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // Red
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // Blue
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  private applyBlurEffect(radius: number): void {
    if (radius <= 0) return;
    
    this.ctx.filter = `blur(${radius}px)`;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.filter = 'none';
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getCanvasDataURL(format: string = 'image/png', quality?: number): string {
    return this.canvas.toDataURL(format, quality);
  }

  public async startRecording(): Promise<void> {
    if (this.mediaRecorder) {
      console.warn('Recording already in progress');
      return;
    }

    const stream = this.canvas.captureStream(this.settings.frameRate);
    
    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: this.settings.bitrate
    };

    // Fallback to VP8 if VP9 is not supported
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      options.mimeType = 'video/webm;codecs=vp8';
    }

    this.mediaRecorder = new MediaRecorder(stream, options);
    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    console.log('Video recording started');
  }

  public stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.mediaRecorder = null;
        this.recordedChunks = [];
        console.log('Video recording stopped');
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  public async createImageToVideoSequence(
    imageSrc: string,
    duration: number,
    effects: VideoEffect[] = []
  ): Promise<void> {
    const image = await this.loadImage(imageSrc);
    const frameCount = Math.ceil(duration * this.settings.frameRate);
    const frameInterval = 1000 / this.settings.frameRate;

    await this.startRecording();

    for (let frame = 0; frame < frameCount; frame++) {
      this.clearCanvas();
      this.drawImageToCanvas(image);
      
      // Apply effects
      effects.forEach(effect => {
        if (effect.enabled) {
          this.applyEffect(effect);
        }
      });

      // Wait for next frame
      await new Promise(resolve => setTimeout(resolve, frameInterval));
    }
  }

  public downloadVideo(blob: Blob, filename: string = 'video.webm'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
