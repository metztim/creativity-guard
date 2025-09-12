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
    } catch (e) {
      console.warn('Error removing extension DOM elements:', e);
    }

    console.log('CreativityGuard: Cleanup completed');
  }
};

// Set up global cleanup handlers
window.addEventListener('beforeunload', () => CreativityGuardCleanup.cleanup());
window.addEventListener('unload', () => CreativityGuardCleanup.cleanup());
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


// Simple wrapper for chrome.storage operations
const storage = {
  get: function(key, callback) {
    try {
      chrome.storage.local.get([key], function(result) {
        if (chrome.runtime.lastError) {
          console.error('Storage get error:', chrome.runtime.lastError);
          if (callback) callback(null);
          return;
        }
        if (callback) callback(result[key]);
      });
    } catch (e) {
      console.error('Error calling storage get:', e);
      if (callback) callback(null);
    }
  },
  
  set: function(key, value, callback) {
    try {
      const data = {};
      data[key] = value;
      
      chrome.storage.local.set(data, function() {
        if (chrome.runtime.lastError) {
          console.error('Storage set error:', chrome.runtime.lastError);
          if (callback) callback(false);
          return;
        }
        if (callback) callback(true);
      });
    } catch (e) {
      console.error('Storage set error:', e);
      if (callback) callback(false);
    }
  }
};

