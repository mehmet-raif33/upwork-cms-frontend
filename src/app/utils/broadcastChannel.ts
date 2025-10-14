// Enhanced BroadcastChannel API for cross-tab communication
class TabCommunication {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Array<(data?: unknown) => void>> = new Map();
  private tabId: string;
  private messageHistory: Map<string, { timestamp: number; data: unknown }> = new Map();
  private readonly HISTORY_LIMIT = 100;
  private readonly DUPLICATE_WINDOW = 1000; // 1 second

  constructor(channelName: string = 'auth-channel') {
    // Generate unique tab ID
    this.tabId = this.generateTabId();
    
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(channelName);
      this.setupListeners();
      this.setupStorageFallback();
      
      console.log(`🔗 Tab Communication initialized with ID: ${this.tabId}`);
    }
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupListeners() {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      const { type, data, tabId, timestamp } = event.data;
      
      // Don't process messages from same tab
      if (tabId === this.tabId) {
        return;
      }
      
      // Check for duplicate messages within time window
      const messageKey = `${type}_${JSON.stringify(data)}`;
      const lastMessage = this.messageHistory.get(messageKey);
      
      if (lastMessage && (timestamp - lastMessage.timestamp) < this.DUPLICATE_WINDOW) {
        console.log(`🔄 Ignoring duplicate message: ${type}`);
        return;
      }
      
      // Store in history
      this.messageHistory.set(messageKey, { timestamp, data });
      this.cleanupHistory();
      
      console.log(`📨 Received broadcast message: ${type} from tab ${tabId}`);
      
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error('❌ Error in broadcast listener:', error);
          }
        });
      }
    };
  }

  private setupStorageFallback() {
    // Fallback for browsers without BroadcastChannel support
    if (!this.channel && typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('broadcast_')) {
          try {
            const messageType = e.key.replace('broadcast_', '');
            const messageData = e.newValue ? JSON.parse(e.newValue) : null;
            
            if (messageData && messageData.tabId !== this.tabId) {
              const listeners = this.listeners.get(messageType);
              if (listeners) {
                listeners.forEach(listener => listener(messageData.data));
              }
            }
          } catch (error) {
            console.error('❌ Error processing storage fallback:', error);
          }
        }
      });
    }
  }

  private cleanupHistory() {
    if (this.messageHistory.size > this.HISTORY_LIMIT) {
      const entries = Array.from(this.messageHistory.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries
      const toRemove = entries.slice(0, entries.length - this.HISTORY_LIMIT);
      toRemove.forEach(([key]) => this.messageHistory.delete(key));
    }
  }

  // Enhanced message sending with metadata
  send(type: string, data?: unknown) {
    const timestamp = Date.now();
    const message = {
      type,
      data,
      tabId: this.tabId,
      timestamp
    };

    console.log(`📤 Broadcasting message: ${type} from tab ${this.tabId}`);

    if (this.channel) {
      this.channel.postMessage(message);
    } else if (typeof window !== 'undefined') {
      // Storage fallback for browsers without BroadcastChannel
      try {
        localStorage.setItem(`broadcast_${type}`, JSON.stringify(message));
        // Clean up immediately to avoid storage bloat
        setTimeout(() => {
          localStorage.removeItem(`broadcast_${type}`);
        }, 1000);
      } catch (error) {
        console.error('❌ Error sending message via storage fallback:', error);
      }
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

  // Close channel and cleanup
  close() {
    console.log(`🔌 Closing tab communication for ${this.tabId}`);
    
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    
    this.listeners.clear();
    this.messageHistory.clear();
  }

  // Get tab information
  getTabInfo() {
    return {
      tabId: this.tabId,
      hasChannel: !!this.channel,
      listenerCount: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
      historyCount: this.messageHistory.size
    };
  }

  // Send ping to check active tabs
  ping() {
    this.send('ping', { tabId: this.tabId, timestamp: Date.now() });
  }

  // Check if BroadcastChannel is supported
  isSupported() {
    return typeof window !== 'undefined' && 'BroadcastChannel' in window;
  }
}

// Global instance
export const tabComm = new TabCommunication();

// Enhanced message types
export const MESSAGE_TYPES = {
  LOGOUT: 'logout',
  LOGIN: 'login',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_REFRESHED: 'token_refreshed',
  SESSION_UPDATE: 'session_update',
  USER_ACTIVITY: 'user_activity',
  PING: 'ping',
  PONG: 'pong',
  FORCE_LOGOUT: 'force_logout'
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// Enhanced utility functions
export const broadcastLogout = (reason?: string) => {
  console.log('📤 Broadcasting logout:', reason || 'User initiated');
  tabComm.send(MESSAGE_TYPES.LOGOUT, { reason, timestamp: Date.now() });
};

export const broadcastLogin = (userData: { id: string; email: string; name: string; role: "user" | "admin" }) => {
  console.log('📤 Broadcasting login for user:', userData.name);
  tabComm.send(MESSAGE_TYPES.LOGIN, { ...userData, timestamp: Date.now() });
};

export const broadcastTokenExpired = (reason?: string) => {
  console.log('📤 Broadcasting token expired:', reason || 'Token validation failed');
  tabComm.send(MESSAGE_TYPES.TOKEN_EXPIRED, { reason, timestamp: Date.now() });
};

export const broadcastTokenRefreshed = (expiresAt: number) => {
  console.log('📤 Broadcasting token refreshed, expires at:', new Date(expiresAt).toISOString());
  tabComm.send(MESSAGE_TYPES.TOKEN_REFRESHED, { expiresAt, timestamp: Date.now() });
};

export const broadcastSessionUpdate = (sessionData: unknown) => {
  console.log('📤 Broadcasting session update');
  tabComm.send(MESSAGE_TYPES.SESSION_UPDATE, { sessionData, timestamp: Date.now() });
};

export const broadcastUserActivity = (activity: string, data?: unknown) => {
  tabComm.send(MESSAGE_TYPES.USER_ACTIVITY, { activity, data, timestamp: Date.now() });
};

export const broadcastForceLogout = (reason: string, adminId?: string) => {
  console.log('📤 Broadcasting force logout:', reason);
  tabComm.send(MESSAGE_TYPES.FORCE_LOGOUT, { reason, adminId, timestamp: Date.now() });
};

// Setup ping/pong for tab activity monitoring
export const setupTabActivityMonitor = () => {
  let isActive = true;
  
  // Listen for pings and respond with pong
  tabComm.listen(MESSAGE_TYPES.PING, (data?: unknown) => {
    const pingData = data as { tabId?: string; [key: string]: unknown } | undefined;
    if (isActive) {
      tabComm.send(MESSAGE_TYPES.PONG, { 
        respondingTo: pingData?.tabId, 
        timestamp: Date.now(),
        url: window.location.href
      });
    }
  });

  // Send periodic pings
  setInterval(() => {
    if (isActive) {
      tabComm.ping();
    }
  }, 30000); // Every 30 seconds

  // Detect tab visibility changes
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      isActive = !document.hidden;
      if (isActive) {
        broadcastUserActivity('tab_active');
      } else {
        broadcastUserActivity('tab_inactive');
      }
    });
  }

  return () => {
    isActive = false;
  };
};

// Debug function to get tab communication status
export const getTabCommunicationStatus = () => {
  return {
    ...tabComm.getTabInfo(),
    isSupported: tabComm.isSupported(),
    messageTypes: Object.keys(MESSAGE_TYPES)
  };
}; 