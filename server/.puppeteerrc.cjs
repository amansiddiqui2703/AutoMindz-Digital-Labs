/**
 * Puppeteer configuration for Render deployment.
 * Skips bundled Chromium download — Render provides system Chrome via buildpack.
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    skipDownload: true,
};