// URL validation utility function
function validateAndSanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    console.warn('Invalid URL provided:', url);
    return 'https://read.readwise.io'; // Safe default
  }
  
  try {
    const trimmedUrl = url.trim();
    
    // Check for obviously malicious patterns
    if (trimmedUrl.includes('javascript:') || 
        trimmedUrl.includes('data:') || 
        trimmedUrl.includes('vbscript:') ||
        trimmedUrl.includes('file:')) {
      console.warn('Potentially malicious URL blocked:', trimmedUrl);
      return 'https://read.readwise.io';
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
      return 'https://read.readwise.io';
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
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 2000);
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
(function initializeAISiteHandlers() {
  try {
    console.log('Initializing AI site handlers...');
    
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
    allowedEndHour: 19, // 7 PM - end of allowed time window
    enabledForLinkedin: true,
    enabledForTwitter: true,
    enabledForFacebook: true,
    totalWeekendBlock: true, // Complete block on weekends by default
    vacationModeEnabled: false, // New setting for vacation mode
    redirectUrl: 'https://read.readwise.io',
    visits: {} // Will store dates of visits
  },
  
  // Current settings
  settings: null,
  
  // Session consent tracking (resets when browser is closed)
  sessionConsent: {
    linkedin: false,
    twitter: false,
    facebook: false
  },
  
  // Initialize the module
  init: function() {
    console.log('%c[Creativity Guard] Social media module initializing...', 'color: #0a66c2; font-weight: bold;');
    // Load settings and then handle the site visit after settings are loaded
    this.storage.get((settings) => {
      try {
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
        
        // Now that settings are loaded, check if we're on a social media site
        if (window.location.hostname.includes('linkedin.com')) {
          console.log('%c[Creativity Guard] On LinkedIn, handling site visit', 'color: #0a66c2;');
          this.handleSocialMediaSite('linkedin');
        } else if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
          console.log('%c[Creativity Guard] On Twitter, handling site visit', 'color: #0a66c2;');
          this.handleSocialMediaSite('twitter');
        } else if (window.location.hostname.includes('facebook.com')) {
          console.log('%c[Creativity Guard] On Facebook, handling site visit', 'color: #0a66c2;');
          this.handleSocialMediaSite('facebook');
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
  isAllowedTime: function(platform) {
    const now = new Date();
    const hour = now.getHours();
    const allowedStartHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour : 
                            platform === 'twitter' ? this.settings.twitterAllowedHour : 
                            this.settings.facebookAllowedHour;
    
    // Use configurable end hour from settings
    const allowedEndHour = this.settings.allowedEndHour || 19; // Default to 7 PM if not set
    
    return hour >= allowedStartHour && hour < allowedEndHour;
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
  
  // Handle social media site visit
  handleSocialMediaSite: function(platform) {
    try {
      console.log(`%c[Creativity Guard] Handling ${platform} visit`, 'color: #0a66c2;');
      
      // --- Vacation Mode Check ---
      if (this.settings.vacationModeEnabled) {
        console.log('%c[Creativity Guard] Vacation Mode is active, showing restriction modal', 'color: #ff9800;');
        this.showSocialMediaModal(platform, true); // Pass true for isVacationMode
        return; // Skip further checks if vacation mode is on
      }
      // --- End Vacation Mode Check ---

      // Check if the feature is enabled for this platform
      const isEnabled = platform === 'linkedin' ? this.settings.enabledForLinkedin : 
                       platform === 'twitter' ? this.settings.enabledForTwitter : 
                       this.settings.enabledForFacebook;
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
      const isAllowedTime = this.isAllowedTime(platform);
      const hasVisited = this.hasVisitedToday(platform);
      console.log(`%c[Creativity Guard] Time allowed: ${isAllowedTime}, Has visited today: ${hasVisited}`, 'color: #0a66c2;');
      
      // Determine if restriction modal should be shown based on weekend/time/visit
      const isTotalWeekendBlock = isWeekendDay && (this.settings.totalWeekendBlock !== undefined ? this.settings.totalWeekendBlock : true);
      const shouldShowModal = isTotalWeekendBlock || !isAllowedTime || hasVisited;

      if (shouldShowModal) {
        console.log('%c[Creativity Guard] Showing restriction modal (Weekend/Time/Visit)', 'color: #0a66c2;');
        this.showSocialMediaModal(platform, false); // Pass false for isVacationMode
      } else {
        console.log('%c[Creativity Guard] Recording first visit', 'color: #0a66c2;');
        this.recordVisit(platform);
        
        // Set session consent since this is allowed without prompt
        this.sessionConsent[platform] = true;
      }
    } catch (error) {
      console.error('%c[Creativity Guard] Error handling site visit:', 'color: #ff0000;', error);
    }
  },
  
  // Show social media restriction modal
  showSocialMediaModal: function(platform, isVacationMode = false) { // Added isVacationMode parameter
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
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
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
      title.textContent = 'Mindful Social Media Usage';
      
      let messageText = '';
      const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
      const allowedHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour : 
                         platform === 'twitter' ? this.settings.twitterAllowedHour : 
                         this.settings.facebookAllowedHour;
      
      // --- Determine Message Text ---
      if (isVacationMode) {
        messageText = `Vacation Mode is active. ${platformName} access is currently restricted to help you disconnect. You can turn off Vacation Mode in the extension settings.`;
      } else {
        // Original logic for weekend/time/visit checks
        const isWeekendDay = this.isWeekend();
        const isTotalWeekendBlock = isWeekendDay && (this.settings.totalWeekendBlock !== undefined ? this.settings.totalWeekendBlock : true);

        if (isTotalWeekendBlock) {
          messageText = `It's the weekend! ${platformName} access is currently blocked to help you disconnect. You can change this in extension settings.`;
        } else if (!this.isAllowedTime(platform)) {
          const allowedStartHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour : 
                                  platform === 'twitter' ? this.settings.twitterAllowedHour : 
                                  this.settings.facebookAllowedHour;
          const allowedEndHour = this.settings.allowedEndHour || 19;
          messageText = `${platformName} is only available between ${allowedStartHour}:00 and ${allowedEndHour}:00. Consider focusing on deep work during other hours.`;
        } else if (this.hasVisitedToday(platform)) {
          messageText = `You've already visited ${platformName} today. Consider limiting your social media usage.`;
        } else {
           // Fallback message if somehow modal is shown without a specific reason (shouldn't happen often)
           messageText = `Please consider if now is the best time to visit ${platformName}.`;
        }
      }
      // --- End Determine Message Text ---

      const message = document.createElement('p');
      message.textContent = messageText;
      
      const buttons = document.createElement('div');
      buttons.className = 'buttons';
      
      // --- Determine Buttons ---
      // Conditions for showing the "Proceed Anyway" button:
      // 1. Vacation Mode must be OFF.
      // 2. It must NOT be a weekend where totalWeekendBlock is enabled.
      // 3. It must NOT be a weekday outside the allowed time window (hard block).
      const isWeekendDayForButton = this.isWeekend();
      const isTotalWeekendBlockForButton = isWeekendDayForButton && (this.settings.totalWeekendBlock !== undefined ? this.settings.totalWeekendBlock : true);
      const isWeekdayHardBlock = !isWeekendDayForButton && !this.isAllowedTime(platform);
      const allowProceed = !isVacationMode && !isTotalWeekendBlockForButton && !isWeekdayHardBlock;

      let proceedButton = null;
      if (allowProceed) {
        proceedButton = document.createElement('button');
        proceedButton.id = 'proceed';
        proceedButton.textContent = 'Proceed Anyway';
        proceedButton.setAttribute('aria-label', 'Proceed to social media anyway');
        proceedButton.setAttribute('title', 'Continue to social media (Enter)');
        const proceedModalHandler = () => {
          // Animate out before proceeding
          modal.style.animation = 'modalFadeOut 0.3s ease-in forwards';
          setTimeout(() => {
            this.sessionConsent[platform] = true;
            modal.remove();
          }, 300);
        };
        proceedButton.addEventListener('click', proceedModalHandler);
        CreativityGuardCleanup.trackEventListener(proceedButton, 'click', proceedModalHandler);
        buttons.appendChild(proceedButton);
      }
      
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
            const validatedUrl = validateAndSanitizeUrl(this.settings.redirectUrl || 'https://read.readwise.io');
            
            // Additional safety check before redirecting
            if (validatedUrl && typeof validatedUrl === 'string' && validatedUrl.startsWith('http')) {
              window.location.href = validatedUrl;
            } else {
              console.error('Invalid redirect URL after validation:', validatedUrl);
              window.location.href = 'https://read.readwise.io'; // Fallback
            }
          }, 300);
        } catch (error) {
          console.error('Error during redirect:', error);
          window.location.href = 'https://read.readwise.io'; // Safe fallback
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
            if (document.activeElement === proceedButton) {
              e.preventDefault();
              proceedButton.click();
            } else {
              e.preventDefault();
              skipModalHandler();
            }
            break;
          case 'Tab':
            // Focus management for modal
            const focusableElements = proceedButton ? [proceedButton, skipButton] : [skipButton];
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
      content.appendChild(buttons);
      modal.appendChild(content);
      
      document.body.appendChild(modal);
      
      // Focus management for accessibility
      setTimeout(() => {
        if (proceedButton) {
          proceedButton.focus();
        } else {
          skipButton.focus();
        }
        
        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.textContent = `Social media restriction modal appeared. ${messageText}`;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 3000);
      }, 100);
    } catch (e) {
      console.error('Error showing social media modal:', e);
    }
  }
};

// Initialize social media module for relevant sites
try {
  if (window.location.hostname.includes('linkedin.com') || 
      window.location.hostname.includes('twitter.com') || 
      window.location.hostname.includes('x.com') ||
      window.location.hostname.includes('facebook.com')) {
    socialMediaModule.init();
  }
} catch (e) {
  console.error('Error initializing social media module:', e);
} 