import { AudioClip } from '../../types/project';
import { VideoProcessor } from './VideoProcessor';
import { AudioProcessor } from '../audio-processing/AudioProcessor';

export interface AudioVideoSyncSettings {
  syncMode: 'auto' | 'manual';
  audioFadeIn: number;
  audioFadeOut: number;
  videoStartOffset: number;
  audioStartOffset: number;
}

export interface SyncedAudioTrack {
  audioClip: AudioClip;
  audioBuffer: AudioBuffer;
  startTime: number;
  endTime: number;
  volume: number;
}

export class AudioVideoSync {
  private videoProcessor: VideoProcessor;
  private audioProcessor: AudioProcessor;
  private settings: AudioVideoSyncSettings;
  private audioContext: AudioContext;

  constructor(videoProcessor: VideoProcessor, audioProcessor: AudioProcessor) {
    this.videoProcessor = videoProcessor;
    this.audioProcessor = audioProcessor;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.settings = this.getDefaultSettings();
    console.log('AudioVideoSync initialized');
  }

  private getDefaultSettings(): AudioVideoSyncSettings {
    return {
      syncMode: 'auto',
      audioFadeIn: 0.5,
      audioFadeOut: 0.5,
      videoStartOffset: 0,
      audioStartOffset: 0
    };
  }

  public updateSettings(newSettings: Partial<AudioVideoSyncSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('AudioVideoSync settings updated:', this.settings);
  }

  public getSettings(): AudioVideoSyncSettings {
    return { ...this.settings };
  }

  /**
   * Calculate the total duration needed for video based on audio tracks
   */
  public calculateVideoDuration(audioTracks: AudioClip[]): number {
    if (audioTracks.length === 0) return 0;
    
    const maxEndTime = Math.max(...audioTracks.map(track => track.endTime));
    return maxEndTime + this.settings.videoStartOffset;
  }

  /**
   * Prepare audio tracks for video synchronization
   */
  public async prepareAudioTracks(audioTracks: AudioClip[]): Promise<SyncedAudioTrack[]> {
    const syncedTracks: SyncedAudioTrack[] = [];

    for (const audioClip of audioTracks) {
      try {
        // Load audio file
        const response = await fetch(audioClip.filePath);
        const arrayBuffer = await response.arrayBuffer();
        await this.audioContext.decodeAudioData(arrayBuffer);

        // Apply audio processing if needed
        const processedBuffer = await this.audioProcessor.processAudioFile(
          new File([arrayBuffer], audioClip.filename)
        );

        const syncedTrack: SyncedAudioTrack = {
          audioClip,
          audioBuffer: processedBuffer,
          startTime: audioClip.startTime + this.settings.audioStartOffset,
          endTime: audioClip.endTime + this.settings.audioStartOffset,
          volume: audioClip.volume
        };

        syncedTracks.push(syncedTrack);
      } catch (error) {
        console.error(`Error preparing audio track ${audioClip.filename}:`, error);
      }
    }

    return syncedTracks;
  }

  /**
   * Mix multiple audio tracks into a single audio buffer
   */
  public async mixAudioTracks(syncedTracks: SyncedAudioTrack[]): Promise<AudioBuffer> {
    if (syncedTracks.length === 0) {
      throw new Error('No audio tracks to mix');
    }

    // Calculate total duration and sample rate
    const totalDuration = Math.max(...syncedTracks.map(track => track.endTime));
    const sampleRate = syncedTracks[0].audioBuffer.sampleRate;
    const numberOfChannels = 2; // Stereo output
    const totalSamples = Math.ceil(totalDuration * sampleRate);

    // Create output buffer
    const mixedBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      totalSamples,
      sampleRate
    );

    // Initialize output channels
    const outputLeft = mixedBuffer.getChannelData(0);
    const outputRight = mixedBuffer.getChannelData(1);

    // Mix all tracks
    for (const track of syncedTracks) {
      const startSample = Math.floor(track.startTime * sampleRate);
      const endSample = Math.floor(track.endTime * sampleRate);
      const trackSamples = track.audioBuffer.length;
      
      // Get input channels (handle mono/stereo)
      const inputLeft = track.audioBuffer.getChannelData(0);
      const inputRight = track.audioBuffer.numberOfChannels > 1 
        ? track.audioBuffer.getChannelData(1) 
        : inputLeft;

      // Mix samples with volume adjustment
      for (let i = 0; i < trackSamples && (startSample + i) < totalSamples; i++) {
        const outputIndex = startSample + i;
        if (outputIndex >= 0 && outputIndex < totalSamples) {
          const volume = this.calculateVolumeAtTime(
            i / sampleRate,
            track.audioClip.duration,
            track.volume
          );

          outputLeft[outputIndex] += inputLeft[i] * volume;
          outputRight[outputIndex] += inputRight[i] * volume;
        }
      }
    }

