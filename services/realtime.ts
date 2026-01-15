
/**
 * KASIRA REAL-TIME ENGINE
 * Simulasi Laravel Echo & Pusher untuk demo UAS.
 * Jika dihubungkan ke backend asli, ganti 'EventBus' dengan 'window.Echo'.
 */

type Listener = (data: any) => void;

class RealtimeEngine {
  private listeners: Record<string, Listener[]> = {};

  // Mocking Laravel Echo 'private' channel
  privateChannel(channelName: string) {
    return {
      listen: (event: string, callback: Listener) => {
        const key = `${channelName}:${event}`;
        if (!this.listeners[key]) this.listeners[key] = [];
        this.listeners[key].push(callback);
        console.log(`[Echo] Listening to ${key}`);
        return this;
      }
    };
  }

  // Triggering event (In Laravel, this happens on the server)
  broadcast(channelName: string, event: string, data: any) {
    const key = `${channelName}:${event}`;
    console.log(`[Broadcasting] ${key}`, data);
    if (this.listeners[key]) {
      this.listeners[key].forEach(cb => cb(data));
    }
  }

  // Clean up
  stopListening(channelName: string, event: string) {
    const key = `${channelName}:${event}`;
    delete this.listeners[key];
  }
}

export const realtime = new RealtimeEngine();
