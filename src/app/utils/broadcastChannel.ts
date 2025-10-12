// BroadcastChannel API kullanarak sekme arası iletişim
class TabCommunication {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Array<(data?: unknown) => void>> = new Map();

  constructor(channelName: string = 'auth-channel') {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(channelName);
      this.setupListeners();
    }
  }

  private setupListeners() {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      const { type, data } = event.data;
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.forEach(listener => listener(data));
      }
    };
  }

  // Mesaj gönder
  send(type: string, data?: unknown) {
    if (this.channel) {
      this.channel.postMessage({ type, data });
    }
  }

  // Mesaj dinle
  listen(type: string, callback: (data?: unknown) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    // Cleanup fonksiyonu döndür
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Kanalı kapat
  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

// Global instance
export const tabComm = new TabCommunication();

// Mesaj tipleri
export const MESSAGE_TYPES = {
  LOGOUT: 'logout',
  LOGIN: 'login',
  TOKEN_EXPIRED: 'token_expired',
  SESSION_UPDATE: 'session_update'
} as const;

// Utility fonksiyonlar
export const broadcastLogout = () => {
  tabComm.send(MESSAGE_TYPES.LOGOUT);
};

export const broadcastLogin = (userData: { id: string; email: string; name: string; role: "user" | "admin" }) => {
  tabComm.send(MESSAGE_TYPES.LOGIN, userData);
};

export const broadcastTokenExpired = () => {
  tabComm.send(MESSAGE_TYPES.TOKEN_EXPIRED);
};

export const broadcastSessionUpdate = (sessionData: unknown) => {
  tabComm.send(MESSAGE_TYPES.SESSION_UPDATE, sessionData);
}; 