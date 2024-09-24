'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(
          function(registration) {
            console.log('Service Worker registered successfully:', registration.scope);
          },
          function(err) {
            console.log('Service Worker registration failed:', err);
          }
        );
      });
    }
  }, []);

  return null;
}