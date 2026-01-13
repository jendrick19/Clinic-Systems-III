// Event bus para comunicación entre componentes
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

export const eventBus = new EventBus();

// Eventos disponibles
export const EVENTS = {
    APPOINTMENT_CREATED: 'appointment:created',
    APPOINTMENT_CANCELLED: 'appointment:cancelled',
    APPOINTMENT_UPDATED: 'appointment:updated',
    REFRESH_DASHBOARD: 'dashboard:refresh'
};
