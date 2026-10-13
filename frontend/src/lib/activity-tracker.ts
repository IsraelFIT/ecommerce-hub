/**
 * Activity Tracker
 * Tracks user interactions (clicks, keyboard, touch, scroll, pointer) across browser tabs.
 * Used to determine whether proactive access token refreshing should occur or if the user is idle.
 */

export const LAST_ACTIVITY_STORAGE_KEY = "ecommerce_hub_last_active_at";
export const INACTIVITY_WINDOW_MS = 25 * 60 * 1000; // 25 minutes inactivity cutoff

let inMemoryLastActive = typeof window !== "undefined" ? Date.now() : 0;
let lastRecordedTime = 0;

/**
 * Records a user interaction timestamp into memory and localStorage.
 * Throttled to at most once every 5 seconds to reduce storage operations.
 */
export function recordUserActivity(): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  inMemoryLastActive = now;

  // Throttle disk/storage writes to once every 5 seconds
  if (now - lastRecordedTime > 5000) {
    lastRecordedTime = now;
    try {
      localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
    } catch {
      // Ignore quota or private-browsing errors
    }
  }
}

/**
 * Returns the timestamp (in milliseconds) of the most recent user activity across any tab.
 */
export function getLastUserActivity(): number {
  if (typeof window === "undefined") return Date.now();

  try {
    const stored = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.max(parsed, inMemoryLastActive);
      }
    }
  } catch {
    // Ignore
  }

  return inMemoryLastActive;
}

/**
 * Checks whether the user has been active within the specified time window.
 * Default window is 25 minutes (matching the 5-minute pre-expiry refresh buffer of a 30-minute token).
 */
export function isUserRecentlyActive(
  thresholdMs: number = INACTIVITY_WINDOW_MS,
): boolean {
  const lastActive = getLastUserActivity();
  const timeSinceLastActive = Date.now() - lastActive;
  return timeSinceLastActive <= thresholdMs;
}

/**
 * Attaches global user interaction listeners on the browser window.
 * Returns a cleanup function to remove all listeners.
 */
export function setupActivityListeners(onActivity?: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  // Record initial activity upon load
  recordUserActivity();

  const handleInteraction = () => {
    recordUserActivity();
    if (onActivity) {
      onActivity();
    }
  };

  const events: (keyof WindowEventMap)[] = [
    "mousedown",
    "keydown",
    "touchstart",
    "scroll",
    "mousemove",
    "pointerdown",
  ];

  // Attach passive listeners to minimize impact on page scrolling/rendering
  events.forEach((eventName) => {
    window.addEventListener(eventName, handleInteraction, {
      passive: true,
      capture: true,
    });
  });

  return () => {
    events.forEach((eventName) => {
      window.removeEventListener(eventName, handleInteraction, {
        capture: true,
      });
    });
  };
}
