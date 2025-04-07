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
        // Add specific logging for invalid context
        console.warn('Storage context invalid, initiating retry...');
        retry();
        return;
      }
      
      chrome.storage.local.get([key], function(result) {
        try {
          if (chrome?.runtime?.lastError) {
            // Log the specific lastError message
            console.error('Storage get error:', chrome.runtime.lastError.message || chrome.runtime.lastError);
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
      console.error('Error calling storage get:', e); // Renamed log for clarity
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
      // This is much simpler - we're not actually using this for triggering
      // but we need to return something for compatibility
      return document.querySelector('textarea') || document.querySelector('form');
    },
    
    monitorInput: function(callback) {
      // Skip all the complex event handling - just call the callback immediately
      // to show the reminder as soon as the page loads
      console.log('ChatGPT: Triggering reminder immediately');
      setTimeout(callback, 1000);
    }
  },
  'chatgpt.com': {
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
      // This is much simpler - we're not actually using this for triggering
      // but we need to return something for compatibility
      return document.querySelector('textarea') || document.querySelector('form');
    },
    
    monitorInput: function(callback) {
      // Skip all the complex event handling - just call the callback immediately
      // to show the reminder as soon as the page loads
      console.log('ChatGPT: Triggering reminder immediately');
      setTimeout(callback, 1000);
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
      
      urlObserver.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true
      });
      
      // Call the callback to show the reminder immediately for new chat
      setTimeout(callback, 500);
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
      setTimeout(callback, 1000);
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
          }
          
          // For Claude, handle /new path and conversation IDs
          if (currentSite === 'claude.ai') {
            if (window.location.pathname === '/new' || window.location.pathname === '/') {
              return 'new-conversation';
            }
            const claudeMatch = window.location.pathname.match(/\/chat\/([\w-]+)/);
            if (claudeMatch) {
              return claudeMatch[1];
            }
          }
          
          // For other platforms, use the full pathname as the ID
          return window.location.pathname;
        } catch (e) {
          console.error('Error getting chat ID:', e);
          return window.location.pathname;
        }
      }
      
      // Function to check if this is a new conversation by examining URL and page elements
      function isNewConversation() {
        try {
          const currentPath = window.location.pathname;
          const currentUrl = window.location.href;
          
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
          setTimeout(() => {
            if (isNewConversation()) {
              console.log('URL change detected to a new conversation page');
              handleAIInteraction({ type: 'url-change' });
            } else {
              console.log('URL change detected but not a new conversation');
            }
          }, 500);
        }
      });
      
      urlObserver.observe(document.body, { subtree: true, childList: true });
      
      // Check once after initialization with a more specific delay
      setTimeout(() => {
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
            setTimeout(() => {
              if (!shownInChatsForSession.has(getCurrentChatId()) && isNewConversation()) {
                console.log(`Retry ${delay}ms: Checking for new conversation`);
                handleAIInteraction({ type: 'retry' });
              }
            }, delay);
          });
        }
      }, 1500);
      
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
      
      // Also try again after a short delay if the load event doesn't fire
      setTimeout(() => {
        if (document.readyState === 'complete' && !window.aiSiteHandlersInitialized) {
          console.log('Initializing after delay');
          startInit();
        }
      }, 2000);
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
      
      // --- Determine Message Text ---
      if (isVacationMode) {
        messageText = `Vacation Mode is active. ${platformName} access is currently restricted to help you disconnect. You can turn off Vacation Mode in the extension settings.`;
      } else {
        // Original logic for weekend/time/visit checks
        const isWeekendDay = this.isWeekend();
        const isTotalWeekendBlock = isWeekendDay && (this.settings.totalWeekendBlock !== undefined ? this.settings.totalWeekendBlock : true);

        if (isTotalWeekendBlock) { // Renamed isWeekendDay to isTotalWeekendBlock for clarity here
          messageText = `It's the weekend! ${platformName} access is currently blocked to help you disconnect. You can change this in extension settings.`;
        } else if (!this.isAllowedTime(platform)) {
          messageText = `${platformName} is only available after ${allowedHour}:00. Consider focusing on deep work during the morning.`;
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
      const isWeekendDayForButton = this.isWeekend();
      const isTotalWeekendBlockForButton = isWeekendDayForButton && (this.settings.totalWeekendBlock !== undefined ? this.settings.totalWeekendBlock : true);
      const allowProceed = !isVacationMode && !isTotalWeekendBlockForButton;

      if (allowProceed) {
        const proceedButton = document.createElement('button');
        proceedButton.id = 'proceed';
        proceedButton.textContent = 'Proceed Anyway';
        proceedButton.onclick = () => {
          this.sessionConsent[platform] = true;
          modal.remove();
        };
        buttons.appendChild(proceedButton);
      }
      
      const skipButton = document.createElement('button');
      skipButton.id = 'skip';
      skipButton.textContent = 'Go to Reading';
      skipButton.onclick = () => {
        modal.remove();
        window.location.href = this.settings.redirectUrl || 'https://read.readwise.io';
      };
      
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