    // Normalize to prevent clipping
    this.normalizeAudioBuffer(mixedBuffer);

    console.log(`Mixed ${syncedTracks.length} audio tracks into ${totalDuration}s buffer`);
    return mixedBuffer;
  }

  private calculateVolumeAtTime(currentTime: number, totalDuration: number, baseVolume: number): number {
    let volume = baseVolume;

    // Apply fade in
    if (currentTime < this.settings.audioFadeIn) {
      volume *= currentTime / this.settings.audioFadeIn;
    }

    // Apply fade out
    const fadeOutStart = totalDuration - this.settings.audioFadeOut;
    if (currentTime > fadeOutStart) {
      const fadeOutProgress = (currentTime - fadeOutStart) / this.settings.audioFadeOut;
      volume *= (1 - fadeOutProgress);
    }

    return Math.max(0, Math.min(1, volume));
  }

  private normalizeAudioBuffer(buffer: AudioBuffer): void {
    let maxSample = 0;

    // Find peak level across all channels
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        maxSample = Math.max(maxSample, Math.abs(channelData[i]));
      }
    }

    // Normalize if needed (leave some headroom)
    if (maxSample > 0.95) {
      const normalizationFactor = 0.95 / maxSample;
      
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] *= normalizationFactor;
        }
      }
      
      console.log(`Audio normalized with factor: ${normalizationFactor}`);
    }
  }

  /**
   * Generate video with synchronized audio
   */
  public async generateVideoWithAudio(
    audioTracks: AudioClip[],
    backgroundImageSrc?: string,
    backgroundColor?: string
  ): Promise<{ videoBlob: Blob; audioBuffer: AudioBuffer }> {
    try {
      // Prepare and mix audio
      const syncedTracks = await this.prepareAudioTracks(audioTracks);
      const mixedAudio = await this.mixAudioTracks(syncedTracks);
      const videoDuration = this.calculateVideoDuration(audioTracks);

      // Update video processor settings
      this.videoProcessor.updateSettings({
        frameRate: 30 // Ensure consistent frame rate
      });

      // Generate video frames
      if (backgroundImageSrc) {
        await this.videoProcessor.createImageToVideoSequence(
          backgroundImageSrc,
          videoDuration
        );
      } else {
        await this.createColorBackgroundVideo(backgroundColor || '#000000', videoDuration);
      }

      const videoBlob = await this.videoProcessor.stopRecording();

      console.log('Video with audio generated successfully');
      return { videoBlob, audioBuffer: mixedAudio };
    } catch (error) {
      console.error('Error generating video with audio:', error);
      throw error;
    }
  }

  private async createColorBackgroundVideo(color: string, duration: number): Promise<void> {
    const canvas = this.videoProcessor.getCanvas();
    const ctx = canvas.getContext('2d')!;
    const frameRate = this.videoProcessor.getSettings().frameRate;
    const frameCount = Math.ceil(duration * frameRate);
    const frameInterval = 1000 / frameRate;

    await this.videoProcessor.startRecording();

    for (let frame = 0; frame < frameCount; frame++) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Wait for next frame
      await new Promise(resolve => setTimeout(resolve, frameInterval));
    }
  }

  /**
   * Export audio buffer as WAV file
   */
  public exportAudioAsWAV(audioBuffer: AudioBuffer): Blob {
    const length = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Get audio visualization data for waveform display
   */
  public getAudioVisualizationData(audioBuffer: AudioBuffer, width: number = 1000): number[] {
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / width);
    const visualizationData: number[] = [];

    for (let i = 0; i < width; i++) {
      const start = i * samplesPerPixel;
      const end = start + samplesPerPixel;
      let max = 0;

      for (let j = start; j < end && j < channelData.length; j++) {
        max = Math.max(max, Math.abs(channelData[j]));
      }

      visualizationData.push(max);
    }

    return visualizationData;
  }

  public destroy(): void {
    // Clean up resources
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    console.log('AudioVideoSync destroyed');
  }
}
