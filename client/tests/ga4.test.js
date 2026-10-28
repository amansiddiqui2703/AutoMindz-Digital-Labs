import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('Google Analytics 4 (GA4) Integration Verification', () => {
  const MEASUREMENT_ID = 'G-6NFVEJCMYX';
  const PRODUCTION_DOMAIN = 'https://automindzdigitallabs.online';

  it('index.html contains the correct GA4 script and config snippet', () => {
    const indexPath = path.join(rootDir, 'client', 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    // Verify tag manager script inclusion with async attribute
    assert.ok(
      indexContent.includes(`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`),
      `index.html must load gtag.js with measurement ID ${MEASUREMENT_ID}`
    );
    assert.ok(
      indexContent.includes(`async src="https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}"`),
      'gtag.js script must be loaded asynchronously so it never blocks page rendering'
    );

    // Verify dataLayer and gtag initialization
    assert.ok(
      indexContent.includes('window.dataLayer = window.dataLayer || [];'),
      'index.html must initialize window.dataLayer'
    );
    assert.ok(
      indexContent.includes('window.gtag = gtag;'),
      'index.html must bind gtag explicitly to window.gtag'
    );

    // Verify automatic page_view is disabled in index.html to eliminate duplicate tracking in SPA
    assert.ok(
      indexContent.includes(`gtag('config', '${MEASUREMENT_ID}', { send_page_view: false });`),
      'index.html config must specify { send_page_view: false } to prevent duplicate page_view events on SPA load'
    );

    // Verify preconnect for performance optimization
    assert.ok(
      indexContent.includes('href="https://www.googletagmanager.com"'),
      'index.html should preconnect to googletagmanager.com'
    );
    assert.ok(
      indexContent.includes('href="https://www.google-analytics.com"'),
      'index.html should preconnect to google-analytics.com'
    );
  });

  it('App.jsx mounts AnalyticsTracker inside BrowserRouter for client-side route tracking', () => {
    const appPath = path.join(rootDir, 'client', 'src', 'App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    assert.ok(
      appContent.includes("import AnalyticsTracker from './components/AnalyticsTracker';"),
      'App.jsx must import AnalyticsTracker'
    );
    assert.ok(
      /<BrowserRouter>[\s\S]*<AnalyticsTracker \/>[\s\S]*<\/BrowserRouter>/.test(appContent),
      'AnalyticsTracker must be placed inside BrowserRouter to observe route changes'
    );
  });

  it('analytics.js exports correct GA_MEASUREMENT_ID, trackEvent, and trackPageView', async () => {
    const mockDataLayer = [];
    global.window = {
      dataLayer: mockDataLayer,
      location: { href: `${PRODUCTION_DOMAIN}/dashboard` },
    };
    global.document = {
      title: 'Dashboard | AutoMindz',
    };

    const analytics = await import('../src/utils/analytics.js');

    assert.equal(analytics.GA_MEASUREMENT_ID, MEASUREMENT_ID);
    assert.equal(typeof analytics.trackEvent, 'function');
    assert.equal(typeof analytics.trackPageView, 'function');

    // Test trackEvent pushes to dataLayer
    analytics.trackEvent('custom_event', { category: 'engagement', value: 42 });

    assert.ok(mockDataLayer.length > 0, 'trackEvent must push to dataLayer');
    const customCall = mockDataLayer[mockDataLayer.length - 1];
    assert.equal(customCall[0], 'event');
    assert.equal(customCall[1], 'custom_event');
    assert.equal(customCall[2].send_to, MEASUREMENT_ID);
    assert.equal(customCall[2].category, 'engagement');
    assert.equal(customCall[2].value, 42);

    // Test trackPageView sends page_view with correct fields
    analytics.trackPageView('/campaigns', 'Campaigns | AutoMindz', `${PRODUCTION_DOMAIN}/campaigns`);
    const pageViewCall = mockDataLayer[mockDataLayer.length - 1];
    assert.equal(pageViewCall[0], 'event');
    assert.equal(pageViewCall[1], 'page_view');
    assert.equal(pageViewCall[2].send_to, MEASUREMENT_ID);
    assert.equal(pageViewCall[2].page_title, 'Campaigns | AutoMindz');
    assert.equal(pageViewCall[2].page_path, '/campaigns');
    assert.equal(pageViewCall[2].page_location, `${PRODUCTION_DOMAIN}/campaigns`);

    delete global.window;
    delete global.document;
  });

  it('AnalyticsTracker component imports analytics utilities and implements deduplication', () => {
    const trackerPath = path.join(rootDir, 'client', 'src', 'components', 'AnalyticsTracker.jsx');
    const trackerContent = fs.readFileSync(trackerPath, 'utf-8');

    assert.ok(
      trackerContent.includes("from '../utils/analytics.js'"),
      'AnalyticsTracker must import utilities from analytics.js'
    );
    assert.ok(
      trackerContent.includes('lastTrackedPathRef.current === currentPath'),
      'AnalyticsTracker must check lastTrackedPathRef to prevent duplicate page_views'
    );
    assert.ok(
      trackerContent.includes('useLocation'),
      'AnalyticsTracker must use React Router useLocation hook'
    );
  });

  it('server Content Security Policy allows Google Analytics & Google Tag Manager', () => {
    const serverIndexPath = path.join(rootDir, 'server', 'src', 'index.js');
    const serverContent = fs.readFileSync(serverIndexPath, 'utf-8');

    // Check scriptSrc
    assert.ok(
      serverContent.includes('https://www.googletagmanager.com'),
      'CSP scriptSrc must allow https://www.googletagmanager.com'
    );
    assert.ok(
      serverContent.includes('https://www.google-analytics.com'),
      'CSP scriptSrc must allow https://www.google-analytics.com'
    );

    // Check connectSrc
    assert.ok(
      serverContent.includes('https://*.google-analytics.com'),
      'CSP connectSrc must allow https://*.google-analytics.com'
    );
    assert.ok(
      serverContent.includes('https://*.analytics.google.com'),
      'CSP connectSrc must allow https://*.analytics.google.com'
    );
  });
});