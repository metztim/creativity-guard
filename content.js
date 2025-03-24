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

// Safe wrapper for chrome.storage operations with retry mechanism
const storage = {
  isValidContext: function() {
    try {
      return typeof chrome !== 'undefined' && 
             chrome?.runtime?.id !== undefined && 
             chrome?.storage?.local !== undefined;
    } catch (e) {
      return false;
    }
  },
  
  get: function(key, callback, retryCount = 0) {
    const maxRetries = 2;
    const retryDelay = 500;
    
    const retry = () => {
      if (retryCount < maxRetries) {
        console.warn(`Retrying storage get operation (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => this.get(key, callback, retryCount + 1), retryDelay);
      } else {
        console.warn('Max retries reached for storage get operation');
        if (callback) callback(null);
      }
    };
    
    try {
      if (!this.isValidContext()) {
        retry();
        return;
      }
      
      chrome.storage.local.get([key], function(result) {
        try {
          if (chrome?.runtime?.lastError) {
            console.error('Storage get error:', chrome.runtime.lastError);
            retry();
            return;
          }
          if (callback) callback(result[key]);
        } catch (e) {
          console.error('Error in storage get callback:', e);
          retry();
        }
      });
    } catch (e) {
      console.error('Storage get error:', e);
      retry();
    }
  },
  
  set: function(key, value, callback, retryCount = 0) {
    const maxRetries = 2;
    const retryDelay = 500;
    
    const retry = () => {
      if (retryCount < maxRetries) {
        console.warn(`Retrying storage set operation (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => this.set(key, value, callback, retryCount + 1), retryDelay);
      } else {
        console.warn('Max retries reached for storage set operation');
        if (callback) callback(false);
      }
    };
    
    try {
      if (!this.isValidContext()) {
        retry();
        return;
      }
      
      const data = {};
      data[key] = value;
      
      chrome.storage.local.set(data, function() {
        try {
          if (chrome?.runtime?.lastError) {
            console.error('Storage set error:', chrome.runtime.lastError);
            retry();
            return;
          }
          if (callback) callback(true);
        } catch (e) {
          console.error('Error in storage set callback:', e);
          retry();
        }
      });
    } catch (e) {
      console.error('Storage set error:', e);
      retry();
    }
  }
};

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
  'chat.openai.com': {
    setupReminder: function(inputElement, host) {
      try {
        console.log('ChatGPT: Setting up reminder...');
        
        // Try multiple container selectors for more reliable positioning
        const containers = [
          document.querySelector('main > div > div > div'),
          document.querySelector('main form'),
          document.querySelector('main > div'),
          document.querySelector('form'),
          document.querySelector('[class*="chat-container"]'),
          document.querySelector('[class*="conversation-container"]')
        ];
        
        // Find first valid container
        let container = null;
        for (let i = 0; i < containers.length; i++) {
          if (containers[i]) {
            console.log(`ChatGPT: Found container option ${i+1}`);
            container = containers[i];
            break;
          }
        }
        
        if (container) {
          // Create a wrapper div that matches ChatGPT's styling
          const wrapper = document.createElement('div');
          wrapper.style.maxWidth = '48rem';
          wrapper.style.margin = '0 auto';
          wrapper.style.padding = '1rem';
          wrapper.style.zIndex = '1000';
          wrapper.style.position = 'relative';
          wrapper.appendChild(host);
          
          // Insert at the top of the container
          container.insertBefore(wrapper, container.firstChild);
          console.log('ChatGPT: Successfully inserted reminder');
          return true;
        }
        
        // Fallback positioning
        console.log('ChatGPT: Trying fallback positioning');
        if (inputElement && inputElement.form) {
          inputElement.form.parentElement.insertBefore(host, inputElement.form);
          console.log('ChatGPT: Inserted using form parent');
          return true;
        } else if (inputElement && inputElement.parentElement) {
          const parent = inputElement.parentElement;
          parent.parentElement.insertBefore(host, parent);
          console.log('ChatGPT: Inserted using input parent');
          return true;
        }
        
        console.log('ChatGPT: Could not find suitable container');
        return false;
      } catch (e) {
        console.error('ChatGPT: Error in setupReminder:', e);
        return false;
      }
    },
    
    getInputElement: function() {
      try {
        console.log('ChatGPT: Finding input element...');
        // Try specific selectors for ChatGPT's input
        const selectors = [
          'textarea[placeholder*="Send a message"]',
          '#prompt-textarea',
          'form textarea', 
          'textarea',
          'form [contenteditable="true"]',
          '[role="textbox"]'
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          
          // Find the first visible element
          for (const element of elements) {
            if (element.offsetHeight > 0 && element.offsetWidth > 0) {
              console.log(`ChatGPT: Found input using selector: ${selector}`);
              return element;
            }
          }
        }
        
        console.log('ChatGPT: No input element found');
        return null;
      } catch (e) {
        console.error('ChatGPT: Error finding input:', e);
        return null;
      }
    },
    
    monitorInput: function(callback) {
      try {
        console.log('ChatGPT: Setting up input monitoring');
        
        // Function to set up event listeners
        const setupListeners = (element) => {
          if (!element || element.hasAttribute('creativity-guard-monitored')) return;
          
          console.log('ChatGPT: Setting up listeners for', element);
          element.setAttribute('creativity-guard-monitored', 'true');
          
          // Monitor all relevant events
          ['focus', 'click', 'input', 'keydown', 'mousedown'].forEach(eventType => {
            element.addEventListener(eventType, (e) => {
              console.log(`ChatGPT: ${eventType} event triggered`);
              callback(e);
            });
          });
          
          // Also monitor the form if it exists
          const form = element.closest('form');
          if (form) {
            form.addEventListener('submit', callback);
            
            // Monitor the parent container for interactions
            if (form.parentElement) {
              ['click', 'mousedown'].forEach(eventType => {
                form.parentElement.addEventListener(eventType, (e) => {
                  const input = this.getInputElement();
                  if (input) callback(e);
                });
              });
            }
          }
        };
        
        // Initial setup with retry
        const maxRetries = 10;
        let retryCount = 0;
        
        const trySetup = () => {
          console.log(`ChatGPT: Attempt ${retryCount + 1}/${maxRetries} to find input`);
          const textArea = this.getInputElement();
          
          if (textArea) {
            setupListeners(textArea);
            
            // Try to manually trigger the reminder after successful setup
            console.log('ChatGPT: Trying to trigger reminder manually');
            setTimeout(callback, 500);
          } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(trySetup, 1000);
          } else {
            console.log('ChatGPT: Max retries reached, could not find input');
          }
        };
        
        // Start the setup process
        trySetup();
        
        // Global document level monitoring
        if (!document.hasAttribute('creativity-guard-monitored')) {
          document.setAttribute('creativity-guard-monitored', 'true');
          document.addEventListener('selectionchange', () => {
            const input = this.getInputElement();
            if (input) callback();
          }, true);
        }
        
        // Full document monitor for dynamic changes
        const observer = new MutationObserver(() => {
          console.log('ChatGPT: DOM mutation detected');
          const textArea = this.getInputElement();
          if (textArea) setupListeners(textArea);
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
        
        // Final fallback - periodic check
        const intervalId = setInterval(() => {
          const input = this.getInputElement();
          if (input && !input.hasAttribute('creativity-guard-monitored')) {
            console.log('ChatGPT: Found input via interval');
            setupListeners(input);
          }
        }, 2000);
        
        // Clean up interval after 30 seconds
        setTimeout(() => clearInterval(intervalId), 30000);
      } catch (e) {
        console.error('ChatGPT: Error in monitorInput:', e);
      }
    }
  },
  'claude.ai': {
    setupReminder: function(inputElement, host) {
      const container = inputElement.closest('.cl-text-container');
      if (container) {
        container.insertBefore(host, container.firstChild);
        return true;
      }
      return false;
    },
    getInputElement: function() {
      return document.querySelector('[contenteditable="true"]');
    },
    monitorInput: function(callback) {
      const input = this.getInputElement();
      if (input) {
        input.addEventListener('focus', callback);
        input.addEventListener('input', callback);
      }
    }
  },
  'typingmind.com': {
    setupReminder: function(inputElement, host) {
      try {
        console.log('TypingMind: Setting up reminder...');
        
        // Find the best container (more reliable positioning)
        const chatbox = document.querySelector('.chat-box') || document.querySelector('.chatbox');
        if (chatbox) {
          console.log('TypingMind: Found chat-box container');
          chatbox.insertBefore(host, chatbox.firstChild);
          return true;
        }
        
        // Try to find editor container
        const editorContainer = document.querySelector('.absolute.bottom-0') || 
                               document.querySelector('.CodeMirror') ||
                               document.querySelector('[class*="editor"]');
        
        if (editorContainer) {
          console.log('TypingMind: Found editor container');
          editorContainer.parentElement.insertBefore(host, editorContainer);
          return true;
        }
        
        // Final fallback
        if (inputElement && inputElement.parentElement) {
          console.log('TypingMind: Using fallback insertion');
          inputElement.parentElement.insertBefore(host, inputElement);
          return true;
        }
        
        console.log('TypingMind: Could not find suitable container');
        return false;
      } catch (e) {
        console.error('TypingMind: Error in setup:', e);
        return false;
      }
    },
    getInputElement: function() {
      try {
        // Try specific selectors for TypingMind
        console.log('TypingMind: Finding input element...');
        
        // Try CodeMirror specific elements
        const cmContent = document.querySelector('.cm-content');
        if (cmContent) {
          console.log('TypingMind: Found cm-content');
          return cmContent;
        }
        
        // Try visible contenteditable divs
        const editables = document.querySelectorAll('[contenteditable="true"]');
        if (editables.length > 0) {
          for (const editable of editables) {
            if (editable.offsetWidth > 0 && editable.offsetHeight > 0) {
              console.log('TypingMind: Found visible contenteditable');
              return editable;
            }
          }
        }
        
        // Try any textareas
        const textareas = document.querySelectorAll('textarea');
        if (textareas.length > 0) {
          for (const textarea of textareas) {
            if (textarea.offsetWidth > 0 && textarea.offsetHeight > 0) {
              console.log('TypingMind: Found visible textarea');
              return textarea;
            }
          }
        }
        
        // Fallback to any input field
        const inputs = document.querySelectorAll('input[type="text"]');
        if (inputs.length > 0) {
          for (const input of inputs) {
            if (input.offsetWidth > 0 && input.offsetHeight > 0) {
              console.log('TypingMind: Found visible input');
              return input;
            }
          }
        }
        
        console.log('TypingMind: No input element found');
        return null;
      } catch (e) {
        console.error('TypingMind: Error finding input:', e);
        return null;
      }
    },
    monitorInput: function(callback) {
      try {
        console.log('TypingMind: Setting up input monitoring');
        
        // Function to set up event listeners
        const setupListeners = (element) => {
          if (!element || element.hasAttribute('creativity-guard-monitored')) return;
          
          console.log('TypingMind: Setting up listeners for', element);
          element.setAttribute('creativity-guard-monitored', 'true');
          
          // Use all event types that might trigger when user interacts
          ['focus', 'click', 'input', 'keydown', 'mousedown'].forEach(eventType => {
            element.addEventListener(eventType, (e) => {
              console.log(`TypingMind: ${eventType} event triggered`);
              callback(e);
            });
          });
        };
        
        // Initial setup with longer retry window
        const maxRetries = 10;
        let retryCount = 0;
        
        const trySetup = () => {
          console.log(`TypingMind: Attempt ${retryCount + 1}/${maxRetries} to find input`);
          const input = this.getInputElement();
          
          if (input) {
            setupListeners(input);
            
            // Also monitor the editor wrapper
            const editorWrappers = [
              input.closest('.cm-editor'),
              input.closest('.CodeMirror'),
              document.querySelector('.chat-box'),
              document.querySelector('[class*="editor"]')
            ];
            
            editorWrappers.forEach(wrapper => {
              if (wrapper && !wrapper.hasAttribute('creativity-guard-monitored')) {
                console.log('TypingMind: Setting up wrapper listeners');
                wrapper.setAttribute('creativity-guard-monitored', 'true');
                
                ['click', 'mousedown', 'focus'].forEach(eventType => {
                  wrapper.addEventListener(eventType, callback);
                });
              }
            });
            
            // Try to manually trigger the reminder after successful setup
            console.log('TypingMind: Trying to trigger reminder manually');
            setTimeout(callback, 500);
          } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(trySetup, 1000);
          } else {
            console.log('TypingMind: Max retries reached, could not find input');
          }
        };
        
        // Start the setup process
        trySetup();
        
        // Set up general document event capture to catch any interactions
        if (!document.hasAttribute('creativity-guard-monitored')) {
          document.setAttribute('creativity-guard-monitored', 'true');
          document.addEventListener('selectionchange', () => {
            console.log('TypingMind: Selection changed, checking input');
            const input = this.getInputElement();
            if (input) callback();
          }, true);
        }
        
        // More aggressive mutation observer
        const observer = new MutationObserver((mutations) => {
          console.log('TypingMind: DOM mutation detected');
          const input = this.getInputElement();
          if (input) setupListeners(input);
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
        
        // Final fallback - check periodically
        const intervalId = setInterval(() => {
          const input = this.getInputElement();
          if (input && !input.hasAttribute('creativity-guard-monitored')) {
            console.log('TypingMind: Detected input via interval');
            setupListeners(input);
          }
        }, 2000);
        
        // Clean up interval after 30 seconds
        setTimeout(() => clearInterval(intervalId), 30000);
      } catch (e) {
        console.error('TypingMind: Error in monitor setup:', e);
      }
    }
  }
};

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
          margin-bottom: 10px;
          z-index: 1000;
        }
        #creativity-guard-reminder .reminder {
          background: #f8f9fa;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          width: 100%;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        #creativity-guard-reminder .reminder-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        #creativity-guard-reminder .reminder-title {
          font-weight: bold;
          color: #333;
          margin: 0;
        }
        #creativity-guard-reminder .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
          font-size: 16px;
          padding: 4px;
          margin: -4px;
        }
        #creativity-guard-reminder .reminder-content {
          margin-bottom: 12px;
        }
        #creativity-guard-reminder .suggestion {
          font-style: italic;
          color: #666;
          margin: 8px 0;
          font-size: 13px;
        }
        #creativity-guard-reminder .buttons {
          display: flex;
          gap: 8px;
        }
        #creativity-guard-reminder button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }
        #creativity-guard-reminder #proceed {
          background: #0a66c2;
          color: white;
        }
        #creativity-guard-reminder #proceed:hover {
          background: #084e96;
        }
        #creativity-guard-reminder #skip {
          background: #e0e0e0;
          color: #333;
        }
        #creativity-guard-reminder #skip:hover {
          background: #d0d0d0;
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
    closeButton.onclick = () => {
      stats.bypassCount++;
      saveStats();
      host.remove();
    };
    
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
    proceedButton.onclick = () => {
      stats.thoughtFirstCount++;
      saveStats();
      host.remove();
    };
    
    const skipButton = document.createElement('button');
    skipButton.id = 'skip';
    skipButton.textContent = 'Skip';
    skipButton.onclick = () => {
      stats.bypassCount++;
      saveStats();
      host.remove();
    };
    
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
      if (inputElement.parentElement) {
        inputElement.parentElement.insertBefore(host, inputElement);
      } else {
        document.body.appendChild(host);
      }
    }
    
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
    
    // Determine which site we're on
    const currentSite = Object.keys(siteHandlers).find(site => window.location.hostname.includes(site));
    console.log('Detected site:', currentSite);
    
    if (!currentSite) {
      console.log('Not on a supported AI site');
      return;
    }
    
    console.log(`Initializing for ${currentSite}`);
    const handler = siteHandlers[currentSite];
    
    // Track chats where modal has been shown
    const shownInChats = new Set();
    
    // Function to get current chat ID
    function getCurrentChatId() {
      try {
        // For ChatGPT, use the conversation ID from URL
        if (currentSite === 'chat.openai.com') {
          const match = window.location.pathname.match(/\/c\/([\w-]+)/);
          return match ? match[1] : window.location.pathname;
        }
        // For other platforms, use the full pathname as the ID
        return window.location.pathname;
      } catch (e) {
        console.error('Error getting chat ID:', e);
        return window.location.pathname;
      }
    }
    
    // Function to check if this is a new chat context
    function isNewChatContext() {
      try {
        const inputElement = handler.getInputElement();
        if (!inputElement) return false;
        
        // Get current input content
        const currentInputContent = inputElement.value || inputElement.textContent || '';
        
        // Check if input was cleared (new chat started)
        return currentInputContent === '';
      } catch (e) {
        console.error('Error checking chat context:', e);
        return false;
      }
    }
    
    // Function to handle potential AI interaction
    function handleAIInteraction(event) {
      try {
        console.log(`AI interaction detected from ${event?.type || 'unknown'} event`);
        const chatId = getCurrentChatId();
        
        // Skip if already shown in this chat
        if (shownInChats.has(chatId)) {
          console.log(`Already shown reminder for chat: ${chatId}`);
          return;
        }
        
        console.log(`Showing reminder for chat: ${chatId}`);
        showReflectionModal();
        shownInChats.add(chatId);
        
        // Save updated stats to storage
        storage.get('creativityGuardStats', function(result) {
          const updatedStats = result ? result : { ...stats };
          updatedStats.aiUsageCount++;
          storage.set('creativityGuardStats', updatedStats);
          stats = updatedStats;
        });
      } catch (e) {
        console.error('Error handling AI interaction:', e);
      }
    }
    
    // Wait for DOM to be fully loaded before initializing
    function initialize() {
      // Set up input monitoring
      console.log('Setting up input monitoring...');
      handler.monitorInput(handleAIInteraction);
      
      // Monitor URL changes for new conversations in SPA
      let lastUrl = window.location.href;
      const urlObserver = new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
          console.log(`URL changed from ${lastUrl} to ${window.location.href}`);
          lastUrl = window.location.href;
          
          // Reset for new conversation
          setTimeout(() => {
            if (isNewChatContext()) {
              console.log('New chat context detected, clearing shown chats');
              shownInChats.clear();
            }
          }, 300);
        }
      });
      
      urlObserver.observe(document.body, { subtree: true, childList: true });
      
      // Check once after initialization
      setTimeout(handleAIInteraction, 1000, {type: 'init'});
      
      console.log(`Creativity Guard fully initialized for ${currentSite}`);
    }
    
    // If document is already loaded, initialize immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      console.log('Document already loaded, initializing immediately');
      initialize();
    } else {
      // Otherwise wait for DOMContentLoaded
      console.log('Waiting for DOMContentLoaded event');
      document.addEventListener('DOMContentLoaded', initialize);
    }
  } catch (error) {
    console.error('Error initializing Creativity Guard for AI sites:', error);
  }
})();

