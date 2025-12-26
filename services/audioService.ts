
import { SoundProfile, MusicTrack } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private currentProfile: SoundProfile = SoundProfile.CLASSIC;
  private currentTrack: MusicTrack = MusicTrack.RETRO;
  private backgroundInterval: number | null = null;
  private isFrightenedMode: boolean = false;

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
    this.isFrightenedMode = isFrightened;

    const ctx = this.ctx!;
    let beat = 0;
    const tempo = isFrightened ? 150 : 300; // Faster when ghosts are scared

    this.backgroundInterval = window.setInterval(() => {
      this.playGenreBeat(beat++);
    }, tempo);
  }

  private playGenreBeat(beat: number) {
    if (!this.ctx || !this.musicEnabled) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    let freq = 60;
    let type: OscillatorType = 'triangle';
    let duration = 0.1;

    switch (this.currentTrack) {
      case MusicTrack.ROCK:
        type = 'sawtooth';
        // Power chord progression A - D - E - A
        const rockNotes = [110, 110, 146, 146, 164, 164, 110, 220];
        freq = rockNotes[beat % rockNotes.length];
        duration = 0.15;
        break;
      case MusicTrack.TECHNO:
        type = 'square';
        // Fast pulsing beat
        freq = (beat % 4 === 0) ? 50 : 150;
        if (beat % 8 === 7) freq = 300;
        duration = 0.05;
        break;
      case MusicTrack.LOFI:
        type = 'sine';
        // Chill minor seventh progression
        const lofiNotes = [196, 233, 293, 349]; // Gm7
        freq = lofiNotes[Math.floor(beat / 4) % lofiNotes.length];
        duration = 0.8;
        break;
      default: // RETRO
        type = 'triangle';
        freq = (beat % 4 === 0) ? 60 : 80;
        duration = 0.1;
        break;
    }

    if (this.isFrightenedMode) freq *= 1.5;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  stopBackgroundMusic() {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
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
