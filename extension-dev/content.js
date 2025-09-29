// Early blocker for social media and news sites - shows immediately while settings load
function injectEarlyBlocker() {
  // Check if we're on a blocked site (social media or news)
  const hostname = window.location.hostname;

  // Default hardcoded check for immediate blocking while sites.json loads
  // This will be replaced with async check once sites.json is loaded
  const defaultBlockedSites = [
    'linkedin.com', 'twitter.com', 'x.com', 'facebook.com',
    'theguardian.com', 'nytimes.com', 'washingtonpost.com',
    'bbc.com', 'cnn.com', 'reddit.com'
  ];

  const isBlockedSite = defaultBlockedSites.some(site =>
    hostname === site || hostname.endsWith('.' + site) || hostname.includes(site)
  );

  if (!isBlockedSite) {
    return null;
  }

  // Create immediate full-screen blocker
  const earlyBlocker = document.createElement('div');
  earlyBlocker.id = 'creativity-guard-early-blocker';
  earlyBlocker.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: #000000 !important;
    z-index: 2147483647 !important;
    display: block !important;
    opacity: 1 !important;
    pointer-events: all !important;
  `;

  // Add loading message
  const loadingMessage = document.createElement('div');
  loadingMessage.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 18px;
    text-align: center;
  `;
  loadingMessage.textContent = 'Checking access permissions...';
  earlyBlocker.appendChild(loadingMessage);

  // Inject as first element in body or html
  if (document.body) {
    document.body.insertBefore(earlyBlocker, document.body.firstChild);
  } else if (document.documentElement) {
    document.documentElement.appendChild(earlyBlocker);
  } else {
    // If DOM not ready, inject immediately when it is
    const injectWhenReady = () => {
      if (document.body) {
        document.body.insertBefore(earlyBlocker, document.body.firstChild);
      } else if (document.documentElement) {
        document.documentElement.appendChild(earlyBlocker);
      } else {
        requestAnimationFrame(injectWhenReady);
      }
    };
    injectWhenReady();
  }

  return earlyBlocker;
}

// Inject early blocker immediately for social media sites
const earlyBlockerElement = injectEarlyBlocker();

// Replace early blocker with dynamic check once sites.json loads
async function replaceEarlyBlockerWithDynamicCheck() {
  try {
    const blockResult = await shouldBlockCurrentSite();

    if (!blockResult.shouldBlock && earlyBlockerElement && earlyBlockerElement.parentNode) {
      // Site should not be blocked according to sites.json, remove early blocker
      earlyBlockerElement.parentNode.removeChild(earlyBlockerElement);
      console.log('[Creativity Guard] Early blocker removed - site not in blocking configuration');
    }
  } catch (error) {
    console.error('[Creativity Guard] Error checking dynamic site blocking:', error);
  }
}

// Schedule dynamic check to replace early blocker
setTimeout(replaceEarlyBlockerWithDynamicCheck, 100);

// Resource tracking and cleanup system
const CreativityGuardCleanup = {
  observers: new Set(),
  timeouts: new Set(),
  intervals: new Set(),
  eventListeners: new Map(), // Map of element -> [{type, handler}, ...]
  cleanupCallbacks: new Set(),

  // Track a MutationObserver
  trackObserver: function(observer) {
    this.observers.add(observer);
    return observer;
  },

  // Track a timeout
  trackTimeout: function(timeoutId) {
    this.timeouts.add(timeoutId);
    return timeoutId;
  },

  // Track an interval
  trackInterval: function(intervalId) {
    this.intervals.add(intervalId);
    return intervalId;
  },

  // Track an event listener
  trackEventListener: function(element, eventType, handler) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ type: eventType, handler });
  },

  // Add a cleanup callback
  addCleanupCallback: function(callback) {
    this.cleanupCallbacks.add(callback);
  },

  // Clean up all resources
  cleanup: function() {
    console.log('CreativityGuard: Starting comprehensive cleanup...', {
      observers: this.observers.size,
      timeouts: this.timeouts.size,
      intervals: this.intervals.size,
      eventListeners: this.eventListeners.size,
      cleanupCallbacks: this.cleanupCallbacks.size
    });

    // Disconnect all MutationObservers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        console.warn('Error disconnecting observer:', e);
      }
    });
    this.observers.clear();

    // Clear all timeouts
    this.timeouts.forEach(timeoutId => {
      try {
        clearTimeout(timeoutId);
      } catch (e) {
        console.warn('Error clearing timeout:', e);
      }
    });
    this.timeouts.clear();

    // Clear all intervals
    this.intervals.forEach(intervalId => {
      try {
        clearInterval(intervalId);
      } catch (e) {
        console.warn('Error clearing interval:', e);
      }
    });
    this.intervals.clear();

    // Remove all event listeners
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ type, handler }) => {
        try {
          element.removeEventListener(type, handler);
        } catch (e) {
          console.warn('Error removing event listener:', e);
        }
      });
    });
    this.eventListeners.clear();

    // Run custom cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (e) {
        console.warn('Error in cleanup callback:', e);
      }
    });
    this.cleanupCallbacks.clear();

    // Remove any extension-created DOM elements
    try {
      const extensionElements = [
        '#creativity-guard-reminder',
        '#creativity-guard-styles', 
        '#social-media-modal',
        '#social-media-modal-styles'
      ];
      
      extensionElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.remove();
        }
      });

      // Also remove early blocker if it exists
      const earlyBlocker = document.getElementById('creativity-guard-early-blocker');
      if (earlyBlocker) {
        earlyBlocker.remove();
      }
    } catch (e) {
      console.warn('Error removing extension DOM elements:', e);
    }

    console.log('CreativityGuard: Cleanup completed');
  }
};

// Set up global cleanup handlers
// Note: 'unload' event is deprecated and causes permissions policy violations
// Using 'beforeunload' and 'pagehide' for cleanup instead
window.addEventListener('beforeunload', () => CreativityGuardCleanup.cleanup());
window.addEventListener('pagehide', () => CreativityGuardCleanup.cleanup());

// Make cleanup accessible globally for debugging
window.CreativityGuardCleanup = CreativityGuardCleanup;

// Suggestions for pre-work before using AI
const suggestions = [
  "Sketch a rough outline on a piece of paper.",
  "Open a blank document and list three bullet points of your own ideas.",
  "Record a quick voice memo with your first thoughts.",
  "Draw a quick mindmap of related concepts.",
  "Write down the problem you're trying to solve in your own words."
];

// Stats tracking with default values
let stats = {
  aiUsageCount: 0,
  bypassCount: 0,
  thoughtFirstCount: 0
};


