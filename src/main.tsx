import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// Dynamic manifest switching based on current route
function updateManifestForRoute() {
  const currentPath = window.location.pathname;
  let manifestHref = '/manifest.json'; // default

  // Map routes to specific manifests
  const routeManifests = {
    '/': '/manifest-dashboard.json',
    '/dashboard': '/manifest-dashboard.json',
    '/vehicles': '/manifest-vehicles.json',
    '/drivers': '/manifest-drivers.json',
    '/assignments': '/manifest-assignments.json',
    '/financial': '/manifest-financial.json',
    '/reports': '/manifest.json', // Use default for reports
    '/payments': '/manifest-financial.json', // Financial related
    '/fuel-prices': '/manifest.json', // Use default
    '/fuel-records': '/manifest.json', // Use default
    '/insurance': '/manifest.json', // Use default
    '/maintenance-records': '/manifest.json', // Use default
    '/partners': '/manifest.json' // Use default
  };

  // Check for exact matches first
  if (routeManifests[currentPath]) {
    manifestHref = routeManifests[currentPath];
  }
  // Check for dynamic routes
  else if (currentPath.startsWith('/vehicle-details/')) {
    manifestHref = '/manifest-vehicles.json';
  }
  else if (currentPath.startsWith('/driver-details/')) {
    manifestHref = '/manifest-drivers.json';
  }
  else if (currentPath.startsWith('/assignment-details/')) {
    manifestHref = '/manifest-assignments.json';
  }
  else if (currentPath.startsWith('/partner-details/')) {
    manifestHref = '/manifest.json'; // Use default
  }
  else if (currentPath.startsWith('/expense-details/')) {
    manifestHref = '/manifest-financial.json';
  }
  else if (currentPath.startsWith('/insurance-policy-details/')) {
    manifestHref = '/manifest.json'; // Use default
  }

  // Update the manifest link in the head
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (manifestLink && manifestLink.href !== window.location.origin + manifestHref) {
    manifestLink.href = manifestHref;
    console.log(`🔄 Manifest switched to: ${manifestHref}`);
  }
}

// Update manifest on page load and route changes
updateManifestForRoute();

// Force manifest refresh for PWA icon updates
if ('serviceWorker' in navigator && 'caches' in window) {
  // Clear any cached manifests
  caches.keys().then(names => {
    names.forEach(name => {
      if (name.includes('manifest')) {
        caches.delete(name);
      }
    });
  });
}

// Listen for navigation events (for SPA routing)
window.addEventListener('popstate', updateManifestForRoute);

// Also listen for custom navigation events if using React Router
let currentPath = window.location.pathname;
setInterval(() => {
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname;
    // Small delay to ensure route has settled
    setTimeout(() => {
      updateManifestForRoute();
    }, 200);
  }
}, 500); // Check less frequently

// Enhanced PWA shortcut detection and native app behavior
let isFromShortcut = false;
let shortcutStartUrl = '';
let appLaunchTime = Date.now();

// Detect if app was launched from PWA shortcut with enhanced detection
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.matchMedia('(display-mode: fullscreen)').matches ||
                       (window.navigator as any).standalone === true;
  const hasStartUrl = urlParams.has('start_url');

  if (isStandalone && hasStartUrl) {
    isFromShortcut = true;
    shortcutStartUrl = urlParams.get('start_url') || '';
    console.log('🚀 Launched from PWA shortcut:', shortcutStartUrl);

    // Store preferred interface for future launches
    localStorage.setItem('preferredInterface', shortcutStartUrl);

    // Disable back button navigation for native app experience
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBackNavigation);

    // Add native app styling
    document.body.classList.add('native-app-mode');
  }

  // Track app launch time for performance monitoring
  appLaunchTime = Date.now();

  // Track app usage for analytics
  trackAppUsage();
});

// Handle PWA install prompt
let deferredPrompt: any;
let installBanner: HTMLElement | null = null;
let installButton: HTMLElement | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎪 PWA install prompt event triggered!');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;

  // Show custom install banner after a short delay
  setTimeout(() => {
    showInstallBanner();
  }, 3000); // Show after 3 seconds of engagement
});

// Handle successful PWA installation
window.addEventListener('appinstalled', (evt) => {
  console.log('✅ PWA was installed successfully!');
  // Hide install UI
  hideInstallBanner();
  hideInstallButton();

  // Track installation
  localStorage.setItem('pwaInstalled', 'true');
  localStorage.setItem('installDate', new Date().toISOString());

  // Show success message
  showInstallSuccessMessage();
});

