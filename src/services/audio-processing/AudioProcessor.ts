export interface AudioProcessingSettings {
  normalize: {
    enabled: boolean;
    targetLevel: number; // dB
    peakLevel: number; // dB
  };
  eq: {
    enabled: boolean;
    lowGain: number; // dB
    midGain: number; // dB
    highGain: number; // dB
    lowFreq: number; // Hz
    midFreq: number; // Hz
    highFreq: number; // Hz
  };
  compressor: {
    enabled: boolean;
    threshold: number; // dB
    ratio: number;
    attack: number; // seconds
    release: number; // seconds
    makeupGain: number; // dB
  };
  noiseGate: {
    enabled: boolean;
    threshold: number; // dB
    ratio: number;
    attack: number; // seconds
    release: number; // seconds
  };
}

export class AudioProcessor {
  private audioContext: AudioContext;
  private settings: AudioProcessingSettings;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.settings = this.getDefaultSettings();
    console.log('AudioProcessor initialized with Web Audio API');
  }

  private getDefaultSettings(): AudioProcessingSettings {
    return {
      normalize: {
        enabled: false,
        targetLevel: -3,
        peakLevel: -1
      },
      eq: {
        enabled: false,
        lowGain: 0,
        midGain: 0,
        highGain: 0,
        lowFreq: 200,
        midFreq: 1000,
        highFreq: 5000
      },
      compressor: {
        enabled: false,
        threshold: -24,
        ratio: 4,
        attack: 0.003,
        release: 0.25,
        makeupGain: 0
      },
      noiseGate: {
        enabled: false,
        threshold: -40,
        ratio: 10,
        attack: 0.001,
        release: 0.1
      }
    };
  }

  public async normalizeAudio(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.settings.normalize.enabled) {
      return audioBuffer;
    }

    const normalizedBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);
      
      // Find peak level
      let peak = 0;
      for (let i = 0; i < inputData.length; i++) {
        peak = Math.max(peak, Math.abs(inputData[i]));
      }

      // Calculate normalization factor
      const targetLinear = this.dbToLinear(this.settings.normalize.targetLevel);
      const normalizationFactor = peak > 0 ? targetLinear / peak : 1;

      // Apply normalization
      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] * normalizationFactor;
      }
    }

    console.log(`Audio normalized to ${this.settings.normalize.targetLevel}dB`);
    return normalizedBuffer;
  }

  public createAudioProcessingChain(audioBuffer: AudioBuffer): AudioNode {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    let currentNode: AudioNode = source;

    // EQ Chain
    if (this.settings.eq.enabled) {
      const eqChain = this.createEQChain();
      currentNode.connect(eqChain.input);
      currentNode = eqChain.output;
    }

    // Compressor
    if (this.settings.compressor.enabled) {
      const compressor = this.createCompressor();
      currentNode.connect(compressor);
      currentNode = compressor;
    }

    // Noise Gate
    if (this.settings.noiseGate.enabled) {
      const noiseGate = this.createNoiseGate();
      currentNode.connect(noiseGate);
      currentNode = noiseGate;
    }

    return currentNode;
  }

  private createEQChain(): { input: AudioNode; output: AudioNode } {
    const lowShelf = this.audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = this.settings.eq.lowFreq;
    lowShelf.gain.value = this.settings.eq.lowGain;

    const midPeaking = this.audioContext.createBiquadFilter();
    midPeaking.type = 'peaking';
    midPeaking.frequency.value = this.settings.eq.midFreq;
    midPeaking.gain.value = this.settings.eq.midGain;
    midPeaking.Q.value = 1;

    const highShelf = this.audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = this.settings.eq.highFreq;
    highShelf.gain.value = this.settings.eq.highGain;

    // Chain the filters
    lowShelf.connect(midPeaking);
    midPeaking.connect(highShelf);

    return { input: lowShelf, output: highShelf };
  }

  private createCompressor(): DynamicsCompressorNode {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = this.settings.compressor.threshold;
    compressor.ratio.value = this.settings.compressor.ratio;
    compressor.attack.value = this.settings.compressor.attack;
    compressor.release.value = this.settings.compressor.release;

    return compressor;
  }

  private createNoiseGate(): GainNode {
    // Simplified noise gate using gain node
    // In a real implementation, this would be more sophisticated
    const gateGain = this.audioContext.createGain();
    gateGain.gain.value = 1;

    return gateGain;
  }

  public async processAudioFile(file: File): Promise<AudioBuffer> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      let audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Apply normalization
      audioBuffer = await this.normalizeAudio(audioBuffer);

      console.log('Audio file processed successfully');
      return audioBuffer;
    } catch (error) {
      console.error('Error processing audio file:', error);
      throw error;
    }
  }

  public updateSettings(newSettings: Partial<AudioProcessingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Audio processing settings updated:', this.settings);
  }

  public getSettings(): AudioProcessingSettings {
    return { ...this.settings };
  }

  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  private linearToDb(linear: number): number {
    return 20 * Math.log10(Math.max(linear, 0.00001));
  }

  public analyzeAudio(audioBuffer: AudioBuffer): {
    peak: number;
    rms: number;
    peakDb: number;
    rmsDb: number;
  } {
    let peak = 0;
    let rmsSum = 0;
    let sampleCount = 0;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      
      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.abs(channelData[i]);
        peak = Math.max(peak, sample);
        rmsSum += sample * sample;
        sampleCount++;
      }
    }

    const rms = Math.sqrt(rmsSum / sampleCount);

    return {
      peak,
      rms,
      peakDb: this.linearToDb(peak),
      rmsDb: this.linearToDb(rms)
    };
  }
}