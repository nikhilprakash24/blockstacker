// Sound Manager using Web Audio API
// Programmatically generates arcade-style sounds

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private enabled: boolean = true;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();

      // Connect gain nodes
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Set default volumes
      this.masterGain.gain.value = 0.7;
      this.sfxGain.gain.value = 1.0;
      this.musicGain.gain.value = 0.5;

      // Load saved preferences
      this.loadVolumePreferences();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  private loadVolumePreferences() {
    const sfxVolume = localStorage.getItem('sfx_volume');
    const musicVolume = localStorage.getItem('music_volume');

    if (sfxVolume && this.sfxGain) {
      this.sfxGain.gain.value = parseFloat(sfxVolume);
    }
    if (musicVolume && this.musicGain) {
      this.musicGain.gain.value = parseFloat(musicVolume);
    }
  }

  // Resume audio context (required after user interaction on some browsers)
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Volume controls
  setSFXVolume(volume: number) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
      localStorage.setItem('sfx_volume', volume.toString());
    }
  }

  setMusicVolume(volume: number) {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
      localStorage.setItem('music_volume', volume.toString());
    }
  }

  getSFXVolume(): number {
    return this.sfxGain?.gain.value ?? 1.0;
  }

  getMusicVolume(): number {
    return this.musicGain?.gain.value ?? 0.5;
  }

  // Sound generation helpers
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || !this.sfxGain || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playNoise(duration: number, volume: number = 0.1) {
    if (!this.audioContext || !this.sfxGain || !this.enabled) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    noise.buffer = buffer;

    filter.type = 'highpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.sfxGain);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    noise.start(this.audioContext.currentTime);
  }

  // Game sound effects

  /**
   * Block placement sound - pitch increases with combo
   */
  playBlockPlace(comboStreak: number = 0) {
    if (!this.audioContext || !this.enabled) return;

    const baseFreq = 440; // A4
    const pitch = baseFreq + (comboStreak * 50); // Increase pitch with combo

    this.playTone(pitch, 0.1, 'square', 0.2);

    // Add click sound
    setTimeout(() => {
      this.playTone(pitch * 2, 0.05, 'sine', 0.1);
    }, 20);
  }

  /**
   * Perfect placement celebration sound
   */
  playPerfectPlacement() {
    if (!this.audioContext || !this.enabled) return;

    // Ascending arpeggio
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'sine', 0.25);
      }, i * 50);
    });
  }

  /**
   * Block falling/trimmed sound (negative feedback)
   */
  playBlockFall() {
    if (!this.audioContext || !this.enabled) return;

    // Descending pitch with noise
    const startFreq = 400;
    const endFreq = 100;
    const duration = 0.3;

    if (!this.audioContext || !this.sfxGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Combo milestone sound - gets more intense with higher combos
   */
  playComboMilestone(comboLevel: number) {
    if (!this.audioContext || !this.enabled) return;

    // Different sounds for different combo levels
    if (comboLevel === 3) {
      // 3x combo - simple ding
      this.playTone(800, 0.2, 'sine', 0.3);
    } else if (comboLevel === 5) {
      // 5x combo - double ding
      this.playTone(800, 0.15, 'sine', 0.3);
      setTimeout(() => this.playTone(1000, 0.15, 'sine', 0.3), 100);
    } else if (comboLevel === 10) {
      // 10x combo - triumphant sound
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 60);
      });
    } else if (comboLevel >= 15) {
      // 15+ combo - epic fanfare
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 0.25, 'sine', 0.3);
          this.playTone(freq * 1.5, 0.25, 'sine', 0.15); // Add harmony
        }, i * 50);
      });
    }
  }

  /**
   * Button click sound
   */
  playButtonClick() {
    if (!this.audioContext || !this.enabled) return;
    this.playTone(600, 0.05, 'sine', 0.15);
  }

  /**
   * Game over sound
   */
  playGameOver() {
    if (!this.audioContext || !this.enabled) return;

    // Descending sad trombone effect
    const notes = [440, 415, 392, 370, 349]; // A4 descending chromatically
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sawtooth', 0.25);
      }, i * 150);
    });
  }

  /**
   * Victory fanfare
   */
  playVictory() {
    if (!this.audioContext || !this.enabled) return;

    // Victory fanfare: C-E-G-C (major chord arpeggio)
    const notes = [
      { freq: 523.25, delay: 0 },    // C5
      { freq: 659.25, delay: 150 },  // E5
      { freq: 783.99, delay: 300 },  // G5
      { freq: 1046.50, delay: 450 }, // C6
      { freq: 1046.50, delay: 600 }, // C6 (repeat)
    ];

    notes.forEach(({ freq, delay }) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'sine', 0.3);
        // Add harmony
        this.playTone(freq * 1.5, 0.4, 'sine', 0.15);
      }, delay);
    });

    // Add celebratory noise burst
    setTimeout(() => this.playNoise(0.1, 0.15), 750);
  }

  /**
   * UI select/navigation sound
   */
  playUISelect() {
    if (!this.audioContext || !this.enabled) return;
    this.playTone(800, 0.08, 'sine', 0.12);
  }

  /**
   * Settings changed sound
   */
  playSettingsChange() {
    if (!this.audioContext || !this.enabled) return;
    this.playTone(500, 0.05, 'square', 0.1);
    setTimeout(() => this.playTone(600, 0.05, 'square', 0.1), 50);
  }
}

// Singleton instance
export const soundManager = new SoundManager();
