
import { supabase } from './supabase';

type Listener = (data: any) => void;

class RealtimeEngine {
  private channels: Record<string, any> = {};

  // Menggunakan Supabase Broadcast
  privateChannel(channelName: string) {
    if (!this.channels[channelName]) {
      this.channels[channelName] = supabase.channel(channelName, {
        config: { broadcast: { self: true } }
      }).subscribe();
    }

    return {
      listen: (event: string, callback: Listener) => {
        this.channels[channelName].on('broadcast', { event }, (payload: any) => {
          callback(payload.payload);
        });
        return this;
      }
    };
  }

  broadcast(channelName: string, event: string, data: any) {
    const channel = supabase.channel(channelName);
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: event,
          payload: data,
        });
      }
    });
  }

  stopListening(channelName: string, event: string) {
    if (this.channels[channelName]) {
      this.channels[channelName].unsubscribe();
      delete this.channels[channelName];
    }
  }
}

export const realtime = new RealtimeEngine();