// Social media module for LinkedIn, Twitter, and Facebook
const socialMediaModule = {
  // Storage for social media stats and settings
  storage: {
    get: function(callback) {
      storage.get('socialMediaSettings', callback);
    },
    set: function(value, callback) {
      storage.set('socialMediaSettings', value, callback);
    }
  },
  
  // Default settings
  defaultSettings: {
    linkedinAllowedHour: 15, // 3 PM
    twitterAllowedHour: 15, // 3 PM
    facebookAllowedHour: 15, // 3 PM
    enabledForLinkedin: true,
    enabledForTwitter: true,
    enabledForFacebook: true,
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
          settings = this.defaultSettings;
          // Save default settings
          this.storage.set(settings);
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
      this.settings = settings || this.defaultSettings;
      // Make sure the visits object exists
      if (!this.settings.visits) {
        this.settings.visits = {};
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
    const allowedHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour : 
                       platform === 'twitter' ? this.settings.twitterAllowedHour : 
                       this.settings.facebookAllowedHour;
    
    return hour >= allowedHour;
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
    this.settings.visits[platform] = todayStr;
    // Wait for the storage operation to complete
    this.storage.set(this.settings, (success) => {
      console.log(`Visit recording ${success ? 'succeeded' : 'failed'}`);
      if (!success) {
        console.error('Failed to record visit for:', platform);
      }
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
      
      if (isWeekendDay || !isAllowedTime || hasVisited) {
        console.log('%c[Creativity Guard] Showing restriction modal', 'color: #0a66c2;');
        this.showSocialMediaModal(platform);
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
  showSocialMediaModal: function(platform) {
    try {
      // Add styles to the document if they don't exist
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
            background: white;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          #social-media-modal .content {
            max-width: 500px;
            width: 90%;
            text-align: center;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          #social-media-modal h2 {
            font-size: 24px;
            color: #1a1a1a;
            margin-bottom: 20px;
          }
          #social-media-modal p {
            font-size: 16px;
            line-height: 1.5;
            color: #4a4a4a;
            margin-bottom: 30px;
          }
          #social-media-modal .buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          #social-media-modal button {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          #social-media-modal #proceed {
            background: #0a66c2;
            color: white;
          }
          #social-media-modal #proceed:hover {
            background: #084e96;
          }
          #social-media-modal #skip {
            background: #e0e0e0;
            color: #333;
          }
          #social-media-modal #skip:hover {
            background: #d0d0d0;
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
      
      if (this.isWeekend()) {
        messageText = `It's the weekend! Consider spending time away from ${platformName}.`;
      } else if (!this.isAllowedTime(platform)) {
        messageText = `${platformName} is only available after ${allowedHour}:00. Consider focusing on deep work during the morning.`;
      } else if (this.hasVisitedToday(platform)) {
        messageText = `You've already visited ${platformName} today. Consider limiting your social media usage.`;
      }
      
      const message = document.createElement('p');
      message.textContent = messageText;
      
      const buttons = document.createElement('div');
      buttons.className = 'buttons';
      
      const proceedButton = document.createElement('button');
      proceedButton.id = 'proceed';
      proceedButton.textContent = 'Proceed Anyway';
      proceedButton.onclick = () => {
        this.sessionConsent[platform] = true;
        modal.remove();
      };
      
      const skipButton = document.createElement('button');
      skipButton.id = 'skip';
      skipButton.textContent = 'Go to Reading';
      skipButton.onclick = () => {
        modal.remove();
        window.location.href = this.settings.redirectUrl || 'https://read.readwise.io';
      };
      
      buttons.appendChild(proceedButton);
      buttons.appendChild(skipButton);
      
      content.appendChild(title);
      content.appendChild(message);
      content.appendChild(buttons);
      modal.appendChild(content);
      
      document.body.appendChild(modal);
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