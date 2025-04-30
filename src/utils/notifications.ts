/**
 * Notifications Utility for Aidant-Aide-Offline
 * 
 * This module handles:
 * 1. Requesting notification permissions
 * 2. Scheduling notifications (with fallbacks)
 * 3. Hydrating notifications from IndexedDB
 * 4. Communicating with the service worker
 */

import { Task } from "@/lib/db";

// Define interfaces for our notification system
export interface ReminderPayload {
  id: number;
  title: string;
  body: string;
  timestamp: number;
  url?: string;
  taskId?: number;
  tag?: string;
}

// Type guard for checking Notification Triggers API support
interface NotificationTrigger {
  showTrigger: TimestampTrigger;
}

interface TimestampTrigger {
  timestamp: number;
}

// Check if the browser supports the Notification Triggers API
const supportsNotificationTriggers = (): boolean => {
  return 'Notification' in window && 
         'showTrigger' in Notification.prototype;
};

// Check if service workers are supported
const supportsServiceWorker = (): boolean => {
  return 'serviceWorker' in navigator;
};

/**
 * Request notification permission from the user
 * @returns Promise that resolves to the permission status
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  // If we already have permission, return it
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // Otherwise, request permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Register the service worker for notifications
 * @returns Promise that resolves to the ServiceWorkerRegistration
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!supportsServiceWorker()) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

/**
 * Schedule a notification using the best available method
 * @param reminder The reminder payload to schedule
 * @returns Promise that resolves to true if successfully scheduled
 */
export const scheduleNotification = async (reminder: ReminderPayload): Promise<boolean> => {
  // Check if we have permission to show notifications
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  const now = Date.now();
  
  // Don't schedule notifications in the past
  if (reminder.timestamp < now) {
    console.warn(`Reminder ${reminder.id} is in the past, not scheduling`);
    return false;
  }

  // Log the reminder details for debugging
  console.log(`Scheduling reminder for task ${reminder.id}:`, {
    title: reminder.title,
    body: reminder.body,
    timestamp: new Date(reminder.timestamp).toLocaleString(),
    timeFromNow: Math.round((reminder.timestamp - now) / 60000) + ' minutes from now'
  });

  // Try to use the Notification Triggers API if available
  if (supportsNotificationTriggers()) {
    try {
      // TypeScript doesn't know about showTrigger yet, so we need to cast
      const options: NotificationOptions & Partial<NotificationTrigger> = {
        body: reminder.body,
        tag: reminder.tag || `reminder-${reminder.id}`,
        data: { 
          url: reminder.url || '/tasks',
          taskId: reminder.taskId,
          timestamp: reminder.timestamp
        },
        // Use the Notification Triggers API
        showTrigger: { timestamp: reminder.timestamp } as TimestampTrigger
      };

      // Create the notification with trigger
      if (supportsServiceWorker() && navigator.serviceWorker.controller) {
        // Schedule via service worker if available
        await navigator.serviceWorker.ready;
        await navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          reminder,
          options
        });
        console.log(`Scheduled notification ${reminder.id} via service worker`);
        return true;
      } else {
        // Fall back to direct scheduling
        new Notification(reminder.title, options);
        console.log(`Scheduled notification ${reminder.id} directly with trigger`);
        return true;
      }
    } catch (error) {
      console.error('Error scheduling notification with trigger:', error);
      // Fall through to setTimeout fallback
    }
  }

  // Fallback: Use setTimeout for in-app notifications
  const delay = reminder.timestamp - now;
  
  // For testing purposes, if the delay is more than 5 minutes, also create an immediate test notification
  if (delay > 300000) { // 5 minutes in milliseconds
    // Create a test notification to confirm the system is working
    new Notification('Notification System Active', {
      body: `Your reminder for "${reminder.title}" is scheduled for ${new Date(reminder.timestamp).toLocaleString()}`,
      tag: 'notification-test'
    });
  }
  
  // Store the timeout ID so we can cancel it if needed
  const timeoutId = setTimeout(() => {
    // Show the notification when the timeout fires
    if (Notification.permission === 'granted') {
      const notification = new Notification(reminder.title, {
        body: reminder.body,
        tag: reminder.tag || `reminder-${reminder.id}`,
        data: { 
          url: reminder.url || '/tasks',
          taskId: reminder.taskId
        }
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        if (reminder.url) {
          window.location.href = reminder.url;
        }
        notification.close();
      };
    }
  }, delay);

  // Store the timeout ID in a global map so we can cancel it if needed
  window.__NOTIFICATION_TIMEOUTS = window.__NOTIFICATION_TIMEOUTS || new Map();
  window.__NOTIFICATION_TIMEOUTS.set(reminder.id, timeoutId);
  
  console.log(`Scheduled notification ${reminder.id} with setTimeout (${delay}ms)`);
  return true;
};

/**
 * Cancel a scheduled notification
 * @param id The ID of the reminder to cancel
 */
export const cancelNotification = async (id: number): Promise<void> => {
  // Cancel the setTimeout if it exists
  if (window.__NOTIFICATION_TIMEOUTS?.has(id)) {
    clearTimeout(window.__NOTIFICATION_TIMEOUTS.get(id));
    window.__NOTIFICATION_TIMEOUTS.delete(id);
  }

  // Also tell the service worker to cancel it
  if (supportsServiceWorker() && navigator.serviceWorker.controller) {
    await navigator.serviceWorker.ready;
    navigator.serviceWorker.controller.postMessage({
      type: 'CANCEL_NOTIFICATION',
      id
    });
  }
};

/**
 * Hydrate all future reminders from the database
 * @param tasks Array of tasks with reminders
 */
export const hydrateReminders = async (tasks: Task[]): Promise<void> => {
  const now = Date.now();
  
  // Filter for tasks with future reminders
  const tasksWithReminders = tasks.filter(task => {
    // Check if the task has a reminderAt property and it's in the future
    return task.reminderAt && new Date(task.reminderAt).getTime() > now;
  });

  console.log(`Hydrating ${tasksWithReminders.length} reminders`);

  // Schedule each reminder
  for (const task of tasksWithReminders) {
    const reminderTime = new Date(task.reminderAt!).getTime();
    
    // Create a reminder payload
    const reminder: ReminderPayload = {
      id: task.id!,
      title: `Reminder: ${task.description.substring(0, 50)}`,
      body: `Due: ${new Date(task.dueDate).toLocaleString()}`,
      timestamp: reminderTime,
      url: `/tasks?id=${task.id}`,
      taskId: task.id,
      tag: `task-${task.id}`
    };

    // Schedule the notification
    await scheduleNotification(reminder);
  }
};

/**
 * Set up a listener for messages from the service worker
 */
export const setupServiceWorkerListener = (): void => {
  if (!supportsServiceWorker()) return;

  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', async (event) => {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_REMINDERS':
        // Re-hydrate reminders when requested by the service worker
        console.log('Received SYNC_REMINDERS message from service worker');
        // You would typically call a function here to fetch tasks from IndexedDB
        // and then call hydrateReminders with the results
        break;
        
      default:
        console.log('Received unknown message from service worker:', type);
    }
  });
};

// Declare global types for our notification timeouts
declare global {
  interface Window {
    __NOTIFICATION_TIMEOUTS?: Map<number, NodeJS.Timeout>;
  }
}
