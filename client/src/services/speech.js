// Web Speech API wrapper for voice synthesis (TTS) & recognition (STT)

export class SpeechEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.recognition = null;
    this.isListening = false;
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  speak(text, onEnd) {
    if (!this.synth) return;
    this.synth.cancel(); // Stop any ongoing speech
    
    // Clean text of markdown backticks or extra code blocks before speaking
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block generated.').replace(/[`#*_]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 300));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    if (onEnd) utterance.onend = onEnd;
    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) this.synth.cancel();
  }

  startListening(onResult, onError) {
    if (!this.recognition) {
      if (onError) onError('Speech Recognition API not supported in this browser.');
      return;
    }

    this.isListening = true;
    this.recognition.onresult = (event) => {
      this.isListening = false;
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
  }
}

export const speechEngine = new SpeechEngine();
