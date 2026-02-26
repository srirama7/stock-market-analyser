type MessageHandler = (data: unknown) => void;

function isElectron(): boolean {
  return typeof window !== 'undefined' &&
    typeof (window as unknown as Record<string, unknown>).electronAPI !== 'undefined';
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    let wsUrl: string;
    if (isElectron() || typeof (window as unknown as Record<string, unknown>).Capacitor !== 'undefined') {
      // Desktop (Electron) or native app - connect directly to backend
      wsUrl = `ws://localhost:8000${this.url}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}${this.url}`;
    }
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.emit('connected', null);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.emit(msg.type, msg);
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.emit('disconnected', null);
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
          this.connect();
        }, this.reconnectDelay);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(symbols: string[]) {
    this.send({ action: 'subscribe', symbols });
  }

  unsubscribe(symbols: string[]) {
    this.send({ action: 'unsubscribe', symbols });
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach(h => h(data));
  }
}

// Singleton instances
export const priceWs = new WebSocketClient('/ws/prices');
export const marketWs = new WebSocketClient('/ws/market');
