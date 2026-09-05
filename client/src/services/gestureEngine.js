// Interactive gesture & video control simulator engine
export class GestureEngine {
  constructor() {
    this.active = false;
    this.currentGesture = "none";
  }

  toggleGestureTracking(onGestureDetected) {
    this.active = !this.active;
    if (this.active) {
      // Simulate motion detection feedback for active webcam gesture monitoring
      const gestures = ["thumbs_up", "open_palm", "peace", "fist", "pointing_up"];
      this.timer = setInterval(() => {
        const random = gestures[Math.floor(Math.random() * gestures.length)];
        this.currentGesture = random;
        if (onGestureDetected) onGestureDetected(random);
      }, 4000);
    } else {
      if (this.timer) clearInterval(this.timer);
      this.currentGesture = "none";
    }
    return this.active;
  }

  stop() {
    this.active = false;
    if (this.timer) clearInterval(this.timer);
    this.currentGesture = "none";
  }
}

export const gestureEngine = new GestureEngine();
