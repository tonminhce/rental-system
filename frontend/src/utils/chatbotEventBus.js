/**
 * ChatbotEventBus - A simple event system to allow the chatbot to communicate with the frontend
 * This enables the chatbot to trigger map and filter updates
 */

export const CHATBOT_EVENTS = {
  UPDATE_FILTERS: 'update_filters',
  UPDATE_MAP_LOCATION: 'update_map_location'
};

class ChatbotEventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Function to call when event is triggered
   * @returns {Function} - Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name to unsubscribe from
   * @param {Function} callback - Callback function to remove
   */
  unsubscribe(event, callback) {
    if (!this.listeners[event]) {
      return;
    }
    
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Publish an event with data
   * @param {string} event - Event name to publish
   * @param {any} data - Data to pass to subscribers
   */
  publish(event, data) {
    
    if (!this.listeners[event]) {
      return;
    }
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ChatbotEventBus listener for ${event}:`, error);
      }
    });
  }
}

const eventBus = new ChatbotEventBus();
export default eventBus; 