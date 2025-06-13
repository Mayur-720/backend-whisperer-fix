
// Extend global types for mobile-specific properties
declare global {
  interface Navigator {
    standalone?: boolean;
  }

  interface NotificationOptions {
    vibrate?: number[] | number;
    actions?: NotificationAction[];
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
  }

  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }
}

export {};
