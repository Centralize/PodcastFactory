export interface VideoProject {
  id: string;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  settings: VideoProjectSettings;
  timeline: VideoTimeline;
  assets: VideoAsset[];
}

export interface VideoProjectSettings {
  resolution: Resolution;
  aspectRatio: AspectRatio;
  frameRate: number;
  duration: number;
  backgroundColor: string;
  quality: VideoQuality;
}

export interface VideoTimeline {
  tracks: VideoTrack[];
  duration: number;
  currentTime: number;
}

export interface VideoTrack {
  id: string;
  name: string;
  type: 'video' | 'image' | 'text' | 'audio';
  clips: VideoClip[];
  enabled: boolean;
  locked: boolean;
  opacity: number;
}

export interface VideoClip {
  id: string;
  name: string;
  type: 'image' | 'video' | 'text';
  assetId: string;
  startTime: number;
  endTime: number;
  duration: number;
  position: VideoPosition;
  scale: VideoScale;
  rotation: number;
  opacity: number;
  effects: VideoEffect[];
  transitions: VideoTransition[];
}

export interface VideoAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  src: string;
  file?: File;
  duration?: number;
  dimensions?: Resolution;
  fileSize: number;
  mimeType: string;
  thumbnail?: string;
  metadata: VideoAssetMetadata;
}

export interface VideoAssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  frameRate?: number;
  bitrate?: number;
  codec?: string;
  colorSpace?: string;
  aspectRatio?: string;
}

export interface VideoPosition {
  x: number;
  y: number;
  z?: number;
}

export interface VideoScale {
  x: number;
  y: number;
  uniform: boolean;
}

export interface VideoEffect {
  id: string;
  type: VideoEffectType;
  name: string;
  enabled: boolean;
  parameters: VideoEffectParameters;
  keyframes?: VideoKeyframe[];
}

export type VideoEffectType = 
  | 'fade'
  | 'zoom'
  | 'pan'
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'hue'
  | 'sepia'
  | 'grayscale'
  | 'invert'
  | 'noise'
  | 'vignette'
  | 'chromakey'
  | 'crop'
  | 'rotate'
  | 'flip'
  | 'mirror';

export interface VideoEffectParameters {
  [key: string]: number | string | boolean;
}

export interface VideoKeyframe {
  time: number;
  value: number | string | boolean;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface VideoTransition {
  id: string;
  type: VideoTransitionType;
  duration: number;
  parameters: VideoTransitionParameters;
}

export type VideoTransitionType =
  | 'cut'
  | 'fade'
  | 'dissolve'
  | 'wipe'
  | 'slide'
  | 'push'
  | 'zoom'
  | 'rotate';

export interface VideoTransitionParameters {
  direction?: 'left' | 'right' | 'up' | 'down';
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  [key: string]: any;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface AspectRatio {
  width: number;
  height: number;
}

export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface VideoExportSettings {
  format: VideoFormat;
  quality: VideoQuality;
  resolution: Resolution;
  frameRate: number;
  bitrate: number;
  audioCodec?: string;
  videoCodec?: string;
  container?: string;
}

export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'gif';

export interface VideoRenderProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  estimatedTimeRemaining: number;
  currentTime: number;
  totalTime: number;
}

export interface VideoPreviewSettings {
  quality: 'low' | 'medium' | 'high';
  autoPlay: boolean;
  loop: boolean;
  showControls: boolean;
  volume: number;
}

// Preset configurations
export const VIDEO_PRESETS = {
  YOUTUBE_16_9: {
    resolution: { width: 1920, height: 1080 },
    aspectRatio: { width: 16, height: 9 },
    frameRate: 30
  },
  YOUTUBE_SHORTS: {
    resolution: { width: 1080, height: 1920 },
    aspectRatio: { width: 9, height: 16 },
    frameRate: 30
  },
  INSTAGRAM_POST: {
    resolution: { width: 1080, height: 1080 },
    aspectRatio: { width: 1, height: 1 },
    frameRate: 30
  },
  INSTAGRAM_STORY: {
    resolution: { width: 1080, height: 1920 },
    aspectRatio: { width: 9, height: 16 },
    frameRate: 30
  },
  TIKTOK: {
    resolution: { width: 1080, height: 1920 },
    aspectRatio: { width: 9, height: 16 },
    frameRate: 30
  },
  FACEBOOK_POST: {
    resolution: { width: 1200, height: 630 },
    aspectRatio: { width: 1200, height: 630 },
    frameRate: 30
  },
  TWITTER_POST: {
    resolution: { width: 1200, height: 675 },
    aspectRatio: { width: 16, height: 9 },
    frameRate: 30
  }
} as const;

export const QUALITY_PRESETS = {
  low: {
    bitrate: 1000000, // 1 Mbps
    resolution: { width: 854, height: 480 }
  },
  medium: {
    bitrate: 5000000, // 5 Mbps
    resolution: { width: 1280, height: 720 }
  },
  high: {
    bitrate: 10000000, // 10 Mbps
    resolution: { width: 1920, height: 1080 }
  },
  ultra: {
    bitrate: 20000000, // 20 Mbps
    resolution: { width: 3840, height: 2160 }
  }
} as const;

// Event types for video processing
export interface VideoProcessingEvent {
  type: 'progress' | 'complete' | 'error' | 'start';
  data?: any;
}

export interface VideoProcessingEventHandlers {
  onProgress?: (progress: VideoRenderProgress) => void;
  onComplete?: (result: Blob) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}
