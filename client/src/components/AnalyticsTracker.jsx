import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GA_MEASUREMENT_ID, trackEvent, trackPageView } from '../utils/analytics.js';

export { GA_MEASUREMENT_ID, trackEvent, trackPageView };

/**
 * Tracks SPA client-side route changes to Google Analytics 4.
 *
 * Guarantees:
 * - Tracks initial page load and every client-side route navigation.
 * - Deduplicates page_view events when the route path/query has not changed.
 * - Safely handles adblockers, slow network connections, or queued dataLayer.
 * - Waits briefly for react-helmet-async to update document.title.
 */
export default function AnalyticsTracker() {
  const location = useLocation();
  const lastTrackedPathRef = useRef('');

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Prevent duplicate page_view events for the same path
    if (lastTrackedPathRef.current === currentPath) return;
    lastTrackedPathRef.current = currentPath;

    // Short delay allows document.title (updated via react-helmet-async) to apply
    const timer = setTimeout(() => {
      trackPageView(currentPath);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
