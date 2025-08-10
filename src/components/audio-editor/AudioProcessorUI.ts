import { AudioProcessor, AudioProcessingSettings } from '../../services/audio-processing/AudioProcessor';
import { AudioClip } from '../../types/project';

export class AudioProcessorUI {
  private audioProcessor: AudioProcessor;
  private selectedTrack: AudioClip | null = null;

  constructor() {
    this.audioProcessor = new AudioProcessor();
    this.setupEventListeners();
    this.updateUI();
  }

  private setupEventListeners(): void {
    // Analysis
    document.getElementById('analyze-audio')?.addEventListener('click', () => {
      this.analyzeSelectedTrack();
    });

    // Normalization controls
    document.getElementById('normalize-enabled')?.addEventListener('change', (e) => {
      this.updateSettings();
    });

    document.getElementById('normalize-target')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      document.getElementById('normalize-target-value')!.textContent = `${value} dB`;
      this.updateSettings();
    });

    document.getElementById('normalize-peak')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      document.getElementById('normalize-peak-value')!.textContent = `${value} dB`;
      this.updateSettings();
    });

    document.getElementById('apply-normalize')?.addEventListener('click', () => {
      this.applyNormalization();
    });

    // EQ controls
    document.getElementById('eq-enabled')?.addEventListener('change', () => {
      this.updateSettings();
    });

    ['low', 'mid', 'high'].forEach(band => {
      document.getElementById(`eq-${band}`)?.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        document.getElementById(`eq-${band}-value`)!.textContent = `${value} dB`;
        this.updateSettings();
      });
    });

    document.getElementById('reset-eq')?.addEventListener('click', () => {
      this.resetEQ();
    });

    // Compressor controls
    document.getElementById('compressor-enabled')?.addEventListener('change', () => {
      this.updateSettings();
    });

    document.getElementById('comp-threshold')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      document.getElementById('comp-threshold-value')!.textContent = `${value} dB`;
      this.updateSettings();
    });

    document.getElementById('comp-ratio')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      document.getElementById('comp-ratio-value')!.textContent = `${value}:1`;
      this.updateSettings();
    });

    document.getElementById('comp-attack')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      document.getElementById('comp-attack-value')!.textContent = `${value} ms`;
      this.updateSettings();
    });

    document.getElementById('comp-release')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      document.getElementById('comp-release-value')!.textContent = `${value} ms`;
      this.updateSettings();
    });

    // Noise Gate controls
    document.getElementById('gate-enabled')?.addEventListener('change', () => {
      this.updateSettings();
    });

    document.getElementById('gate-threshold')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      document.getElementById('gate-threshold-value')!.textContent = `${value} dB`;
      this.updateSettings();
    });

    document.getElementById('gate-ratio')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      document.getElementById('gate-ratio-value')!.textContent = `${value}:1`;
      this.updateSettings();
    });

    // Processing actions
    document.getElementById('preview-processing')?.addEventListener('click', () => {
      this.previewProcessing();
    });

    document.getElementById('apply-processing')?.addEventListener('click', () => {
      this.applyProcessing();
    });

    document.getElementById('reset-processing')?.addEventListener('click', () => {
      this.resetAllProcessing();
    });
  }

  private updateSettings(): void {
    const settings: Partial<AudioProcessingSettings> = {
      normalize: {
        enabled: (document.getElementById('normalize-enabled') as HTMLInputElement).checked,
        targetLevel: parseFloat((document.getElementById('normalize-target') as HTMLInputElement).value),
        peakLevel: parseFloat((document.getElementById('normalize-peak') as HTMLInputElement).value)
      },
      eq: {
        enabled: (document.getElementById('eq-enabled') as HTMLInputElement).checked,
        lowGain: parseFloat((document.getElementById('eq-low') as HTMLInputElement).value),
        midGain: parseFloat((document.getElementById('eq-mid') as HTMLInputElement).value),
        highGain: parseFloat((document.getElementById('eq-high') as HTMLInputElement).value),
        lowFreq: 200,
        midFreq: 1000,
        highFreq: 5000
      },
      compressor: {
        enabled: (document.getElementById('compressor-enabled') as HTMLInputElement).checked,
        threshold: parseFloat((document.getElementById('comp-threshold') as HTMLInputElement).value),
        ratio: parseFloat((document.getElementById('comp-ratio') as HTMLInputElement).value),
        attack: parseFloat((document.getElementById('comp-attack') as HTMLInputElement).value) / 1000,
        release: parseFloat((document.getElementById('comp-release') as HTMLInputElement).value) / 1000,
        makeupGain: 0
      },
      noiseGate: {
        enabled: (document.getElementById('gate-enabled') as HTMLInputElement).checked,
        threshold: parseFloat((document.getElementById('gate-threshold') as HTMLInputElement).value),
        ratio: parseFloat((document.getElementById('gate-ratio') as HTMLInputElement).value),
        attack: 0.001,
        release: 0.1
      }
    };

    this.audioProcessor.updateSettings(settings);
  }

  private updateUI(): void {
    const settings = this.audioProcessor.getSettings();

    // Update normalization UI
    (document.getElementById('normalize-enabled') as HTMLInputElement).checked = settings.normalize.enabled;
    (document.getElementById('normalize-target') as HTMLInputElement).value = settings.normalize.targetLevel.toString();
    (document.getElementById('normalize-peak') as HTMLInputElement).value = settings.normalize.peakLevel.toString();
    document.getElementById('normalize-target-value')!.textContent = `${settings.normalize.targetLevel} dB`;
    document.getElementById('normalize-peak-value')!.textContent = `${settings.normalize.peakLevel} dB`;

    // Update EQ UI
    (document.getElementById('eq-enabled') as HTMLInputElement).checked = settings.eq.enabled;
    (document.getElementById('eq-low') as HTMLInputElement).value = settings.eq.lowGain.toString();
    (document.getElementById('eq-mid') as HTMLInputElement).value = settings.eq.midGain.toString();
    (document.getElementById('eq-high') as HTMLInputElement).value = settings.eq.highGain.toString();
    document.getElementById('eq-low-value')!.textContent = `${settings.eq.lowGain} dB`;
    document.getElementById('eq-mid-value')!.textContent = `${settings.eq.midGain} dB`;
    document.getElementById('eq-high-value')!.textContent = `${settings.eq.highGain} dB`;

    // Update compressor UI
    (document.getElementById('compressor-enabled') as HTMLInputElement).checked = settings.compressor.enabled;
    (document.getElementById('comp-threshold') as HTMLInputElement).value = settings.compressor.threshold.toString();
    (document.getElementById('comp-ratio') as HTMLInputElement).value = settings.compressor.ratio.toString();
    (document.getElementById('comp-attack') as HTMLInputElement).value = (settings.compressor.attack * 1000).toString();
    (document.getElementById('comp-release') as HTMLInputElement).value = (settings.compressor.release * 1000).toString();
    document.getElementById('comp-threshold-value')!.textContent = `${settings.compressor.threshold} dB`;
    document.getElementById('comp-ratio-value')!.textContent = `${settings.compressor.ratio}:1`;
    document.getElementById('comp-attack-value')!.textContent = `${settings.compressor.attack * 1000} ms`;
    document.getElementById('comp-release-value')!.textContent = `${settings.compressor.release * 1000} ms`;

    // Update noise gate UI
    (document.getElementById('gate-enabled') as HTMLInputElement).checked = settings.noiseGate.enabled;
    (document.getElementById('gate-threshold') as HTMLInputElement).value = settings.noiseGate.threshold.toString();
    (document.getElementById('gate-ratio') as HTMLInputElement).value = settings.noiseGate.ratio.toString();
    document.getElementById('gate-threshold-value')!.textContent = `${settings.noiseGate.threshold} dB`;
    document.getElementById('gate-ratio-value')!.textContent = `${settings.noiseGate.ratio}:1`;
  }

  public setSelectedTrack(track: AudioClip | null): void {
    this.selectedTrack = track;
    
    const analyzeButton = document.getElementById('analyze-audio') as HTMLButtonElement;
    const applyButton = document.getElementById('apply-processing') as HTMLButtonElement;
    const previewButton = document.getElementById('preview-processing') as HTMLButtonElement;
    
    if (track) {
      analyzeButton.disabled = false;
      applyButton.disabled = false;
      previewButton.disabled = false;
      analyzeButton.textContent = `Analyze "${track.filename}"`;
    } else {
      analyzeButton.disabled = true;
      applyButton.disabled = true;
      previewButton.disabled = true;
      analyzeButton.textContent = 'Select a track to analyze';
    }
  }

  private async analyzeSelectedTrack(): Promise<void> {
    if (!this.selectedTrack) {
      alert('Please select a track first');
      return;
    }

    try {
      // In a real implementation, we would load the audio buffer from the track
      // For now, we'll simulate the analysis
      const mockAnalysis = {
        peak: 0.8,
        rms: 0.3,
        peakDb: -1.9,
        rmsDb: -10.5
      };

      document.getElementById('peak-level')!.textContent = `${mockAnalysis.peakDb.toFixed(1)} dB`;
      document.getElementById('rms-level')!.textContent = `${mockAnalysis.rmsDb.toFixed(1)} dB`;

      console.log('Audio analysis completed:', mockAnalysis);
    } catch (error) {
      console.error('Error analyzing audio:', error);
      alert('Error analyzing audio file');
    }
  }

  private async applyNormalization(): Promise<void> {
    if (!this.selectedTrack) {
      alert('Please select a track first');
      return;
    }

    try {
      console.log('Applying normalization to track:', this.selectedTrack.filename);
      // In a real implementation, we would process the actual audio buffer
      alert('Normalization applied successfully!');
    } catch (error) {
      console.error('Error applying normalization:', error);
      alert('Error applying normalization');
    }
  }

  private resetEQ(): void {
    (document.getElementById('eq-low') as HTMLInputElement).value = '0';
    (document.getElementById('eq-mid') as HTMLInputElement).value = '0';
    (document.getElementById('eq-high') as HTMLInputElement).value = '0';
    document.getElementById('eq-low-value')!.textContent = '0.0 dB';
    document.getElementById('eq-mid-value')!.textContent = '0.0 dB';
    document.getElementById('eq-high-value')!.textContent = '0.0 dB';
    this.updateSettings();
    console.log('EQ reset to flat response');
  }

  private previewProcessing(): void {
    if (!this.selectedTrack) {
      alert('Please select a track first');
      return;
    }

    console.log('Previewing audio processing effects...');
    // In a real implementation, this would play the processed audio
    alert('Preview functionality will play processed audio in real-time');
  }

  private applyProcessing(): void {
    if (!this.selectedTrack) {
      alert('Please select a track first');
      return;
    }

    const settings = this.audioProcessor.getSettings();
    const enabledEffects = [];
    
    if (settings.normalize.enabled) enabledEffects.push('Normalization');
    if (settings.eq.enabled) enabledEffects.push('EQ');
    if (settings.compressor.enabled) enabledEffects.push('Compressor');
    if (settings.noiseGate.enabled) enabledEffects.push('Noise Gate');

    if (enabledEffects.length === 0) {
      alert('No effects are enabled. Please enable at least one effect.');
      return;
    }

    const confirmation = confirm(`Apply the following effects to "${this.selectedTrack.filename}"?\n\n${enabledEffects.join(', ')}\n\nThis action cannot be undone.`);
    
    if (confirmation) {
      console.log('Applying processing to track:', this.selectedTrack.filename);
      console.log('Enabled effects:', enabledEffects);
      alert('Audio processing applied successfully!');
    }
  }

  private resetAllProcessing(): void {
    // Reset all controls to default values
    (document.getElementById('normalize-enabled') as HTMLInputElement).checked = false;
    (document.getElementById('eq-enabled') as HTMLInputElement).checked = false;
    (document.getElementById('compressor-enabled') as HTMLInputElement).checked = false;
    (document.getElementById('gate-enabled') as HTMLInputElement).checked = false;
    
    this.resetEQ();
    this.updateUI();
    console.log('All audio processing reset to defaults');
  }

  public getAudioProcessor(): AudioProcessor {
    return this.audioProcessor;
  }
}