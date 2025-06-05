import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status of the application
 * @returns An object containing the online status and a function to check connectivity
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    // Function to update the online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Add event listeners for online and offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  /**
   * Actively check connectivity by making a small request
   * This is more reliable than just using navigator.onLine
   * @returns Promise resolving to true if connected, false otherwise
   */
  const checkConnectivity = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to check actual connectivity
      // Using a timestamp to prevent caching
      const response = await fetch(`/ping?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        // Short timeout to avoid long waits
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch (error) {
      console.log('Connectivity check failed:', error);
      return false;
    }
  };

  return { isOnline, checkConnectivity };
};
