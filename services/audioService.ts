
import { SoundProfile, MusicTrack } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private currentProfile: SoundProfile = SoundProfile.CLASSIC;
  private currentTrack: MusicTrack = MusicTrack.DRONE;
  private backgroundOscillator: OscillatorNode | null = null;
  private backgroundGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) this.stopBackgroundMusic();
  }

  setProfile(profile: SoundProfile) {
    this.currentProfile = profile;
  }

  setTrack(track: MusicTrack) {
    this.currentTrack = track;
  }

  private getOscType(): OscillatorType {
    switch (this.currentProfile) {
      case SoundProfile.SMOOTH: return 'sine';
      case SoundProfile.AGGRESSIVE: return 'sawtooth';
      default: return 'square';
    }
  }

  playWaka() {
    if (!this.sfxEnabled) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = this.getOscType();
    osc.frequency.setValueAtTime(this.currentProfile === SoundProfile.SMOOTH ? 300 : 400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playPowerPellet() {
    if (!this.sfxEnabled) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  playGhostEaten() {
    if (!this.sfxEnabled) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(2500, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  playDeath() {
    if (!this.sfxEnabled) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 1.8);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.8);
  }

  startBackgroundMusic(isFrightened: boolean = false) {
    if (!this.musicEnabled) return;
    this.init();
    this.stopBackgroundMusic();

    const ctx = this.ctx!;
    this.backgroundOscillator = ctx.createOscillator();
    this.backgroundGain = ctx.createGain();

    let freq = 70;
    if (this.currentTrack === MusicTrack.PULSE) freq = 140;
    if (this.currentTrack === MusicTrack.CHASE) freq = 220;
    
    if (isFrightened) freq *= 1.5;

    this.backgroundOscillator.type = this.currentProfile === SoundProfile.AGGRESSIVE ? 'sawtooth' : 'triangle';
    this.backgroundOscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Add subtle rhythm
    this.backgroundGain.gain.setValueAtTime(0.03, ctx.currentTime);
    
    this.backgroundOscillator.connect(this.backgroundGain);
    this.backgroundGain.connect(ctx.destination);
    
    this.backgroundOscillator.start();
  }

  stopBackgroundMusic() {
    if (this.backgroundOscillator) {
      try {
        this.backgroundOscillator.stop();
      } catch (e) {}
      this.backgroundOscillator = null;
    }
  }

  playStartFanfare() {
    if (!this.sfxEnabled) return;
    this.init();
    const ctx = this.ctx!;
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = this.getOscType();
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.1);
    });
  }
}

export const audioService = new AudioService();
