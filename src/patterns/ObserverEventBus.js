/**
 * PATRÓN DE DISEÑO: OBSERVER (Event Bus)
 * Permite que pantallas, stores y servicios reaccionen de forma desacoplada a
 * eventos en tiempo real (solicitudes, chat, ubicación, notificaciones).
 */
class ObserverEventBus {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return () => {
      const subs = this.listeners.get(eventName);
      if (subs) subs.delete(callback);
    };
  }

  notify(eventName, payload) {
    const subs = this.listeners.get(eventName);
    if (!subs) return;
    subs.forEach((cb) => {
      try {
        cb(payload);
      } catch (_err) {}
    });
  }
}

export const appEventBus = new ObserverEventBus();
export const APP_EVENTS = {
  REQUEST_STATUS_CHANGED: 'REQUEST_STATUS_CHANGED',
  NEW_NOTIFICATION: 'NEW_NOTIFICATION',
  CHAT_MESSAGE_RECEIVED: 'CHAT_MESSAGE_RECEIVED',
  LOCATION_UPDATED: 'LOCATION_UPDATED',
  CATALOG_UPDATED: 'CATALOG_UPDATED',
};