// Enhanced native app behavior functions
function preventBackNavigation(event: PopStateEvent) {
  if (isFromShortcut) {
    // Prevent back navigation and show confirmation
    const shouldExit = confirm('This will close the app. Are you sure you want to exit?');
    if (!shouldExit) {
      // Push state again to prevent navigation
      window.history.pushState(null, '', window.location.href);
    } else {
      // Allow exit - remove the prevention
      window.removeEventListener('popstate', preventBackNavigation);
      isFromShortcut = false;
    }
  }
}

// Function to track app usage for analytics
function trackAppUsage() {
  const usageData = {
    launchTime: new Date().toISOString(),
    userAgent: navigator.userAgent,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    preferredInterface: localStorage.getItem('preferredInterface'),
    sessionId: generateSessionId()
  };

  // Store usage data (could be sent to analytics service)
  localStorage.setItem('lastSessionData', JSON.stringify(usageData));
  console.log('📊 App usage tracked:', usageData);
}

// Generate unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Handle app visibility changes (like native apps)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('👁️ App hidden (backgrounded)');
    // Could pause timers, save state, etc.
  } else {
    console.log('👁️ App visible (foregrounded)');
    // Could resume timers, refresh data, etc.
  }
});

// Handle online/offline status
window.addEventListener('online', () => {
  console.log('🌐 Back online');
  hideOfflineIndicator();
});

window.addEventListener('offline', () => {
  console.log('📶 Gone offline');
  showOfflineIndicator();
});

// Function to show offline indicator
function showOfflineIndicator() {
  let indicator = document.getElementById('offline-indicator');
  if (indicator) return;

  indicator = document.createElement('div');
  indicator.id = 'offline-indicator';
  indicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 16px; height: 16px; background: #ef4444; border-radius: 50%;"></div>
      <span style="font-weight: 500;">You're offline</span>
    </div>
  `;

  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 8px 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #dc2626;
  `;

  document.body.appendChild(indicator);
}

// Function to hide offline indicator
function hideOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator && indicator.parentNode) {
    indicator.parentNode.removeChild(indicator);
  }
}

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Function to show install banner (more native-like)
function showInstallBanner() {
  // Don't show if already installed or dismissed recently
    if (localStorage.getItem('pwaInstalled') === 'true' ||
        localStorage.getItem('installBannerDismissed') === 'true') {
      return;
    }

  // Remove existing banner if any
  hideInstallBanner();

  // Create install banner
  installBanner = document.createElement('div');
  installBanner.id = 'pwa-install-banner';
  installBanner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/icon-192.png" alt="Route Glide Icon" style="width: 48px; height: 48px; border-radius: 12px;">
      <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 16px; color: #1f2937;">Install Route Glide</div>
        <div style="font-size: 14px; color: #6b7280;">Get the full experience with offline access</div>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="install-later" style="padding: 8px 16px; background: none; border: 1px solid #d1d5db; border-radius: 6px; color: #6b7280; cursor: pointer;">Later</button>
      <button id="install-now" style="padding: 8px 16px; background: #2563eb; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 500;">Install</button>
    </div>
  `;

  installBanner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 400px;
    margin: 0 auto;
  `;

  // Add event listeners
  const installNowBtn = installBanner.querySelector('#install-now') as HTMLButtonElement;
  const installLaterBtn = installBanner.querySelector('#install-later') as HTMLButtonElement;

  installNowBtn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        hideInstallBanner();
      } else {
        console.log('❌ User dismissed the install prompt');
      }

      deferredPrompt = null;
    }
  };

  installLaterBtn.onclick = () => {
    localStorage.setItem('installBannerDismissed', 'true');
    hideInstallBanner();
  };

  document.body.appendChild(installBanner);
  console.log('📱 Install banner shown');
}

// Function to hide install banner
function hideInstallBanner() {
  if (installBanner && installBanner.parentNode) {
    installBanner.parentNode.removeChild(installBanner);
    installBanner = null;
    console.log('📱 Install banner hidden');
  }
}

// Function to hide install button (fallback)
function hideInstallButton() {
  if (installButton && installButton.parentNode) {
    installButton.parentNode.removeChild(installButton);
    installButton = null;
    console.log('📱 Install button hidden');
  }
}

// Function to show install success message
function showInstallSuccessMessage() {
  const successMessage = document.createElement('div');
  successMessage.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      </div>
      <div>
        <div style="font-weight: bold; color: #1f2937;">App Installed!</div>
        <div style="font-size: 14px; color: #6b7280;">Find it in your app drawer</div>
      </div>
    </div>
  `;

  successMessage.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    right: 20px;
    background: white;
    border: 1px solid #10b981;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 300px;
    margin: 0 auto;
    animation: slideIn 0.3s ease-out;
  `;

  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(successMessage);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (successMessage.parentNode) {
      successMessage.parentNode.removeChild(successMessage);
    }
  }, 3000);
}
