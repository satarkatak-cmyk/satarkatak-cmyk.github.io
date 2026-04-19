// Minimal service worker stub
// Purpose: avoid 404 during registration and provide a harmless SW lifecycle.

'use strict';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting so registration errors disappear.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of uncontrolled clients as soon as possible.
  event.waitUntil(self.clients.claim());
});

// No aggressive caching or fetch interception — let the page behave normally.
// This avoids stale content and ensures dynamic complaint data loads from network.
