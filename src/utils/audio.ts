/**
 * Audio utility for playing completion sounds
 */

export class AudioManager {
  private successAudio: HTMLAudioElement | null = null;
  private errorAudio: HTMLAudioElement | null = null;
  private notificationAudio: HTMLAudioElement | null = null;

  constructor() {
    this.initAudioElements();
  }
  
  private initAudioElements() {
    try {
      // Load success sound
      this.successAudio = new Audio('/sounds/success.mp3');
      this.successAudio.preload = 'auto';
      this.successAudio.volume = 0.7;
      
      // Load notification sound for admin panel
      this.notificationAudio = new Audio('/sounds/notification.mp3');
      this.notificationAudio.preload = 'auto';
      this.notificationAudio.volume = 0.6;
      
      // Create error sound programmatically (fallback)
      this.createErrorAudio();
      

    } catch (error) {
      console.error('Failed to initialize audio elements:', error);
    }
  }
  
  private createErrorAudio() {
    // Create a simple error beep using data URL
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 0.3;
    const frequency = 300;
    
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3);
    }
    
    // Convert to WAV and create audio element
    // For now, we'll use a simple beep
  }



  // Play success completion sound
  async playCompletionSound() {
    if (!this.successAudio) {
      console.error('Success audio not loaded');
      return;
    }

    try {
      // Reset audio to beginning
      this.successAudio.currentTime = 0;
      
      const playPromise = this.successAudio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }

    } catch (error) {
      console.error('Error playing success sound:', error);
      // Fallback to programmatic beep
      this.playBeepFallback(800, 0.3, 0.2);
    }
  }

  // Play error sound
  async playErrorSound() {
    try {
      this.playBeepFallback(300, 0.4, 0.4);

    } catch (error) {
      console.error('Error playing error sound:', error);
    }
  }
  
  // Play notification sound for admin panel
  async playNotificationSound() {
    if (!this.notificationAudio) {
      console.error('Notification audio not loaded');
      return;
    }

    try {
      // Reset audio to beginning
      this.notificationAudio.currentTime = 0;
      
      const playPromise = this.notificationAudio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }

    } catch (error) {
      console.error('Error playing notification sound:', error);
      // Fallback to programmatic beep
      this.playBeepFallback(600, 0.3, 0.3);
    }
  }
  
  // Fallback beep sound using Web Audio API
  private playBeepFallback(frequency: number, volume: number, duration: number) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connect the nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Set volume envelope
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      // Play the sound
      oscillator.start(now);
      oscillator.stop(now + duration);
      
    } catch (error) {
      console.error('Error creating fallback beep:', error);
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();