// Enhanced wrapper for chrome.storage operations with context validation and fallback
const storage = {
  // Check if extension context is still valid
  isContextValid: function() {
    try {
      // Check if chrome.runtime exists and has an id
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  },

  // Log context invalidation once
  contextInvalidLogged: false,

  // Fallback to sessionStorage when context is invalid
  fallbackGet: function(key) {
    try {
      const stored = sessionStorage.getItem('creativityGuard_' + key);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  fallbackSet: function(key, value) {
    try {
      sessionStorage.setItem('creativityGuard_' + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  get: function(key, callback) {
    try {
      // Check if context is valid before attempting storage access
      if (!this.isContextValid()) {
        if (!this.contextInvalidLogged) {
          console.log('CreativityGuard: Using temporary storage (extension was updated/reloaded)');
          this.contextInvalidLogged = true;
        }
        // Use fallback storage
        const fallbackValue = this.fallbackGet(key);
        if (callback) callback(fallbackValue);
        return;
      }

      chrome.storage.local.get([key], function(result) {
        if (chrome.runtime.lastError) {
          // Check if it's a context invalidation error
          if (chrome.runtime.lastError.message &&
              chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            if (!storage.contextInvalidLogged) {
              console.log('CreativityGuard: Using temporary storage (extension was updated/reloaded)');
              storage.contextInvalidLogged = true;
            }
            // Try fallback storage
            const fallbackValue = storage.fallbackGet(key);
            if (callback) callback(fallbackValue);
          } else {
            console.error('Storage get error:', chrome.runtime.lastError);
            if (callback) callback(null);
          }
          return;
        }
        // Success - also save to fallback for potential future use
        if (result[key] !== undefined) {
          storage.fallbackSet(key, result[key]);
        }
        if (callback) callback(result[key]);
      });
    } catch (e) {
      // Check if it's an extension context error
      if (e.message && e.message.includes('Extension context invalidated')) {
        if (!this.contextInvalidLogged) {
          console.warn('CreativityGuard: Extension context lost. Using temporary storage.');
          this.contextInvalidLogged = true;
        }
        // Use fallback storage
        const fallbackValue = this.fallbackGet(key);
        if (callback) callback(fallbackValue);
      } else {
        console.error('Error calling storage get:', e);
        if (callback) callback(null);
      }
    }
  },

  set: function(key, value, callback) {
    try {
      // Always try to save to fallback storage first
      this.fallbackSet(key, value);

      // Check if context is valid before attempting storage access
      if (!this.isContextValid()) {
        if (!this.contextInvalidLogged) {
          console.warn('CreativityGuard: Cannot save to extension storage - context invalidated. Data saved temporarily. Please refresh the page.');
          this.contextInvalidLogged = true;
        }
        if (callback) callback(true); // Return true since we saved to fallback
        return;
      }

      const data = {};
      data[key] = value;

      chrome.storage.local.set(data, function() {
        if (chrome.runtime.lastError) {
          // Check if it's a context invalidation error
          if (chrome.runtime.lastError.message &&
              chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            if (!storage.contextInvalidLogged) {
              console.warn('CreativityGuard: Extension was updated or reloaded. Data saved temporarily.');
              storage.contextInvalidLogged = true;
            }
            // We already saved to fallback, so return true
            if (callback) callback(true);
          } else {
            console.error('Storage set error:', chrome.runtime.lastError);
            // Still return true if we saved to fallback
            if (callback) callback(storage.fallbackSet(key, value));
          }
          return;
        }
        if (callback) callback(true);
      });
    } catch (e) {
      // Check if it's an extension context error
      if (e.message && e.message.includes('Extension context invalidated')) {
        if (!this.contextInvalidLogged) {
          console.warn('CreativityGuard: Cannot save to extension storage - context lost. Data saved temporarily.');
          this.contextInvalidLogged = true;
        }
        // Return true if we saved to fallback
        if (callback) callback(this.fallbackSet(key, value));
      } else {
        console.error('Storage set error:', e);
        if (callback) callback(false);
      }
    }
  }
};

// URL validation utility function
function validateAndSanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    console.warn('Invalid URL provided:', url);
    return 'https://weeatrobots.substack.com'; // Safe default
  }
  
  try {
    const trimmedUrl = url.trim();
    
    // Check for obviously malicious patterns
    if (trimmedUrl.includes('javascript:') || 
        trimmedUrl.includes('data:') || 
        trimmedUrl.includes('vbscript:') ||
        trimmedUrl.includes('file:')) {
      console.warn('Potentially malicious URL blocked:', trimmedUrl);
      return 'https://weeatrobots.substack.com';
    }
    
    // Add protocol if missing
    let normalizedUrl = trimmedUrl;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Validate URL format
    const urlObj = new URL(normalizedUrl);
    
    // Only allow HTTP and HTTPS protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      console.warn('Non-HTTP(S) protocol blocked:', urlObj.protocol);
      return 'https://weeatrobots.substack.com';
    }
    
    // Optional: Whitelist of allowed domains (can be extended)
    const allowedDomains = [
      'read.readwise.io',
      'readwise.io',
      'google.com',
      'wikipedia.org',
      'github.com',
      'stackoverflow.com',
      'medium.com',
      'news.ycombinator.com'
    ];
    
    // For now, we'll allow any HTTPS domain but log potentially suspicious ones
    const hostname = urlObj.hostname.toLowerCase();
    if (!allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      console.info('Redirecting to non-whitelisted domain:', hostname);
      // Still allow it, but log it for monitoring
    }
    
    return normalizedUrl;
  } catch (e) {
    console.error('URL validation failed:', e.message, 'for URL:', url);
    return 'https://read.readwise.io'; // Safe fallback
  }
}

// Load saved stats with retry mechanism
function loadStats() {
  storage.get('creativityGuardStats', function(savedStats) {
    if (savedStats) {
      stats = savedStats;
    }
  });
}

// Save stats with retry mechanism
function saveStats() {
  storage.set('creativityGuardStats', stats);
}

// Initialize stats
loadStats();

// Sites configuration cache
let sitesConfig = null;

// Load sites configuration from sites.json
async function loadSitesConfig() {
  if (sitesConfig) {
    return sitesConfig;
  }

  try {
    const response = await fetch(chrome.runtime.getURL('sites.json'));
    if (!response.ok) {
      throw new Error(`Failed to load sites.json: ${response.status}`);
    }
    sitesConfig = await response.json();
    console.log('[Creativity Guard] Loaded sites configuration:', sitesConfig);
    return sitesConfig;
  } catch (error) {
    console.error('[Creativity Guard] Error loading sites.json:', error);
    // Return default configuration if loading fails
    sitesConfig = {
      aiSites: { enabled: false, sites: [] },
      socialMediaSites: { enabled: true, sites: [] },
      newsSites: { enabled: false, sites: [] },
      customSites: { enabled: false, sites: [] },
      settings: {
        allowedAfterHour: 15,
        allowedEndHour: 19,
        redirectUrl: 'https://weeatrobots.substack.com',
        vacationMode: false,
        totalWeekendBlock: false
      }
    };
    return sitesConfig;
  }
}

// Check if a hostname matches any site in a sites array
function isHostnameInSites(hostname, sites) {
  return sites.some(site => {
    const domain = site.domain || site;
    return hostname === domain || hostname.endsWith('.' + domain) || hostname.includes(domain);
  });
}

// Check if current site should be blocked based on sites.json configuration
async function shouldBlockCurrentSite() {
  const config = await loadSitesConfig();
  const hostname = window.location.hostname;

  // Check social media sites
  if (config.socialMediaSites.enabled && config.socialMediaSites.sites) {
    const enabledSocialSites = config.socialMediaSites.sites.filter(site => site.enabled !== false);
    if (isHostnameInSites(hostname, enabledSocialSites)) {
      return { shouldBlock: true, type: 'social', config: config.socialMediaSites };
    }
  }

  // Check news sites
  if (config.newsSites.enabled && config.newsSites.sites) {
    if (isHostnameInSites(hostname, config.newsSites.sites)) {
      return { shouldBlock: true, type: 'news', config: config.newsSites };
    }
  }

  // Check custom sites
  if (config.customSites.enabled && config.customSites.sites) {
    if (isHostnameInSites(hostname, config.customSites.sites)) {
      return { shouldBlock: true, type: 'custom', config: config.customSites };
    }
  }

  return { shouldBlock: false, type: null };
}

// Check if current site is an AI site and if AI Think First is enabled
async function isAISiteWithThinkFirstEnabled() {
  const config = await loadSitesConfig();
  const hostname = window.location.hostname;

  if (!config.aiSites.enabled || !config.aiSites.sites) {
    return false;
  }

  return isHostnameInSites(hostname, config.aiSites.sites);
}

// Get a random suggestion
function getRandomSuggestion() {
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// Site-specific handlers for AI platforms
const siteHandlers = {
  // Combined handler for both ChatGPT domains
  'chat.openai.com': {
    setupReminder: function(inputElement, host) {
      console.log('ChatGPT: Setting up reminder with Claude-like approach');
      
      // Style the host element to look good in ChatGPT
      host.style.margin = '15px auto';
      host.style.maxWidth = '800px';
      host.style.borderRadius = '8px';
      host.style.padding = '10px 15px';
      host.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
      host.style.backgroundColor = 'rgba(247, 247, 248, 0.9)';
      host.style.zIndex = '1000';
      
      // Place it at the top of the main content area
      const targets = [
        document.querySelector('main'),
        document.querySelector('#__next'),
        document.querySelector('body')
      ];
      
      for (const target of targets) {
        if (target) {
          console.log('ChatGPT: Inserting reminder into', target.tagName);
          target.insertBefore(host, target.firstChild);
          return true;
        }
      }
      
      // Absolute last resort
      document.body.insertBefore(host, document.body.firstChild);
      return true;
    },
    
    getInputElement: function() {
      return document.querySelector('textarea') || document.querySelector('form');
    },
    
    monitorInput: function(callback) {
      console.log('ChatGPT: Triggering reminder immediately');
      CreativityGuardCleanup.trackTimeout(setTimeout(callback, 1000));
    }
  },
  'claude.ai': {
    setupReminder: function(inputElement, host) {
      console.log('Claude: Setting up reminder...');
      const container = document.querySelector('.cl-text-container') || 
                        document.querySelector('.text-container') || 
                        document.querySelector('main') || 
                        document.body;
                        
      console.log('Claude: Container found:', container);
      
      // Make sure we have a valid container
      if (container) {
        const wrapper = document.createElement('div');
        wrapper.style.padding = '10px';
        wrapper.style.margin = '10px 0';
        wrapper.style.backgroundColor = 'rgba(247, 247, 248, 0.9)';
        wrapper.style.borderRadius = '8px';
        wrapper.style.border = '1px solid #e5e5e5';
        wrapper.style.maxWidth = '100%';
        wrapper.appendChild(host);
        
        container.insertBefore(wrapper, container.firstChild);
        console.log('Claude: Reminder inserted successfully');
        return true;
      }
      
      document.body.insertBefore(host, document.body.firstChild);
      console.log('Claude: Used fallback insertion');
      return true;
    },
    
    getInputElement: function() {
      console.log('Claude: Finding input element');
      
      // Try multiple possible selectors for Claude
      const selectors = [
        '[contenteditable="true"]',
        '.cl-input',
        '.text-area',
        'textarea',
        '.cl-text-container div[data-slate-editor="true"]'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          // Skip hidden elements or elements with zero width/height
          if (el.offsetWidth > 0 && el.offsetHeight > 0 && 
              window.getComputedStyle(el).display !== 'none' &&
              window.getComputedStyle(el).visibility !== 'hidden') {
            console.log(`Claude: Found input element using selector: ${selector}`);
            return el;
          }
        }
      }
      
      console.log('Claude: No input element found');
      return null;
    },
    
    monitorInput: function(callback) {
      console.log('Claude: Setting up input monitoring');
      
      // Try to get the input immediately
      const input = this.getInputElement();
      if (input) {
        console.log('Claude: Setting up input listeners');
        this.setupListeners(input, callback);
      } else {
        console.log('Claude: Input not found, will retry');
      }
      
      // Also set up URL monitoring for new conversations
      const urlObserver = new MutationObserver(() => {
        // Find a new input element after URL/DOM changes
        const newInput = this.getInputElement();
        if (newInput && !newInput.hasAttribute('creativity-guard-monitored')) {
          this.setupListeners(newInput, callback);
        }
      });
      
      // Track the observer for cleanup
      CreativityGuardCleanup.trackObserver(urlObserver);
      
      urlObserver.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true
      });
      
      // Call the callback to show the reminder immediately for new chat
      CreativityGuardCleanup.trackTimeout(setTimeout(callback, 500));
    },
    
    setupListeners: function(element, callback) {
      if (!element || element.hasAttribute('creativity-guard-monitored')) {
        return;
      }
      
      element.setAttribute('creativity-guard-monitored', 'true');
      console.log('Claude: Added event listeners to input');
      
      // Add event listeners for various interactions
      ['focus', 'click', 'input', 'keydown'].forEach(eventType => {
        element.addEventListener(eventType, callback);
        // Track the event listener for cleanup
        CreativityGuardCleanup.trackEventListener(element, eventType, callback);
      });
    }
  },
  'typingmind.com': {
    setupReminder: function(inputElement, host) {
      console.log('TypingMind: Setting up reminder with Claude-like approach');
      
      // Style the host element to look good in TypingMind
      host.style.margin = '15px auto';
      host.style.maxWidth = '800px';
      host.style.borderRadius = '8px';
      host.style.padding = '10px 15px';
      host.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
      host.style.backgroundColor = 'rgba(247, 247, 248, 0.9)';
      host.style.zIndex = '1000';
      
      // Place it at the top of the main content area
      const targets = [
        document.querySelector('.chat-box'),
        document.querySelector('.chatbox'),
        document.querySelector('main'),
        document.querySelector('body')
      ];
      
      for (const target of targets) {
        if (target) {
          console.log('TypingMind: Inserting reminder into', target.tagName || target.className);
          target.insertBefore(host, target.firstChild);
          return true;
        }
      }
      
      // Absolute last resort
      document.body.insertBefore(host, document.body.firstChild);
      return true;
    },
    
    getInputElement: function() {
      // This is much simpler - we're not actually using this for triggering
      // but we need to return something for compatibility
      return document.querySelector('.cm-content') || document.querySelector('textarea');
    },
    
    monitorInput: function(callback) {
      // Skip all the complex event handling - just call the callback immediately
      // to show the reminder as soon as the page loads
      console.log('TypingMind: Triggering reminder immediately');
      CreativityGuardCleanup.trackTimeout(setTimeout(callback, 1000));
    }
  }
};

// Set chatgpt.com to use the same handler as chat.openai.com
siteHandlers['chatgpt.com'] = siteHandlers['chat.openai.com'];

// Create and show the reminder
function showReflectionModal() {
  try {
    console.log('Creating reflection modal...');
    
    // Check if reminder already exists
    if (document.getElementById('creativity-guard-reminder')) {
      console.log('Reminder already exists, skipping creation');
      return;
    }
    
    // Get the input element for the current site
    const currentSite = Object.keys(siteHandlers).find(site => window.location.hostname.includes(site));
    console.log('Current site detected:', currentSite);
    
    const handler = currentSite ? siteHandlers[currentSite] : null;
    
    if (!handler) {
      console.log('No handler found for current site');
      return;
    }
    
    const inputElement = handler.getInputElement();
    if (!inputElement) {
      console.log('No input element found');
      return;
    }
    
    // Add styles to the document if they don't exist
    if (!document.getElementById('creativity-guard-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'creativity-guard-styles';
      styleSheet.textContent = `
        #creativity-guard-reminder {
          position: relative;
          width: 100%;
          margin-bottom: 16px;
          z-index: 1000;
          opacity: 0;
          transform: translateY(-10px);
          animation: fadeInSlideDown 0.5s ease-out forwards;
        }
        
        @keyframes fadeInSlideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOutSlideUp {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
        }
        
        #creativity-guard-reminder .reminder {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }
        
        #creativity-guard-reminder .reminder::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #10b981, #f59e0b);
        }
        
        #creativity-guard-reminder .reminder-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        #creativity-guard-reminder .reminder-title {
          font-weight: 700;
          font-size: 18px;
          color: #1f2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        #creativity-guard-reminder .reminder-title::before {
          content: '🤔';
          font-size: 20px;
        }
        
        #creativity-guard-reminder .close-button {
          background: rgba(107, 114, 128, 0.1);
          border: none;
          cursor: pointer;
          color: #6b7280;
          font-size: 18px;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        #creativity-guard-reminder .close-button:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          transform: scale(1.1);
        }
        
        #creativity-guard-reminder .close-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        #creativity-guard-reminder .reminder-content {
          margin-bottom: 20px;
        }
        
        #creativity-guard-reminder .reminder-content p {
          margin: 0 0 12px 0;
          color: #374151;
          line-height: 1.5;
          font-size: 15px;
        }
        
        #creativity-guard-reminder .suggestion {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          padding: 16px;
          border-radius: 12px;
          border-left: 4px solid #10b981;
          font-style: italic;
          color: #4b5563;
          margin: 16px 0;
          font-size: 14px;
          position: relative;
        }
        
        #creativity-guard-reminder .suggestion::before {
          content: '💡';
          position: absolute;
          top: 12px;
          right: 16px;
          font-size: 18px;
        }
        
        #creativity-guard-reminder .buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        #creativity-guard-reminder button {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 120px;
          justify-content: center;
        }
        
        #creativity-guard-reminder button:focus {
          outline: 3px solid rgba(59, 130, 246, 0.5);
          outline-offset: 2px;
        }
        
        #creativity-guard-reminder #proceed {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        #creativity-guard-reminder #proceed:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        
        #creativity-guard-reminder #proceed::before {
          content: '✓';
        }
        
        #creativity-guard-reminder #skip {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          color: #374151;
          border: 2px solid #d1d5db;
        }
        
        #creativity-guard-reminder #skip:hover {
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          transform: translateY(-1px);
          border-color: #9ca3af;
        }
        
        #creativity-guard-reminder #skip::before {
          content: '⏭️';
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
          #creativity-guard-reminder .reminder {
            padding: 20px;
            border-radius: 12px;
          }
          
          #creativity-guard-reminder .buttons {
            flex-direction: column;
          }
          
          #creativity-guard-reminder button {
            width: 100%;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }
    
    // Create reminder container
    const host = document.createElement('div');
    host.id = 'creativity-guard-reminder';
    
    const reminder = document.createElement('div');
    reminder.className = 'reminder';
    
    // Create header with title and close button
    const header = document.createElement('div');
    header.className = 'reminder-header';
    
    const title = document.createElement('p');
    title.className = 'reminder-title';
    title.textContent = 'Wait a Moment';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '✕';
    closeButton.setAttribute('aria-label', 'Close reminder');
    closeButton.setAttribute('title', 'Close reminder (Esc)');
    const closeHandler = () => {
      // Animate out before removing
      host.style.animation = 'fadeOutSlideUp 0.3s ease-in forwards';
      setTimeout(() => {
        stats.bypassCount++;
        saveStats();
        host.remove();
      }, 300);
    };
    closeButton.addEventListener('click', closeHandler);
    CreativityGuardCleanup.trackEventListener(closeButton, 'click', closeHandler);
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create content
    const content = document.createElement('div');
    content.className = 'reminder-content';
    
    const message = document.createElement('p');
    message.textContent = 'Have you spent two minutes brainstorming your own ideas first?';
    message.style.margin = '0 0 5px 0';
    
    const suggestion = document.createElement('p');
    suggestion.className = 'suggestion';
    suggestion.textContent = getRandomSuggestion();
    
    content.appendChild(message);
    content.appendChild(suggestion);
    
    // Create buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons';
    
    const proceedButton = document.createElement('button');
    proceedButton.id = 'proceed';
    proceedButton.textContent = 'I did my own thinking';
    proceedButton.setAttribute('aria-label', 'Confirm you thought first before using AI');
    proceedButton.setAttribute('title', 'I took time to think first (Enter)');
    const proceedHandler = () => {
      // Animate out before removing
      host.style.animation = 'fadeOutSlideUp 0.3s ease-in forwards';
      setTimeout(() => {
        stats.thoughtFirstCount++;
        saveStats();
        host.remove();
      }, 300);
    };
    proceedButton.addEventListener('click', proceedHandler);
    CreativityGuardCleanup.trackEventListener(proceedButton, 'click', proceedHandler);
    
    const skipButton = document.createElement('button');
    skipButton.id = 'skip';
    skipButton.textContent = 'Skip';
    skipButton.setAttribute('aria-label', 'Skip thinking and proceed to AI');
    skipButton.setAttribute('title', 'Skip this reminder');
    const skipHandler = () => {
      // Animate out before removing
      host.style.animation = 'fadeOutSlideUp 0.3s ease-in forwards';
      setTimeout(() => {
        stats.bypassCount++;
        saveStats();
        host.remove();
      }, 300);
    };
    skipButton.addEventListener('click', skipHandler);
    CreativityGuardCleanup.trackEventListener(skipButton, 'click', skipHandler);
    
    // Add keyboard navigation to the modal
    const keyboardHandler = (e) => {
      switch(e.key) {
        case 'Escape':
          e.preventDefault();
          closeHandler();
          break;
        case 'Enter':
          if (document.activeElement === skipButton) {
            e.preventDefault();
            skipHandler();
          } else {
            e.preventDefault();
            proceedHandler();
          }
          break;
        case 'Tab':
          // Allow natural tab navigation, but focus management
          const focusableElements = [closeButton, proceedButton, skipButton];
          const currentIndex = focusableElements.indexOf(document.activeElement);
          
          if (e.shiftKey && currentIndex === 0) {
            e.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
          } else if (!e.shiftKey && currentIndex === focusableElements.length - 1) {
            e.preventDefault();
            focusableElements[0].focus();
          }
          break;
      }
    };
    
    // Add keyboard handler to modal
    host.addEventListener('keydown', keyboardHandler);
    CreativityGuardCleanup.trackEventListener(host, 'keydown', keyboardHandler);
    
    // Set modal attributes for accessibility
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'reminder-title');
    host.setAttribute('aria-describedby', 'reminder-content');
    host.setAttribute('tabindex', '-1');
    
    title.id = 'reminder-title';
    content.id = 'reminder-content';
    
    buttonsContainer.appendChild(proceedButton);
    buttonsContainer.appendChild(skipButton);
    
    // Add everything to the reminder
    reminder.appendChild(header);
    reminder.appendChild(content);
    reminder.appendChild(buttonsContainer);
    host.appendChild(reminder);
    
    // Use site-specific handler to set up the reminder
    console.log('Setting up reminder with handler for:', currentSite);
    const setupSuccess = handler.setupReminder(inputElement, host);
    
    if (!setupSuccess) {
      // Fallback to default insertion
      console.log('Using fallback insertion method');
      if (inputElement && inputElement.parentElement) {
        inputElement.parentElement.insertBefore(host, inputElement);
      } else {
        // Safe fallback if inputElement or parentElement is null
        document.body.appendChild(host);
      }
    }
    
    // Focus management for accessibility
    setTimeout(() => {
      proceedButton.focus();
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.textContent = 'Creativity reminder appeared. Please consider thinking first before using AI.';
      if (document.body) {
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 2000);
      }
    }, 100);
    
    // Increment AI usage attempt counter
    stats.aiUsageCount++;
    saveStats();
    
    console.log('Reflection modal created successfully');
  } catch (e) {
    console.error('Error showing reminder:', e);
  }
}

// Initialize for AI sites
(async function initializeAISiteHandlers() {
  try {
    console.log('Initializing AI site handlers...');

    // Check if AI Think First feature is enabled before initializing
    const isAIEnabled = await isAISiteWithThinkFirstEnabled();
    if (!isAIEnabled) {
      console.log('AI Think First feature disabled, skipping AI site initialization');
      return;
    }
    
    // Function to start initialization
    const startInit = () => {
      // Log all supported sites
      console.log('Supported sites:', Object.keys(siteHandlers));
      
      // Get the current hostname
      const currentHostname = window.location.hostname;
      console.log('Current hostname:', currentHostname);
      
      // Determine which site we're on - trying exact match first
      let currentSite = Object.keys(siteHandlers).find(site => currentHostname === site);
      
      // If exact match failed, try includes
      if (!currentSite) {
        currentSite = Object.keys(siteHandlers).find(site => currentHostname.includes(site));
      }
      
      console.log('Detected site:', currentSite);
      
      if (!currentSite) {
        console.log('Not on a supported AI site');
        return;
      }
      
      console.log(`Initializing for ${currentSite}`);
      const handler = siteHandlers[currentSite];
      
      // Function to get current chat ID
      function getCurrentChatId() {
        try {
          // For ChatGPT, use the conversation ID from URL
          if (currentSite === 'chat.openai.com' || currentSite === 'chatgpt.com') {
            try {
              // Handle chat ID format: /c/{id}
              const chatMatch = window.location.pathname.match(/\/c\/([\w-]+)/);
              if (chatMatch) {
                return chatMatch[1];
              }
              
              // Handle model parameter format: /?model={model}
              const modelMatch = new URLSearchParams(window.location.search).get('model');
              if (modelMatch) {
                return `model-${modelMatch}`;
              }
              
              // Fallback to pathname
              return window.location.pathname || 'home';
            } catch (e) {
              console.error('Error parsing ChatGPT URL:', e);
              return 'url-parse-error';
            }
          }
          
          // For Claude, handle /new path and conversation IDs
          if (currentSite === 'claude.ai') {
            try {
              if (window.location.pathname === '/new' || window.location.pathname === '/') {
                return 'new-conversation';
              }
              const claudeMatch = window.location.pathname.match(/\/chat\/([\w-]+)/);
              if (claudeMatch) {
                return claudeMatch[1];
              }
            } catch (e) {
              console.error('Error parsing Claude URL:', e);
              return 'url-parse-error';
            }
          }
          
          // For other platforms, use the full pathname as the ID
          try {
            return window.location.pathname || 'unknown-path';
          } catch (e) {
            console.error('Error accessing pathname:', e);
            return 'pathname-access-error';
          }
        } catch (e) {
          console.error('Error getting chat ID:', e);
          return window.location.pathname;
        }
      }
      
      // Function to check if this is a new conversation by examining URL and page elements
      function isNewConversation() {
        try {
          const currentPath = window.location.pathname || '/';
          const currentUrl = window.location.href || window.location.toString();
          
          // Skip non-chat pages (settings, projects, etc.)
          if (currentPath.includes('/settings') || 
              currentPath.includes('/project') || 
              currentPath.includes('/account') ||
              currentPath.includes('/workspace') ||
              currentPath.includes('/u/') ||
              currentPath.includes('/billing') ||
              currentPath.includes('/profile')) {
            console.log('Skipping non-chat page:', currentPath);
            return false;
          }
          
          // For ChatGPT
          if (currentSite === 'chat.openai.com' || currentSite === 'chatgpt.com') {
            // Check if we're at the root or new chat page
            if (currentPath === '/' && !currentUrl.includes('?model=')) {
              // Root without model param is usually the landing page
              return false;
            }
            
            // New conversation URLs
            if (currentPath === '/') {
              return true;
            }
            
            // New GPT-specific conversation
            if (currentPath.startsWith('/g/') && !currentPath.includes('/c/')) {
              return true;
            }
            
            // Regular conversations have /c/{id} pattern - these are not new
            if (currentPath.includes('/c/')) {
              return false;
            }
            
            return false;
          }
          
          // For Claude
          if (currentSite === 'claude.ai') {
            // Only show on actual new chat page
            if (currentPath === '/new') {
              return true;
            }
            
            // On home page, only show when there's a clear input element ready
            if (currentPath === '/') {
              const input = handler.getInputElement();
              if (input && input.offsetHeight > 0 && input.offsetWidth > 0) {
                return true;
              }
            }
            
            // Skip all other Claude pages
            return false;
          }
          
          // For TypingMind and others
          if (currentSite === 'typingmind.com') {
            // Only show on the new chat page
            if (currentPath === '/chat/new') {
              return true;
            }
            return false;
          }
          
          return false;
        } catch (e) {
          console.error('Error checking for new conversation:', e);
          // Return false as safe default when URL parsing fails
          return false;
        }
      }
      
      // Keep track of which chats we've shown the reminder in during this session
      let shownInChatsForSession = new Set();
      
      // Load previously shown chats from storage
      function loadShownChats(callback) {
        storage.get('shownReminderChats', function(result) {
          const shownChats = result || {};
          callback(shownChats);
        });
      }
      
      // Save shown chat to storage
      function saveShownChat(chatId) {
        loadShownChats((shownChats) => {
          // Add the current chat with a timestamp
          shownChats[chatId] = Date.now();
          
          // Remove chats older than 24 hours
          const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
          Object.keys(shownChats).forEach(id => {
            if (shownChats[id] < oneDayAgo) {
              delete shownChats[id];
            }
          });
          
          // Save back to storage
          storage.set('shownReminderChats', shownChats);
        });
      }
      
      // Function to handle potential AI interaction
      function handleAIInteraction(event) {
        try {
          // Check if extension context is still valid
          if (!storage.isContextValid()) {
            // Silently fail - extension was updated/reloaded
            return;
          }

          console.log(`AI interaction detected from ${event?.type || 'unknown'} event`);
          const chatId = getCurrentChatId();
          console.log(`Current chat ID: ${chatId}`);

          // Skip if already shown in this session
          if (shownInChatsForSession.has(chatId)) {
            console.log(`Already shown reminder for chat in this session: ${chatId}`);
            return;
          }

          // Check storage to see if we've shown this chat recently
          loadShownChats((shownChats) => {
            if (shownChats[chatId]) {
              console.log(`Already shown reminder for chat in storage: ${chatId}`);
              return;
            }
            
            // Check if this is a new conversation
            if (isNewConversation()) {
              // Check if AI Think First feature is enabled before showing modal
              isAISiteWithThinkFirstEnabled().then(isEnabled => {
                if (isEnabled) {
                  console.log(`Showing reminder for new conversation: ${chatId}`);
                  showReflectionModal();

                  // Mark as shown in both session and storage
                  shownInChatsForSession.add(chatId);
                  saveShownChat(chatId);

                  // Save updated stats to storage
                  storage.get('creativityGuardStats', function(result) {
                    const updatedStats = result ? result : { ...stats };
                    updatedStats.aiUsageCount++;
                    storage.set('creativityGuardStats', updatedStats);
                    stats = updatedStats;
                  });
                } else {
                  console.log(`AI Think First disabled, skipping reminder for: ${chatId}`);
                }
              }).catch(error => {
                console.error('[Creativity Guard] Error checking AI Think First setting:', error);
                // Default to showing modal if there's an error
                console.log(`Showing reminder for new conversation (fallback): ${chatId}`);
                showReflectionModal();

                // Mark as shown in both session and storage
                shownInChatsForSession.add(chatId);
                saveShownChat(chatId);

                // Save updated stats to storage
                storage.get('creativityGuardStats', function(result) {
                  const updatedStats = result ? result : { ...stats };
                  updatedStats.aiUsageCount++;
                  storage.set('creativityGuardStats', updatedStats);
                  stats = updatedStats;
                });
              });
            } else {
              console.log(`Not showing reminder for existing conversation: ${chatId}`);
            }
          });
        } catch (e) {
          console.error('Error handling AI interaction:', e);
        }
      }
      
      // Set up input monitoring
      console.log('Setting up input monitoring...');
      handler.monitorInput(handleAIInteraction);
      
      // Monitor URL changes for new conversations in SPA
      let lastUrl = window.location.href;
      const urlObserver = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (lastUrl !== currentUrl) {
          console.log(`URL changed from ${lastUrl} to ${currentUrl}`);
          lastUrl = currentUrl;
          
          // Only check if it's a new conversation, don't trigger on every URL change
          CreativityGuardCleanup.trackTimeout(setTimeout(() => {
            if (isNewConversation()) {
              console.log('URL change detected to a new conversation page');
              handleAIInteraction({ type: 'url-change' });
            } else {
              console.log('URL change detected but not a new conversation');
            }
          }, 500));
        }
      });
      
      // Track the observer for cleanup
      CreativityGuardCleanup.trackObserver(urlObserver);
      urlObserver.observe(document.body, { subtree: true, childList: true });
      
      // Check once after initialization with a more specific delay
      CreativityGuardCleanup.trackTimeout(setTimeout(() => {
        // Only show if it's actually a new conversation
        if (isNewConversation()) {
          console.log('Initial check: Found new conversation');
          handleAIInteraction({ type: 'init' });
        } else {
          console.log('Initial check: Not a new conversation');
        }
        
        // Only do retries on specific paths that are likely to be new conversations
        const currentPath = window.location.pathname;
        if ((currentSite === 'claude.ai' && (currentPath === '/new' || currentPath === '/')) ||
            ((currentSite === 'chat.openai.com' || currentSite === 'chatgpt.com') && currentPath === '/') ||
            (currentSite === 'typingmind.com' && currentPath === '/chat/new')) {
            
          console.log('Setting up retries for new conversation page');
          const retryTimes = [2000, 4000];
          retryTimes.forEach(delay => {
            CreativityGuardCleanup.trackTimeout(setTimeout(() => {
              if (!shownInChatsForSession.has(getCurrentChatId()) && isNewConversation()) {
                console.log(`Retry ${delay}ms: Checking for new conversation`);
                handleAIInteraction({ type: 'retry' });
              }
            }, delay));
          });
        }
      }, 1500));
      
      console.log(`Creativity Guard fully initialized for ${currentSite}`);
    };
    
    // If document is already loaded, initialize immediately
    if (document.readyState === 'complete') {
      console.log('Document already loaded, initializing immediately');
      startInit();
    } else {
      // Otherwise wait for load event
      console.log('Waiting for window load event');
      window.addEventListener('load', startInit);
      CreativityGuardCleanup.trackEventListener(window, 'load', startInit);
      
      // Also try again after a short delay if the load event doesn't fire
      CreativityGuardCleanup.trackTimeout(setTimeout(() => {
        if (document.readyState === 'complete' && !window.aiSiteHandlersInitialized) {
          console.log('Initializing after delay');
          startInit();
        }
      }, 2000));
    }
    
    // Flag to prevent double initialization
    window.aiSiteHandlersInitialized = true;
  } catch (error) {
    console.error('Error initializing Creativity Guard for AI sites:', error);
  }
})();

// Social media module for LinkedIn, Twitter, and Facebook
const socialMediaModule = {
  // Storage for social media stats and settings
  storage: {
    get: function(key, callback) {
      if (typeof key === 'function') {
        // Old usage: get(callback) - get both storage locations and merge them
        callback = key;
        
        // First try the background.js managed storage (creativityGuardSocialMedia)
        chrome.runtime.sendMessage({ type: 'GET_SOCIAL_MEDIA_SETTINGS' }, (bgSettings) => {
          // Then get the direct storage (socialMediaUsage)
          chrome.storage.local.get(['socialMediaUsage'], (result) => {
            const directSettings = result.socialMediaUsage || {};
            
            // Combine both settings sources, with background.js settings taking precedence
            const combinedSettings = { ...directSettings, ...bgSettings };
            
            console.log('%c[Creativity Guard] Loading combined settings:', 'color: #0a66c2;', {
              directSettings,
              bgSettings,
              combinedSettings
            });
            
            callback(combinedSettings);
          });
        });
      } else {
        // New usage: get(key, callback) - check specific key
        chrome.storage.local.get([key], (result) => {
          callback(result[key]);
        });
      }
    },
    set: function(value, callback) {
      // Save to both storage locations for consistency
      
      // 1. Save to direct storage
      chrome.storage.local.set({ socialMediaUsage: value }, () => {
        // 2. Save to background.js managed storage
        chrome.runtime.sendMessage({ 
          type: 'SET_SOCIAL_MEDIA_SETTINGS', 
          settings: value 
        }, () => {
          if (callback) callback(true);
        });
      });
    }
  },
  
  // Default settings
  defaultSettings: {
    linkedinAllowedHour: 15, // 3 PM
    twitterAllowedHour: 15, // 3 PM
    facebookAllowedHour: 15, // 3 PM
    mediaAllowedHour: 15, // 3 PM for media sites
    allowedEndHour: 19, // 7 PM - end of allowed time window
    enabledForLinkedin: true,
    enabledForTwitter: true,
    enabledForFacebook: true,
    enabledForMedia: true, // Enable blocking for media/news sites
    totalWeekendBlock: true, // Complete block on weekends by default
    vacationModeEnabled: false, // New setting for vacation mode
    redirectUrl: 'https://weeatrobots.substack.com',
    visits: {}, // Will store dates of visits
    usageHistory: [] // Track bypass and disable events with timestamps
  },
  
  // Current settings
  settings: null,
  
  // Session consent tracking (resets when browser is closed)
  sessionConsent: {
    linkedin: false,
    twitter: false,
    facebook: false,
    media: false
  },

  // Initialize session consent from sessionStorage
  initSessionConsent: function() {
    // Try to restore session consent from sessionStorage
    try {
      const storedConsent = sessionStorage.getItem('creativityGuardSessionConsent');
      if (storedConsent) {
        const parsed = JSON.parse(storedConsent);
        // Merge with default values to handle new platforms
        this.sessionConsent = { ...this.sessionConsent, ...parsed };
        console.log('%c[Creativity Guard] Restored session consent:', 'color: #0a66c2;', this.sessionConsent);
      }
    } catch (e) {
      console.error('Error restoring session consent:', e);
    }
  },

  // Save session consent to sessionStorage
  saveSessionConsent: function() {
    try {
      sessionStorage.setItem('creativityGuardSessionConsent', JSON.stringify(this.sessionConsent));
      console.log('%c[Creativity Guard] Saved session consent:', 'color: #0a66c2;', this.sessionConsent);
    } catch (e) {
      console.error('Error saving session consent:', e);
    }
  },
  
  // Initialize the module
  init: function() {
    console.log('%c[Creativity Guard] Social media module initializing...', 'color: #0a66c2; font-weight: bold;');

    // Initialize session consent from sessionStorage
    this.initSessionConsent();

    // Load settings and then handle the site visit after settings are loaded
    this.storage.get(async (settings) => {
      try {
        // Remove early blocker once we have settings
        if (earlyBlockerElement && earlyBlockerElement.parentNode) {
          console.log('%c[Creativity Guard] Removing early blocker', 'color: #0a66c2;');
          // We'll remove it after determining if we need to show the modal
        }

        console.log('%c[Creativity Guard] Loaded settings:', 'color: #0a66c2;', settings);
        
        // If no settings exist yet, initialize with defaults
        if (!settings) {
          console.log('%c[Creativity Guard] No settings found, using defaults', 'color: #0a66c2;', this.defaultSettings);
          settings = { ...this.defaultSettings }; // Use spread to ensure all defaults are copied
          // Save default settings
          this.storage.set(settings);
        } else {
           // Ensure all default keys exist in loaded settings, including new ones like vacationModeEnabled
          settings = { ...this.defaultSettings, ...settings };
           // Ensure visits object exists if settings were loaded but incomplete
           if (!settings.visits) {
             settings.visits = {};
           }
        }

        this.settings = settings;
        
        // Make sure the visits object exists
        if (!this.settings.visits) {
          console.log('%c[Creativity Guard] Initializing visits tracking', 'color: #0a66c2;');
          this.settings.visits = {};
          // Save the initialized visits object
          this.storage.set(this.settings);
        }
        
        console.log('%c[Creativity Guard] Current visits:', 'color: #0a66c2;', this.settings.visits);
        
        // Now that settings are loaded, check if we're on a blocked site
        const hostname = window.location.hostname;

        // Check if we're on a blocked site using sites.json configuration
        try {
          const blockResult = await shouldBlockCurrentSite();

          if (blockResult.shouldBlock) {
            console.log(`%c[Creativity Guard] On ${blockResult.type} site, handling visit`, 'color: #0a66c2;');

            // Determine platform and display name based on site type and hostname
            let platform = blockResult.type;
            let displayName = null;

            if (blockResult.type === 'social') {
              // For social media, determine specific platform
              if (hostname.includes('linkedin.com')) {
                platform = 'linkedin';
                displayName = 'LinkedIn';
              } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
                platform = 'twitter';
                displayName = hostname.includes('x.com') ? 'X (Twitter)' : 'Twitter';
              } else if (hostname.includes('facebook.com')) {
                platform = 'facebook';
                displayName = 'Facebook';
              } else {
                // Generic social media platform
                displayName = 'Social Media';
              }
            } else if (blockResult.type === 'news') {
              platform = 'media';
              // Get specific news site name for display
              if (hostname.includes('theguardian.com')) displayName = 'The Guardian';
              else if (hostname.includes('nytimes.com')) displayName = 'NY Times';
              else if (hostname.includes('washingtonpost.com')) displayName = 'Washington Post';
              else if (hostname.includes('bbc.com')) displayName = 'BBC';
              else if (hostname.includes('cnn.com')) displayName = 'CNN';
              else if (hostname.includes('reddit.com')) displayName = 'Reddit';
              else displayName = 'News Site';
            } else if (blockResult.type === 'custom') {
              platform = 'media'; // Treat custom sites like media sites
              displayName = 'Custom Site';
            }

            await this.handleSocialMediaSite(platform, displayName);
          } else {
            console.log('%c[Creativity Guard] Site not configured for blocking', 'color: #0a66c2;');
          }
        } catch (error) {
          console.error('%c[Creativity Guard] Error checking site blocking configuration:', 'color: #ff0000;', error);
          // Fallback to legacy hardcoded check if sites.json fails
          console.log('%c[Creativity Guard] Falling back to legacy site detection', 'color: #ff9800;');

          // Legacy hardcoded site detection as fallback
          if (hostname.includes('linkedin.com')) {
            console.log('%c[Creativity Guard] On LinkedIn (legacy), handling site visit', 'color: #0a66c2;');
            await this.handleSocialMediaSite('linkedin');
          } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            console.log('%c[Creativity Guard] On Twitter (legacy), handling site visit', 'color: #0a66c2;');
            await this.handleSocialMediaSite('twitter');
          } else if (hostname.includes('facebook.com')) {
            console.log('%c[Creativity Guard] On Facebook (legacy), handling site visit', 'color: #0a66c2;');
            await this.handleSocialMediaSite('facebook');
          } else if (hostname.includes('theguardian.com') ||
                     hostname.includes('nytimes.com') ||
                     hostname.includes('washingtonpost.com') ||
                     hostname.includes('bbc.com') ||
                     hostname.includes('cnn.com') ||
                     hostname.includes('reddit.com')) {
            console.log('%c[Creativity Guard] On media site (legacy), handling visit', 'color: #0a66c2;');
            // Get specific media site name for display
            let mediaName = 'Media';
            if (hostname.includes('theguardian.com')) mediaName = 'The Guardian';
            else if (hostname.includes('nytimes.com')) mediaName = 'NY Times';
            else if (hostname.includes('washingtonpost.com')) mediaName = 'Washington Post';
            else if (hostname.includes('bbc.com')) mediaName = 'BBC';
            else if (hostname.includes('cnn.com')) mediaName = 'CNN';
            else if (hostname.includes('reddit.com')) mediaName = 'Reddit';

            await this.handleSocialMediaSite('media', mediaName);
          }
        }
      } catch (error) {
        console.error('%c[Creativity Guard] Error in init:', 'color: #ff0000;', error);
      }
    });
  },
  
  // Load settings from storage
  loadSettings: function() {
    this.storage.get((settings) => {
      console.log('%c[Creativity Guard] Loaded settings:', 'color: #0a66c2;', settings);
      
      // Ensure we have valid settings
      this.settings = settings || this.defaultSettings;
      
      // Make sure all default values are applied if missing
      this.settings = { ...this.defaultSettings, ...this.settings };
      
      // Make sure the visits object exists
      if (!this.settings.visits) {
        this.settings.visits = {};
      }
      
      // Debug if vacationMode is active
      if (this.settings.vacationModeEnabled) {
        console.log('%c[Creativity Guard] Vacation Mode is ACTIVE in loaded settings', 'color: #ff9800; font-weight: bold;');
      }
    });
  },
  
  // Get today's date as a string (YYYY-MM-DD)
  getTodayString: function() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  },
  
  // Check if current time is allowed for the platform
  isAllowedTime: async function(platform) {
    const now = new Date();
    const hour = now.getHours();

    try {
      // Try to get settings from sites.json first
      const config = await loadSitesConfig();
      const allowedStartHour = config.settings.allowedAfterHour || 15;
      const allowedEndHour = config.settings.allowedEndHour || 19;

      return hour >= allowedStartHour && hour < allowedEndHour;
    } catch (error) {
      console.error('[Creativity Guard] Error loading time settings from sites.json:', error);

      // Fallback to legacy settings
      const allowedStartHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour :
                              platform === 'twitter' ? this.settings.twitterAllowedHour :
                              platform === 'facebook' ? this.settings.facebookAllowedHour :
                              this.settings.mediaAllowedHour; // For media sites

      // Use configurable end hour from settings
      const allowedEndHour = this.settings.allowedEndHour || 19; // Default to 7 PM if not set

      return hour >= allowedStartHour && hour < allowedEndHour;
    }
  },
  
  // Check if already visited today
  hasVisitedToday: function(platform) {
    const todayStr = this.getTodayString();
    return this.settings.visits[platform] && this.settings.visits[platform] === todayStr;
  },
  
  // Record a visit
  recordVisit: function(platform) {
    const todayStr = this.getTodayString();
    console.log(`Recording visit for ${platform} on ${todayStr}`);
    
    // Get current settings and update them
    this.storage.get((currentSettings) => {
      const settings = currentSettings || this.settings || {};
      if (!settings.visits) {
        settings.visits = {};
      }
      settings.visits[platform] = todayStr;
      
      // Save the updated settings
      this.storage.set(settings, (success) => {
        console.log(`Visit recording ${success ? 'succeeded' : 'failed'}`);
        if (success) {
          this.settings = settings;
        } else {
          console.error('Failed to record visit for:', platform);
        }
      });
    });
  },
  
  // Check if it's a weekend (Saturday or Sunday)
  isWeekend: function() {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday, 6 is Saturday
    return day === 0 || day === 6;
  },
  
  // Get usage stats from last 24 hours
  getUsageStats: function() {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    // Clean up old entries and count recent ones
    const recentHistory = (this.settings.usageHistory || []).filter(entry =>
      entry.timestamp > twentyFourHoursAgo
    );

    const bypassCount = recentHistory.filter(entry => entry.action === 'bypass').length;
    const disableCount = recentHistory.filter(entry => entry.action === 'disabled').length;

    return { bypassCount, disableCount };
  },

  // Record a bypass action (legacy - without reason)
  recordBypass: function() {
    this.storage.get((currentSettings) => {
      const settings = currentSettings || this.settings || {};
      if (!settings.usageHistory) {
        settings.usageHistory = [];
      }

      // Add new bypass event
      settings.usageHistory.push({
        timestamp: Date.now(),
        action: 'bypass'
      });

      // Clean up entries older than 24 hours
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      settings.usageHistory = settings.usageHistory.filter(entry =>
        entry.timestamp > twentyFourHoursAgo
      );

      // Save updated settings
      this.storage.set(settings, (success) => {
        if (success) {
          this.settings = settings;
          console.log('Bypass recorded');
        }
      });
    });
  },

  // Record a bypass action with reason and context
  recordBypassWithReason: function(platform, reason, blockType) {
    this.storage.get((currentSettings) => {
      const settings = currentSettings || this.settings || {};
      if (!settings.usageHistory) {
        settings.usageHistory = [];
      }

      // Add new enhanced bypass event
      settings.usageHistory.push({
        timestamp: Date.now(),
        action: 'bypass_with_reason',
        platform: platform,
        reason: reason,
        blockType: blockType,
        countdownCompleted: true
      });

      // Also keep a separate detailed bypass log for better analytics
      if (!settings.bypassReasons) {
        settings.bypassReasons = [];
      }

      settings.bypassReasons.push({
        timestamp: Date.now(),
        date: new Date().toISOString(),
        platform: platform,
        reason: reason,
        blockType: blockType
      });

      // Keep only last 30 days of bypass reasons
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      settings.bypassReasons = settings.bypassReasons.filter(entry =>
        entry.timestamp > thirtyDaysAgo
      );

      // Clean up usage history entries older than 24 hours (for stats display)
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      settings.usageHistory = settings.usageHistory.filter(entry =>
        entry.timestamp > twentyFourHoursAgo
      );

      // Save updated settings
      this.storage.set(settings, (success) => {
        if (success) {
          this.settings = settings;
          console.log('Bypass with reason recorded:', {
            platform,
            blockType,
            reasonLength: reason.length
          });
        }
      });
    });
  },

  // Handle social media site visit
  handleSocialMediaSite: async function(platform, displayName) {
    try {
      console.log(`%c[Creativity Guard] Handling ${platform} visit`, 'color: #0a66c2;');

      // --- Vacation Mode Check ---
      if (this.settings.vacationModeEnabled) {
        console.log('%c[Creativity Guard] Vacation Mode is active, showing restriction modal', 'color: #ff9800;');
        // Keep early blocker visible until modal is ready
        this.showSocialMediaModal(platform, true, displayName); // Pass displayName
        return; // Skip further checks if vacation mode is on
      }
      // --- End Vacation Mode Check ---

      // Check if the feature is enabled for this platform
      const isEnabled = platform === 'linkedin' ? this.settings.enabledForLinkedin :
                       platform === 'twitter' ? this.settings.enabledForTwitter :
                       platform === 'facebook' ? this.settings.enabledForFacebook :
                       this.settings.enabledForMedia; // For media sites
      console.log(`%c[Creativity Guard] Feature enabled for ${platform}:`, 'color: #0a66c2;', isEnabled);

      if (!isEnabled) return;

      // Check if user already gave consent for this session
      if (this.sessionConsent[platform]) {
        console.log(`%c[Creativity Guard] User already gave consent for ${platform} this session`, 'color: #0a66c2;');
        return;
      }

      // Check if it's a weekend
      const isWeekendDay = this.isWeekend();
      console.log(`%c[Creativity Guard] Is weekend:`, 'color: #0a66c2;', isWeekendDay);

      // Check time and previous visits
      const isAllowedTime = await this.isAllowedTime(platform);
      const hasVisited = this.hasVisitedToday(platform);
      console.log(`%c[Creativity Guard] Time allowed: ${isAllowedTime}, Has visited today: ${hasVisited}`, 'color: #0a66c2;');

      // Determine if restriction modal should be shown based on weekend/time/visit
      const isTotalWeekendBlock = isWeekendDay && (this.settings.totalWeekendBlock !== undefined ? this.settings.totalWeekendBlock : true);
      const shouldShowModal = isTotalWeekendBlock || !isAllowedTime || hasVisited;

      if (shouldShowModal) {
        console.log('%c[Creativity Guard] Showing restriction modal (Weekend/Time/Visit)', 'color: #0a66c2;');
        // Keep early blocker visible until modal is ready
        this.showSocialMediaModal(platform, false, displayName); // Pass displayName for media sites
      } else {
        console.log('%c[Creativity Guard] Recording first visit', 'color: #0a66c2;');
        this.recordVisit(platform);

        // Remove early blocker since access is allowed
        if (earlyBlockerElement && earlyBlockerElement.parentNode) {
          earlyBlockerElement.remove();
        }

        // Set session consent since this is allowed without prompt
        this.sessionConsent[platform] = true;
        this.saveSessionConsent(); // Save to sessionStorage
      }
    } catch (error) {
      console.error('%c[Creativity Guard] Error handling site visit:', 'color: #ff0000;', error);
    }
  },
  
  // Show persistent reason bar at top of page
  showReasonBar: function(reason, platform) {
    try {
      // Remove any existing reason bar
      const existingBar = document.getElementById('creativity-guard-reason-bar');
      if (existingBar) {
        existingBar.remove();
      }

      // Remove any existing body padding
      document.body.style.removeProperty('padding-top');

      // Create the reason bar
      const reasonBar = document.createElement('div');
      reasonBar.id = 'creativity-guard-reason-bar';
      reasonBar.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 56px;
        background: linear-gradient(135deg, rgba(254, 243, 199, 0.98), rgba(254, 215, 170, 0.98));
        border-top: 2px solid #f59e0b;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 2147483646;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        animation: slideUp 0.3s ease-out;
      `;

      // Add animation keyframes if not already added
      if (!document.getElementById('creativity-guard-reason-bar-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'creativity-guard-reason-bar-styles';
        styleSheet.textContent = `
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideDown {
            from {
              transform: translateY(0);
              opacity: 1;
            }
            to {
              transform: translateY(100%);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(styleSheet);
      }

      // Create content container
      const contentContainer = document.createElement('div');
      contentContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        max-width: calc(100% - 120px);
      `;

      // Add warning icon
      const warningIcon = document.createElement('span');
      warningIcon.textContent = '⚠️';
      warningIcon.style.cssText = `
        font-size: 20px;
        flex-shrink: 0;
      `;

      // Add platform name
      const platformText = document.createElement('span');
      platformText.textContent = `${platform.charAt(0).toUpperCase() + platform.slice(1)} bypass:`;
      platformText.style.cssText = `
        font-weight: 600;
        color: #92400e;
        flex-shrink: 0;
      `;

      // Add reason text
      const reasonText = document.createElement('span');
      reasonText.textContent = reason;
      reasonText.style.cssText = `
        color: #78350f;
        font-style: italic;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      `;
      reasonText.title = reason; // Show full reason on hover

      // Add time counter
      const timeCounter = document.createElement('span');
      const startTime = Date.now();
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timeCounter.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };
      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);

      timeCounter.style.cssText = `
        font-weight: 600;
        color: #92400e;
        font-size: 14px;
        margin-right: 12px;
        flex-shrink: 0;
        min-width: 45px;
        text-align: center;
        background: rgba(255, 255, 255, 0.5);
        padding: 4px 8px;
        border-radius: 12px;
      `;
      timeCounter.title = 'Time spent on this site';

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: #92400e;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
      `;

      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(0, 0, 0, 0.1)';
      });

      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'transparent';
      });

      closeButton.addEventListener('click', () => {
        // Animate out
        clearInterval(timerInterval);
        reasonBar.style.animation = 'slideDown 0.3s ease-out forwards';
        setTimeout(() => {
          reasonBar.remove();
          document.body.style.removeProperty('padding-bottom');
        }, 300);
      });

      // Assemble the bar
      contentContainer.appendChild(warningIcon);
      contentContainer.appendChild(platformText);
      contentContainer.appendChild(reasonText);
      reasonBar.appendChild(contentContainer);
      reasonBar.appendChild(timeCounter);
      reasonBar.appendChild(closeButton);

      // Add to page
      document.body.appendChild(reasonBar);

      // Push up page content to avoid covering anything at the bottom
      setTimeout(() => {
        document.body.style.paddingBottom = '56px';
      }, 10);

      // Clean up on navigation
      CreativityGuardCleanup.trackElement(reasonBar);

      // Store timer interval for cleanup
      reasonBar.dataset.timerId = timerInterval;

      // Clean up timer when element is removed
      const originalRemove = reasonBar.remove.bind(reasonBar);
      reasonBar.remove = function() {
        clearInterval(timerInterval);
        document.body.style.removeProperty('padding-bottom');
        originalRemove();
      };

    } catch (error) {
      console.error('%c[Creativity Guard] Error showing reason bar:', 'color: #ff0000;', error);
    }
  },

  // Show social media restriction modal
  showSocialMediaModal: function(platform, isVacationMode = false, displayName = null) { // Added displayName for media sites
    try {
      // Add enhanced styles to the document if they don't exist
      if (!document.getElementById('social-media-modal-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'social-media-modal-styles';
        styleSheet.textContent = `
          #social-media-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 1);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            animation: modalFadeIn 0.4s ease-out forwards;
          }
          
          @keyframes modalFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes modalFadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
          
          @keyframes modalSlideIn {
            from {
              transform: translateY(20px) scale(0.95);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          
          @keyframes modalSlideOut {
            from {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            to {
              transform: translateY(-20px) scale(0.95);
              opacity: 0;
            }
          }
          
          #social-media-modal .content {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            max-width: 520px;
            width: 90%;
            padding: 32px;
            border-radius: 20px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
            animation: modalSlideIn 0.4s ease-out;
          }
          
          #social-media-modal .content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
          }
          
          #social-media-modal h2 {
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          
          #social-media-modal h2::before {
            content: '🛡️';
            font-size: 32px;
          }
          
          #social-media-modal p {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 32px;
            max-width: 420px;
            margin-left: auto;
            margin-right: auto;
          }
          
          #social-media-modal .buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          #social-media-modal button {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 160px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          #social-media-modal button:focus {
            outline: 3px solid rgba(59, 130, 246, 0.5);
            outline-offset: 3px;
          }
          
          #social-media-modal #proceed {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
          }
          
          #social-media-modal #proceed:hover {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          
          #social-media-modal #proceed::before {
            content: '➤';
          }
          
          #social-media-modal #skip {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          }
          
          #social-media-modal #skip:hover {
            background: linear-gradient(135deg, #059669, #047857);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          }
          
          #social-media-modal #skip::before {
            content: '📚';
          }
          
          /* Responsive design */
          @media (max-width: 480px) {
            #social-media-modal .content {
              padding: 24px;
              border-radius: 16px;
              width: 95%;
            }
            
            #social-media-modal h2 {
              font-size: 24px;
            }
            
            #social-media-modal .buttons {
              flex-direction: column;
            }
            
            #social-media-modal button {
              width: 100%;
            }
          }
        `;
        document.head.appendChild(styleSheet);
      }

      const modal = document.createElement('div');
      modal.id = 'social-media-modal';
      
      const content = document.createElement('div');
      content.className = 'content';
      
      const title = document.createElement('h2');
      title.textContent = platform === 'media' ? 'Mindful Media Consumption' : 'Mindful Social Media Usage';

      // Get usage statistics
      const stats = this.getUsageStats();

      let messageText = '';
      const platformName = displayName || (platform.charAt(0).toUpperCase() + platform.slice(1));

      // Use unified settings from sites.json if available, fallback to legacy
      let allowedStartHour = 15; // Default
      let allowedEndHour = 19;  // Default

      // Try to get from sites.json synchronously from cache
      if (sitesConfig && sitesConfig.settings) {
        allowedStartHour = sitesConfig.settings.allowedAfterHour || 15;
        allowedEndHour = sitesConfig.settings.allowedEndHour || 19;
      } else {
        // Fallback to legacy platform-specific settings
        allowedStartHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour :
                          platform === 'twitter' ? this.settings.twitterAllowedHour :
                          platform === 'facebook' ? this.settings.facebookAllowedHour :
                          this.settings.mediaAllowedHour;
        allowedEndHour = this.settings.allowedEndHour || 19;
      }
      
      // --- Determine Message Text ---
      if (isVacationMode) {
        messageText = `Vacation Mode is active. ${platformName} access is currently restricted to help you disconnect. You can turn off Vacation Mode in the extension settings.`;
      } else {
        // Original logic for weekend/time/visit checks
        const isWeekendDay = this.isWeekend();
        const isTotalWeekendBlock = isWeekendDay && (this.settings.totalWeekendBlock !== undefined ? this.settings.totalWeekendBlock : true);

        if (isTotalWeekendBlock) {
          messageText = `It's the weekend! ${platformName} access is currently blocked to help you disconnect. You can change this in extension settings.`;
        } else {
          // Check time using unified settings
          const now = new Date();
          const currentHour = now.getHours();
          const isTimeAllowed = currentHour >= allowedStartHour && currentHour < allowedEndHour;

          if (!isTimeAllowed) {
            messageText = `${platformName} is only available between ${allowedStartHour}:00 and ${allowedEndHour}:00. Consider focusing on deep work during other hours.`;
          } else if (this.hasVisitedToday(platform)) {
            messageText = `You've already visited ${platformName} today. Consider limiting your social media usage.`;
          } else {
            // Fallback message if somehow modal is shown without a specific reason (shouldn't happen often)
            messageText = `Please consider if now is the best time to visit ${platformName}.`;
          }
        }
      }
      // --- End Determine Message Text ---

      const message = document.createElement('p');
      message.textContent = messageText;

      // Add usage stats if there are any
      let statsElement = null;
      if (stats.bypassCount > 0 || stats.disableCount > 0) {
        statsElement = document.createElement('div');
        statsElement.style.cssText = `
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          border: 2px solid #f87171;
          border-radius: 12px;
          padding: 16px;
          margin: 20px 0;
          text-align: center;
        `;

        const statsTitle = document.createElement('p');
        statsTitle.style.cssText = `
          font-size: 16px;
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 8px 0;
        `;
        statsTitle.textContent = '⚠️ Your activity in the last 24 hours:';
        statsElement.appendChild(statsTitle);

        if (stats.bypassCount > 0) {
          const bypassStat = document.createElement('p');
          bypassStat.style.cssText = `
            font-size: 15px;
            color: #b91c1c;
            margin: 4px 0;
            font-weight: 500;
          `;
          bypassStat.textContent = `🔄 Bypassed restrictions ${stats.bypassCount} time${stats.bypassCount > 1 ? 's' : ''}`;
          statsElement.appendChild(bypassStat);
        }

        if (stats.disableCount > 0) {
          const disableStat = document.createElement('p');
          disableStat.style.cssText = `
            font-size: 15px;
            color: #b91c1c;
            margin: 4px 0;
            font-weight: 500;
          `;
          disableStat.textContent = `🔴 Disabled extension ${stats.disableCount} time${stats.disableCount > 1 ? 's' : ''}`;
          statsElement.appendChild(disableStat);
        }

        // Add motivational message based on stats
        if (stats.bypassCount > 5 || stats.disableCount > 2) {
          const motivationMsg = document.createElement('p');
          motivationMsg.style.cssText = `
            font-size: 14px;
            color: #7f1d1d;
            margin: 8px 0 0 0;
            font-style: italic;
          `;
          motivationMsg.textContent = 'Consider strengthening your commitment to focused work.';
          statsElement.appendChild(motivationMsg);
        }
      }

      const buttons = document.createElement('div');
      buttons.className = 'buttons';

      // --- Always show bypass option with accountability flow ---
      // Helper function to determine block type for logging
      const getBlockType = () => {
        if (isVacationMode) return 'vacation';
        const isWeekendDay = this.isWeekend();
        const isTotalWeekendBlock = isWeekendDay && (this.settings.totalWeekendBlock !== undefined ? this.settings.totalWeekendBlock : true);
        if (isTotalWeekendBlock) return 'weekend';

        // Check time using the same unified settings we used above
        const now = new Date();
        const currentHour = now.getHours();
        const isTimeAllowed = currentHour >= allowedStartHour && currentHour < allowedEndHour;
        if (!isTimeAllowed) return 'outside_hours';

        if (this.hasVisitedToday(platform)) return 'already_visited';
        return 'unknown';
      };

      const blockType = getBlockType();

      // Helper function to validate reason
      const validateReason = (reason) => {
        if (!reason || typeof reason !== 'string') return false;
        const trimmed = reason.trim();
        if (trimmed.length < 10) return false;
        // Check for low-effort responses
        const lowEffort = ['asdf', 'test test', '..........', 'aaaaaaaaaa', '1234567890', 'qqqqqqqqqq'];
        if (lowEffort.some(pattern => trimmed.toLowerCase().includes(pattern))) {
          return false;
        }
        return true;
      };

      // Helper function to show reason input step
      const showReasonInput = (onValidReason, onCancel) => {
        // Update modal content for reason input
        content.innerHTML = ''; // Clear existing content

        const reasonTitle = document.createElement('h2');
        reasonTitle.textContent = 'Why do you need to bypass?';
        reasonTitle.style.marginBottom = '20px';

        const reasonDescription = document.createElement('p');
        reasonDescription.textContent = 'Please explain why you need access right now:';
        reasonDescription.style.marginBottom = '12px';
        reasonDescription.style.fontSize = '15px';
        reasonDescription.style.color = '#4b5563';

        const reasonInput = document.createElement('textarea');
        reasonInput.placeholder = 'Enter your reason (minimum 10 characters)...';
        reasonInput.style.cssText = `
          width: 100%;
          min-height: 80px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s;
        `;
        reasonInput.setAttribute('maxlength', '500');

        const charCount = document.createElement('div');
        charCount.style.cssText = `
          text-align: right;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
          margin-bottom: 20px;
        `;
        charCount.textContent = '0 / 10 characters minimum';

        const reasonButtons = document.createElement('div');
        reasonButtons.className = 'buttons';

        const startCountdownBtn = document.createElement('button');
        startCountdownBtn.textContent = 'Start Countdown';
        startCountdownBtn.disabled = true;
        startCountdownBtn.style.cssText = `
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: not-allowed;
          background: #e5e7eb;
          color: #9ca3af;
          transition: all 0.2s ease;
          min-width: 160px;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          color: #374151;
          border: 2px solid #d1d5db;
          transition: all 0.2s ease;
          min-width: 160px;
        `;

        // Update button state based on input
        reasonInput.addEventListener('input', (e) => {
          const value = e.target.value;
          const charLength = value.trim().length;
          const isValid = validateReason(value);

          // Update character count
          charCount.textContent = `${charLength} / 10 characters minimum`;
          charCount.style.color = charLength >= 10 ? '#10b981' : '#9ca3af';

          // Update input border
          if (value.length > 0) {
            reasonInput.style.borderColor = isValid ? '#10b981' : '#ef4444';
          } else {
            reasonInput.style.borderColor = '#e5e7eb';
          }

          // Update button state
          startCountdownBtn.disabled = !isValid;
          if (isValid) {
            startCountdownBtn.style.cssText = `
              padding: 14px 28px;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: white;
              transition: all 0.2s ease;
              min-width: 160px;
            `;
          } else {
            startCountdownBtn.style.cssText = `
              padding: 14px 28px;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: not-allowed;
              background: #e5e7eb;
              color: #9ca3af;
              transition: all 0.2s ease;
              min-width: 160px;
            `;
          }
        });

        startCountdownBtn.addEventListener('click', () => {
          const reason = reasonInput.value.trim();
          if (validateReason(reason)) {
            onValidReason(reason);
          }
        });

        cancelBtn.addEventListener('click', onCancel);

        reasonButtons.appendChild(startCountdownBtn);
        reasonButtons.appendChild(cancelBtn);

        content.appendChild(reasonTitle);
        content.appendChild(reasonDescription);
        content.appendChild(reasonInput);
        content.appendChild(charCount);
        content.appendChild(reasonButtons);

        // Focus on input
        setTimeout(() => reasonInput.focus(), 100);
      };

      // Helper function to show countdown
      const showCountdown = (reason, onComplete, onAbort) => {
        let timeLeft = 20;
        let countdownInterval;

        const updateCountdownDisplay = () => {
          content.innerHTML = ''; // Clear existing content

          const countdownTitle = document.createElement('h2');
          countdownTitle.textContent = 'Please wait...';
          countdownTitle.style.marginBottom = '20px';

          const timerDisplay = document.createElement('div');
          timerDisplay.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            color: ${timeLeft <= 5 ? '#ef4444' : '#f59e0b'};
            margin: 20px 0;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
          `;
          timerDisplay.textContent = timeLeft;

          const reasonDisplay = document.createElement('div');
          reasonDisplay.style.cssText = `
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            padding: 16px;
            border-radius: 12px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          `;

          const reasonLabel = document.createElement('p');
          reasonLabel.textContent = 'Your reason:';
          reasonLabel.style.cssText = `
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
            font-size: 14px;
          `;

          const reasonText = document.createElement('p');
          reasonText.textContent = reason;
          reasonText.style.cssText = `
            color: #4b5563;
            font-style: italic;
            font-size: 15px;
            line-height: 1.5;
          `;

          reasonDisplay.appendChild(reasonLabel);
          reasonDisplay.appendChild(reasonText);

          const messageText = document.createElement('p');
          messageText.textContent = 'Take this moment to reconsider if you really need access now.';
          messageText.style.cssText = `
            color: #6b7280;
            font-size: 15px;
            margin: 20px 0;
          `;

          const abortBtn = document.createElement('button');
          abortBtn.textContent = 'Abort Bypass';
          abortBtn.style.cssText = `
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            transition: all 0.2s ease;
            min-width: 200px;
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
          `;

          abortBtn.addEventListener('click', () => {
            clearInterval(countdownInterval);
            onAbort();
          });

          abortBtn.addEventListener('mouseenter', () => {
            abortBtn.style.transform = 'translateY(-2px)';
            abortBtn.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
          });

          abortBtn.addEventListener('mouseleave', () => {
            abortBtn.style.transform = 'translateY(0)';
            abortBtn.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.3)';
          });

          // Create a wrapper for the button to center it
          const buttonWrapper = document.createElement('div');
          buttonWrapper.style.cssText = `
            display: flex;
            justify-content: center;
            width: 100%;
            margin-top: 20px;
          `;
          buttonWrapper.appendChild(abortBtn);

          content.appendChild(countdownTitle);
          content.appendChild(timerDisplay);
          content.appendChild(reasonDisplay);
          content.appendChild(messageText);
          content.appendChild(buttonWrapper);
        };

        // Initial display
        updateCountdownDisplay();

        // Start countdown
        countdownInterval = CreativityGuardCleanup.trackInterval(setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            onComplete();
          } else {
            updateCountdownDisplay();
          }
        }, 1000));
      };

      // Create bypass button (always shown now)
      const bypassButton = document.createElement('button');
      bypassButton.id = 'bypass';
      bypassButton.textContent = 'Bypass Blockade';
      bypassButton.setAttribute('aria-label', 'Bypass the blockade with accountability');
      bypassButton.setAttribute('title', 'Provide a reason to bypass (Enter)');
      bypassButton.style.cssText = `
        padding: 14px 28px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        transition: all 0.2s ease;
        min-width: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
      `;

      const bypassModalHandler = () => {
        // Show reason input
        showReasonInput(
          (reason) => {
            // Show countdown
            showCountdown(
              reason,
              () => {
                // Countdown completed - record and proceed
                this.recordBypassWithReason(platform, reason, blockType);

                // Show the reason bar to keep the reason visible
                this.showReasonBar(reason, platform);

                // Animate out before proceeding
                modal.style.animation = 'modalFadeOut 0.3s ease-in forwards';
                setTimeout(() => {
                  this.sessionConsent[platform] = true;
                  this.saveSessionConsent(); // Save to sessionStorage
                  modal.remove();
                  // Also ensure early blocker is removed
                  if (earlyBlockerElement && earlyBlockerElement.parentNode) {
                    earlyBlockerElement.remove();
                  }
                }, 300);
              },
              () => {
                // User aborted - go back to initial state
                content.innerHTML = '';
                content.appendChild(title);
                content.appendChild(message);
                if (statsElement) {
                  content.appendChild(statsElement);
                }
                content.appendChild(buttons);
                bypassButton.focus();
              }
            );
          },
          () => {
            // User cancelled - go back to initial state
            content.innerHTML = '';
            content.appendChild(title);
            content.appendChild(message);
            if (statsElement) {
              content.appendChild(statsElement);
            }
            content.appendChild(buttons);
            bypassButton.focus();
          }
        );
      };

      bypassButton.addEventListener('click', bypassModalHandler);
      CreativityGuardCleanup.trackEventListener(bypassButton, 'click', bypassModalHandler);
      buttons.appendChild(bypassButton);
      
      const skipButton = document.createElement('button');
      skipButton.id = 'skip';
      skipButton.textContent = 'Go to Reading';
      skipButton.setAttribute('aria-label', 'Go to reading material instead');
      skipButton.setAttribute('title', 'Redirect to reading material (Escape)');
      const skipModalHandler = () => {
        try {
          // Animate out before redirecting
          modal.style.animation = 'modalFadeOut 0.3s ease-in forwards';
          setTimeout(() => {
            modal.remove();
            // Try to get redirect URL from sites.json first, then fallback to legacy settings
            let redirectUrl = 'https://weeatrobots.substack.com'; // Default
            if (sitesConfig && sitesConfig.settings && sitesConfig.settings.redirectUrl) {
              redirectUrl = sitesConfig.settings.redirectUrl;
            } else if (this.settings.redirectUrl) {
              redirectUrl = this.settings.redirectUrl;
            }

            const validatedUrl = validateAndSanitizeUrl(redirectUrl);
            
            // Additional safety check before redirecting
            if (validatedUrl && typeof validatedUrl === 'string' && validatedUrl.startsWith('http')) {
              window.location.href = validatedUrl;
            } else {
              console.error('Invalid redirect URL after validation:', validatedUrl);
              window.location.href = 'https://weeatrobots.substack.com'; // Fallback
            }
          }, 300);
        } catch (error) {
          console.error('Error during redirect:', error);
          window.location.href = 'https://weeatrobots.substack.com'; // Safe fallback
        }
      };
      skipButton.addEventListener('click', skipModalHandler);
      CreativityGuardCleanup.trackEventListener(skipButton, 'click', skipModalHandler);
      
      // Add keyboard navigation to the social media modal
      const keyboardHandler = (e) => {
        switch(e.key) {
          case 'Escape':
            e.preventDefault();
            skipModalHandler();
            break;
          case 'Enter':
            if (document.activeElement === bypassButton) {
              e.preventDefault();
              bypassButton.click();
            } else if (document.activeElement === skipButton) {
              e.preventDefault();
              skipButton.click();
            } else {
              e.preventDefault();
              bypassButton.click(); // Default to bypass button
            }
            break;
          case 'Tab':
            // Focus management for modal
            const focusableElements = [bypassButton, skipButton];
            const currentIndex = focusableElements.indexOf(document.activeElement);

            if (e.shiftKey && currentIndex === 0) {
              e.preventDefault();
              focusableElements[focusableElements.length - 1].focus();
            } else if (!e.shiftKey && currentIndex === focusableElements.length - 1) {
              e.preventDefault();
              focusableElements[0].focus();
            }
            break;
        }
      };
      
      // Add keyboard handler to modal
      modal.addEventListener('keydown', keyboardHandler);
      CreativityGuardCleanup.trackEventListener(modal, 'keydown', keyboardHandler);
      
      // Set modal attributes for accessibility
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'social-modal-title');
      modal.setAttribute('aria-describedby', 'social-modal-content');
      modal.setAttribute('tabindex', '-1');
      
      title.id = 'social-modal-title';
      message.id = 'social-modal-content';
      
      buttons.appendChild(skipButton);
      
      content.appendChild(title);
      content.appendChild(message);
      if (statsElement) {
        content.appendChild(statsElement);
      }
      content.appendChild(buttons);
      modal.appendChild(content);

      // Ensure body exists before appending
      if (document.body) {
        document.body.appendChild(modal);
      } else {
        // Wait for body to be ready
        const appendModal = () => {
          if (document.body) {
            document.body.appendChild(modal);
          } else {
            setTimeout(appendModal, 10);
          }
        };
        appendModal();
      }

      // Remove early blocker now that modal is shown
      const blocker = document.getElementById('creativity-guard-early-blocker');
      if (blocker) {
        blocker.remove();
      }
      // Also try the element reference
      if (earlyBlockerElement && earlyBlockerElement.parentNode) {
        earlyBlockerElement.remove();
      }

      // Focus management for accessibility
      setTimeout(() => {
        // Focus on bypass button by default
        if (bypassButton) {
          bypassButton.focus();
        }

        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.textContent = `Social media restriction modal appeared. ${messageText}`;
        if (document.body) {
          document.body.appendChild(announcement);
          setTimeout(() => announcement.remove(), 3000);
        }
      }, 100);
    } catch (e) {
      console.error('Error showing social media modal:', e);
    }
  }
};

// Initialize social media module for relevant sites immediately
try {
  const hostname = window.location.hostname;
  if (hostname.includes('linkedin.com') ||
      hostname.includes('twitter.com') ||
      hostname.includes('x.com') ||
      hostname.includes('facebook.com') ||
      hostname.includes('theguardian.com') ||
      hostname.includes('nytimes.com') ||
      hostname.includes('washingtonpost.com') ||
      hostname.includes('bbc.com') ||
      hostname.includes('cnn.com') ||
      hostname.includes('reddit.com')) {
    // Initialize immediately to ensure fast blocking
    socialMediaModule.init();
  }
} catch (e) {
  console.error('Error initializing social media module:', e);
} 