/**
 * Google Analytics 4 (GA4) Utilities
 * Measurement ID: G-6NFVEJCMYX
 * Production Domain: https://automindzdigitallabs.online
 */

export const GA_MEASUREMENT_ID = 'G-6NFVEJCMYX';

/**
 * Safely push an event to Google Analytics 4 dataLayer.
 * Queues gracefully if gtag.js is still loading or if an adblocker prevents script execution.
 *
 * @param {string} eventName - GA4 event name (e.g. 'page_view', 'login', 'signup')
 * @param {Record<string, any>} [params={}] - Event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  window.gtag('event', eventName, {
    send_to: GA_MEASUREMENT_ID,
    ...params,
  });
};

/**
 * Track a page view event in GA4.
 *
 * @param {string} pagePath - Relative route path + query string (e.g. '/dashboard')
 * @param {string} [pageTitle] - Document title
 * @param {string} [pageLocation] - Full URL (defaults to window.location.href)
 */
export const trackPageView = (pagePath, pageTitle, pageLocation) => {
  if (typeof window === 'undefined') return;

  const title = pageTitle || (typeof document !== 'undefined' ? document.title : '') || 'AutoMindz Digital Labs';
  const location = pageLocation || (typeof window !== 'undefined' ? window.location.href : '');

  trackEvent('page_view', {
    page_title: title,
    page_location: location,
    page_path: pagePath,
  });
};

