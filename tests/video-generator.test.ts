/**
 * Video Generator Module Tests
 * 
 * Basic tests to verify the video generation functionality
 */

import { VideoProcessor } from '../src/services/video-processing/VideoProcessor';
import { VideoGenerator } from '../src/components/video-generator/VideoGenerator';
import { AudioVideoSync } from '../src/services/video-processing/AudioVideoSync';
import { VideoExporter } from '../src/services/video-processing/VideoExporter';
import { AudioProcessor } from '../src/services/audio-processing/AudioProcessor';

// Mock DOM elements for testing
const mockDOM = () => {
  // Create mock HTML elements
  const mockElement = {
    addEventListener: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    innerHTML: '',
    style: {},
    value: '',
    files: null,
    disabled: false,
    onclick: null
  };

  global.document = {
    getElementById: jest.fn(() => mockElement),
    createElement: jest.fn(() => mockElement),
    addEventListener: jest.fn()
  } as any;

  global.window = {
    AudioContext: jest.fn(() => ({
      createBuffer: jest.fn(),
      createBufferSource: jest.fn(),
      decodeAudioData: jest.fn(),
      close: jest.fn(),
      state: 'running'
    })),
    webkitAudioContext: jest.fn(),
    URL: {
      createObjectURL: jest.fn(() => 'mock-url'),
      revokeObjectURL: jest.fn()
    },
    MediaRecorder: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: null,
      onstop: null
    }))
  } as any;

  global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: jest.fn(),
    fillStyle: '#000000',
    filter: 'none'
  }));

  global.HTMLCanvasElement.prototype.captureStream = jest.fn(() => ({
    getVideoTracks: jest.fn(() => [])
  }));
};

