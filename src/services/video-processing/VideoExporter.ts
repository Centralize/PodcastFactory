import { VideoExportSettings, VideoFormat, VideoRenderProgress } from '../../types/video';

export interface ExportEventHandlers {
  onProgress?: (progress: VideoRenderProgress) => void;
  onComplete?: (result: ExportResult) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

export interface ExportResult {
  videoBlob: Blob;
  audioBlob?: Blob;
  filename: string;
  format: VideoFormat;
  size: number;
  duration: number;
}

export interface ExportJob {
  id: string;
  settings: VideoExportSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: VideoRenderProgress;
  result?: ExportResult;
  error?: Error;
  startTime: Date;
  endTime?: Date;
}

export class VideoExporter {
  private jobs: Map<string, ExportJob> = new Map();
  private currentJob: ExportJob | null = null;
  private eventHandlers: ExportEventHandlers = {};

  constructor() {
    console.log('VideoExporter initialized');
  }

  public setEventHandlers(handlers: ExportEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  public async exportVideo(
    videoBlob: Blob,
    audioBlob: Blob | null,
    settings: VideoExportSettings,
    filename: string = 'video'
  ): Promise<ExportResult> {
    const jobId = this.generateJobId();
    const job: ExportJob = {
      id: jobId,
      settings,
      status: 'pending',
      progress: {
        currentFrame: 0,
        totalFrames: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        currentTime: 0,
        totalTime: 0
      },
      startTime: new Date()
    };

    this.jobs.set(jobId, job);
    this.currentJob = job;

    try {
      this.eventHandlers.onStart?.();
      job.status = 'processing';

      const result = await this.processExport(videoBlob, audioBlob, settings, filename);
      
      job.status = 'completed';
      job.result = result;
      job.endTime = new Date();
      
      this.eventHandlers.onComplete?.(result);
      return result;
    } catch (error) {
      job.status = 'failed';
      job.error = error as Error;
      job.endTime = new Date();
      
      this.eventHandlers.onError?.(error as Error);
      throw error;
    } finally {
      this.currentJob = null;
    }
  }

  private async processExport(
    videoBlob: Blob,
    audioBlob: Blob | null,
    settings: VideoExportSettings,
    filename: string
  ): Promise<ExportResult> {
    // For now, we'll work with WebM format since it's natively supported
    // MP4 export would require additional libraries like FFmpeg.wasm
    
    let finalBlob: Blob;
    let finalFilename: string;

    switch (settings.format) {
      case 'webm':
        finalBlob = await this.exportAsWebM(videoBlob, audioBlob, settings);
        finalFilename = `${filename}.webm`;
        break;
      
      case 'mp4':
        // For now, convert WebM to MP4 using browser capabilities
        // In a production environment, you'd use FFmpeg.wasm
        finalBlob = await this.convertToMP4(videoBlob, audioBlob, settings);
        finalFilename = `${filename}.mp4`;
        break;
      
      case 'gif':
        finalBlob = await this.convertToGIF(videoBlob, settings);
        finalFilename = `${filename}.gif`;
        break;
      
      default:
        throw new Error(`Unsupported export format: ${settings.format}`);
    }

    // Calculate duration from blob (approximate)
    const duration = await this.estimateDuration(videoBlob);

    const result: ExportResult = {
      videoBlob: finalBlob,
      audioBlob: audioBlob || undefined,
      filename: finalFilename,
      format: settings.format,
      size: finalBlob.size,
      duration
    };

    return result;
  }

  private async exportAsWebM(
    videoBlob: Blob,
    audioBlob: Blob | null,
    settings: VideoExportSettings
  ): Promise<Blob> {
    // If we have both video and audio, we need to combine them
    if (audioBlob) {
      return await this.combineVideoAndAudio(videoBlob, audioBlob, settings);
    }
    
    // If only video, return as-is (already WebM)
    return videoBlob;
  }

  private async combineVideoAndAudio(
    videoBlob: Blob,
    audioBlob: Blob,
    settings: VideoExportSettings
  ): Promise<Blob> {
    // This is a simplified implementation
    // In a real-world scenario, you'd use FFmpeg.wasm or similar
    
    try {
      // Create video and audio elements
      const video = document.createElement('video');
      const audio = document.createElement('audio');
      
      video.src = URL.createObjectURL(videoBlob);
      audio.src = URL.createObjectURL(audioBlob);
      
      // Wait for metadata to load
      await Promise.all([
        new Promise(resolve => video.addEventListener('loadedmetadata', resolve)),
        new Promise(resolve => audio.addEventListener('loadedmetadata', resolve))
      ]);

      // Create canvas for re-recording with audio
      const canvas = document.createElement('canvas');
      canvas.width = settings.resolution.width;
      canvas.height = settings.resolution.height;
      const ctx = canvas.getContext('2d')!;

      // Create MediaRecorder with audio
      const canvasStream = canvas.captureStream(settings.frameRate);
      
      // Get audio stream
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      audioSource.connect(destination);
      
      // Combine streams
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: settings.bitrate
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start();
      video.play();
      audio.play();

      // Draw video frames to canvas
      const drawFrame = () => {
        if (!video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        }
      };
      drawFrame();

      // Wait for video to end
      await new Promise(resolve => video.addEventListener('ended', resolve));
      
      // Stop recording
      mediaRecorder.stop();
      
      // Wait for final data
      await new Promise(resolve => mediaRecorder.addEventListener('stop', resolve));

      // Clean up
      URL.revokeObjectURL(video.src);
      URL.revokeObjectURL(audio.src);
      audioContext.close();

      return new Blob(chunks, { type: 'video/webm' });
    } catch (error) {
      console.error('Error combining video and audio:', error);
      // Fallback to video only
      return videoBlob;
    }
  }

  private async convertToMP4(
    videoBlob: Blob,
    audioBlob: Blob | null,
    settings: VideoExportSettings
  ): Promise<Blob> {
    // This is a placeholder implementation
    // In a real application, you would use FFmpeg.wasm for proper MP4 conversion
    console.warn('MP4 export not fully implemented. Returning WebM format.');
    return await this.exportAsWebM(videoBlob, audioBlob, settings);
  }

  private async convertToGIF(
    videoBlob: Blob,
    settings: VideoExportSettings
  ): Promise<Blob> {
    // This is a simplified GIF conversion
    // In production, you'd use a proper GIF encoder library
    
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    
    await new Promise(resolve => video.addEventListener('loadedmetadata', resolve));
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(settings.resolution.width, 480); // Limit GIF size
    canvas.height = Math.min(settings.resolution.height, 480);
    const ctx = canvas.getContext('2d')!;
    
    // For now, just return the first frame as a static image
    // A real implementation would create an animated GIF
    video.currentTime = 0;
    await new Promise(resolve => video.addEventListener('seeked', resolve));
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        URL.revokeObjectURL(video.src);
        resolve(blob!);
      }, 'image/gif');
    });
  }

  private async estimateDuration(videoBlob: Blob): Promise<number> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    
    return new Promise(resolve => {
      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration || 0;
        URL.revokeObjectURL(video.src);
        resolve(duration);
      });
    });
  }

  private updateProgress(progress: Partial<VideoRenderProgress>): void {
    if (this.currentJob) {
      this.currentJob.progress = { ...this.currentJob.progress, ...progress };
      this.eventHandlers.onProgress?.(this.currentJob.progress);
    }
  }

  public downloadResult(result: ExportResult): void {
    const url = URL.createObjectURL(result.videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  public getJob(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  public getAllJobs(): ExportJob[] {
    return Array.from(this.jobs.values());
  }

  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      job.error = new Error('Job cancelled by user');
      job.endTime = new Date();
      return true;
    }
    return false;
  }

  public clearCompletedJobs(): void {
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(jobId);
      }
    }
  }

  private generateJobId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getExportFormats(): VideoFormat[] {
    return ['webm', 'mp4', 'gif'];
  }

  public getQualityPresets() {
    return {
      low: { bitrate: 1000000, resolution: { width: 854, height: 480 } },
      medium: { bitrate: 5000000, resolution: { width: 1280, height: 720 } },
      high: { bitrate: 10000000, resolution: { width: 1920, height: 1080 } },
      ultra: { bitrate: 20000000, resolution: { width: 3840, height: 2160 } }
    };
  }

  public destroy(): void {
    // Cancel any running jobs
    for (const job of this.jobs.values()) {
      if (job.status === 'processing') {
        this.cancelJob(job.id);
      }
    }
    
    this.jobs.clear();
    this.currentJob = null;
    console.log('VideoExporter destroyed');
  }
}
