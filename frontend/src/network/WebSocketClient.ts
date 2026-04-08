import type { WSMessage } from '../types';

type Handler = (msg: WSMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageQueue: WSMessage[] = [];
  private handlers: Map<string, Handler[]> = new Map();

  connect(lobbyCode: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // In dev, VITE_BACKEND_URL is unset → Vite proxy handles /ws/*
      // In production, it's the full backend URL (https://…)
      const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/$/, '');
      const wsBase = backendUrl
        ? backendUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
        : '';
      const url = wsBase ? `${wsBase}/ws/${lobbyCode}/${playerId}` : `/ws/${lobbyCode}/${playerId}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => resolve();

      this.ws.onerror = (e) => reject(e);

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          // Notify React subscribers immediately
          const typeHandlers = this.handlers.get(msg.type) ?? [];
          const wildcardHandlers = this.handlers.get('*') ?? [];
          [...typeHandlers, ...wildcardHandlers].forEach((h) => h(msg));
          // Also queue for Phaser
          this.messageQueue.push(msg);
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onclose = () => {
        const handlers = this.handlers.get('__close__') ?? [];
        handlers.forEach((h) => h({ type: '__close__' }));
      };
    });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.messageQueue = [];
    this.handlers.clear();
  }

  send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /** React components subscribe to message types. Returns unsubscribe fn. */
  subscribe(type: string, handler: Handler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
    return () => {
      const list = this.handlers.get(type) ?? [];
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
    };
  }

  /** Phaser calls this each frame to drain buffered messages. */
  flushQueue(): WSMessage[] {
    const msgs = this.messageQueue.slice();
    this.messageQueue = [];
    return msgs;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton
export const wsClient = new WebSocketClient();
