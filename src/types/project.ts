export interface Project {
  id: string;
  name: string;
  createdDate: Date;
  modifiedDate: Date;
  audioTracks: AudioClip[];
  videoSettings: VideoSettings;
  exportPreferences: ExportPreferences;
}

export interface AudioClip {
  id: string;
  filename: string;
  duration: number;
  filePath: string;
  waveformData?: number[];
  startTime: number;
  endTime: number;
  volume: number;
  effects: AudioEffect[];
  trackIndex?: number;
}

export interface VideoSettings {
  backgroundType: 'image' | 'video';
  backgroundPath: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  frameRate: number;
}

export interface ExportPreferences {
  audioFormat: 'mp3' | 'wav' | 'aac';
  videoFormat: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high';
  bitrate: number;
}

export interface AudioEffect {
  type: 'normalize' | 'eq' | 'compress' | 'reverb';
  parameters: Record<string, number>;
  enabled: boolean;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface AspectRatio {
  width: number;
  height: number;
}

export interface AIScript {
  id: string;
  originalText: string;
  processedScript: string;
  voiceSettings: VoiceSettings;
  personaConfig: PersonaConfig;
}

export interface VoiceSettings {
  voice1: string;
  voice2: string;
  speed: number;
  pitch: number;
}

export interface PersonaConfig {
  persona1: {
    name: string;
    personality: string;
  };
  persona2: {
    name: string;
    personality: string;
  };
}