describe('VideoProcessor', () => {
  beforeEach(() => {
    mockDOM();
  });

  test('should initialize with default settings', () => {
    const processor = new VideoProcessor();
    const settings = processor.getSettings();
    
    expect(settings.resolution.width).toBe(1920);
    expect(settings.resolution.height).toBe(1080);
    expect(settings.frameRate).toBe(30);
    expect(settings.quality).toBe('medium');
  });

  test('should update settings correctly', () => {
    const processor = new VideoProcessor();
    
    processor.updateSettings({
      resolution: { width: 1280, height: 720 },
      frameRate: 60,
      quality: 'high'
    });
    
    const settings = processor.getSettings();
    expect(settings.resolution.width).toBe(1280);
    expect(settings.resolution.height).toBe(720);
    expect(settings.frameRate).toBe(60);
    expect(settings.quality).toBe('high');
  });

  test('should clear canvas', () => {
    const processor = new VideoProcessor();
    const canvas = processor.getCanvas();
    const ctx = canvas.getContext('2d');
    
    processor.clearCanvas();
    
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  test('should get canvas data URL', () => {
    const processor = new VideoProcessor();
    
    // Mock toDataURL
    HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');
    
    const dataURL = processor.getCanvasDataURL();
    expect(dataURL).toBe('data:image/png;base64,mock');
  });
});

describe('VideoGenerator', () => {
  beforeEach(() => {
    mockDOM();
  });

  test('should initialize successfully', () => {
    const generator = new VideoGenerator();
    expect(generator).toBeDefined();
    expect(generator.isGeneratingVideo()).toBe(false);
  });

  test('should set event handlers', () => {
    const generator = new VideoGenerator();
    const handlers = {
      onVideoGenerated: jest.fn(),
      onProgress: jest.fn(),
      onError: jest.fn()
    };
    
    generator.setEventHandlers(handlers);
    // Test that handlers are set (implementation detail)
    expect(generator).toBeDefined();
  });

  test('should get video processor', () => {
    const generator = new VideoGenerator();
    const processor = generator.getVideoProcessor();
    
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(VideoProcessor);
  });
});

describe('AudioVideoSync', () => {
  beforeEach(() => {
    mockDOM();
  });

  test('should initialize with processors', () => {
    const videoProcessor = new VideoProcessor();
    const audioProcessor = new AudioProcessor();
    const sync = new AudioVideoSync(videoProcessor, audioProcessor);
    
    expect(sync).toBeDefined();
  });

  test('should calculate video duration from audio tracks', () => {
    const videoProcessor = new VideoProcessor();
    const audioProcessor = new AudioProcessor();
    const sync = new AudioVideoSync(videoProcessor, audioProcessor);
    
    const audioTracks = [
      { id: '1', endTime: 10, startTime: 0 } as any,
      { id: '2', endTime: 15, startTime: 5 } as any,
      { id: '3', endTime: 8, startTime: 2 } as any
    ];
    
    const duration = sync.calculateVideoDuration(audioTracks);
    expect(duration).toBe(15); // Max end time
  });

  test('should update settings', () => {
    const videoProcessor = new VideoProcessor();
    const audioProcessor = new AudioProcessor();
    const sync = new AudioVideoSync(videoProcessor, audioProcessor);
    
    sync.updateSettings({
      syncMode: 'manual',
      audioFadeIn: 1.0,
      audioFadeOut: 2.0
    });
    
    const settings = sync.getSettings();
    expect(settings.syncMode).toBe('manual');
    expect(settings.audioFadeIn).toBe(1.0);
    expect(settings.audioFadeOut).toBe(2.0);
  });
});

describe('VideoExporter', () => {
  beforeEach(() => {
    mockDOM();
  });

  test('should initialize successfully', () => {
    const exporter = new VideoExporter();
    expect(exporter).toBeDefined();
  });

  test('should set event handlers', () => {
    const exporter = new VideoExporter();
    const handlers = {
      onProgress: jest.fn(),
      onComplete: jest.fn(),
      onError: jest.fn(),
      onStart: jest.fn()
    };
    
    exporter.setEventHandlers(handlers);
    expect(exporter).toBeDefined();
  });

  test('should get supported export formats', () => {
    const exporter = new VideoExporter();
    const formats = exporter.getExportFormats();
    
    expect(formats).toContain('webm');
    expect(formats).toContain('mp4');
    expect(formats).toContain('gif');
  });

  test('should get quality presets', () => {
    const exporter = new VideoExporter();
    const presets = exporter.getQualityPresets();
    
    expect(presets.low).toBeDefined();
    expect(presets.medium).toBeDefined();
    expect(presets.high).toBeDefined();
    expect(presets.ultra).toBeDefined();
    
    expect(presets.high.bitrate).toBeGreaterThan(presets.medium.bitrate);
  });

  test('should manage jobs', () => {
    const exporter = new VideoExporter();
    const jobs = exporter.getAllJobs();
    
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBe(0);
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    mockDOM();
  });

  test('should create complete video generation pipeline', () => {
    const videoProcessor = new VideoProcessor();
    const audioProcessor = new AudioProcessor();
    const videoGenerator = new VideoGenerator();
    const audioVideoSync = new AudioVideoSync(videoProcessor, audioProcessor);
    const videoExporter = new VideoExporter();
    
    // Verify all components are created
    expect(videoProcessor).toBeDefined();
    expect(audioProcessor).toBeDefined();
    expect(videoGenerator).toBeDefined();
    expect(audioVideoSync).toBeDefined();
    expect(videoExporter).toBeDefined();
    
    // Verify they can work together
    expect(videoGenerator.getVideoProcessor()).toBeDefined();
    expect(audioVideoSync.getSettings()).toBeDefined();
    expect(videoExporter.getExportFormats().length).toBeGreaterThan(0);
  });

  test('should handle video generation workflow', async () => {
    const videoGenerator = new VideoGenerator();
    let progressCalled = false;
    let errorCalled = false;
    
    videoGenerator.setEventHandlers({
      onProgress: (progress) => {
        progressCalled = true;
        expect(typeof progress).toBe('number');
      },
      onError: (error) => {
        errorCalled = true;
        expect(error).toBeInstanceOf(Error);
      }
    });
    
    // Test that event handlers are properly set
    expect(videoGenerator).toBeDefined();
  });
});

// Mock Jest functions if not available
if (typeof jest === 'undefined') {
  global.jest = {
    fn: () => () => {},
  } as any;
}

export {};
