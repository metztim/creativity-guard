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

// Safe wrapper for chrome.storage operations
const storage = {
  get: function(callback) {
    try {
      if (!chrome?.runtime?.id) {
        console.warn('Extension context invalid, storage.get operation cancelled');
        if (callback) callback(null);
        return;
      }
      
      chrome.storage.local.get(['creativityGuardStats'], function(result) {
        if (chrome?.runtime?.lastError) {
          console.error('Storage get error:', chrome.runtime.lastError);
          if (callback) callback(null);
          return;
        }
        if (callback) callback(result.creativityGuardStats);
      });
    } catch (e) {
      console.error('Storage get error:', e);
      if (callback) callback(null);
    }
  },
  set: function(value, callback) {
    try {
      if (!chrome?.runtime?.id) {
        console.warn('Extension context invalid, storage.set operation cancelled');
        if (callback) callback(false);
        return;
      }
      
      chrome.storage.local.set({creativityGuardStats: value}, function() {
        if (chrome?.runtime?.lastError) {
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

// Load saved stats
function loadStats() {
  storage.get(function(savedStats) {
    if (savedStats) {
      stats = savedStats;
    }
  });
}

// Save stats
function saveStats() {
  storage.set(stats);
}

// Initialize stats
loadStats();

// Get a random suggestion
function getRandomSuggestion() {
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// Create and show the reminder
function showReflectionModal() {
  try {
    // Check if reminder already exists
    if (document.getElementById('creativity-guard-reminder')) {
      return;
    }
    
    // Get the input element for the current site
    const currentSite = Object.keys(siteConfigs).find(site => window.location.hostname.includes(site));
    const config = currentSite ? siteConfigs[currentSite] : null;
    
    if (!config) return;
    
    const inputElement = document.querySelector(config.inputSelector);
    if (!inputElement) return;
    
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
    
    // Different positioning based on the site
    if (currentSite === 'chat.openai.com' || currentSite === 'chatgpt.com') {
      // Find the main form container
      const mainContainer = document.querySelector('form');
      if (mainContainer) {
        mainContainer.insertBefore(host, mainContainer.firstChild);
      } else {
        // Fallback to the closest parent with a role
        const container = inputElement.closest('[role="presentation"]');
        if (container) {
          container.insertBefore(host, container.firstChild);
        } else {
          // Last resort: insert before the input
          inputElement.parentElement.insertBefore(host, inputElement);
        }
      }
    } else {
      // For other sites, insert before the input
      inputElement.parentElement.insertBefore(host, inputElement);
    }
    
    // Increment AI usage attempt counter
    stats.aiUsageCount++;
    saveStats();
  } catch (e) {
    console.error('Error showing reminder:', e);
  }
}

// Site-specific selectors for input areas
const siteConfigs = {
  'chat.openai.com': {
    inputSelector: '#prompt-textarea, .w-full.resize-none.focus-within\\:border-0',
    checkFunc: function(event) {
      // For ChatGPT we want to check when the textarea gets focus or when a key is pressed
      return event.type === 'focus' || event.type === 'keydown';
    },
    newChatSelector: 'nav a',
    observeTarget: 'body'
  },
  'claude.ai': {
    inputSelector: '[contenteditable="true"]',
    newChatSelector: 'nav a',
    observeTarget: 'body'
  },
  'bard.google.com': {
    inputSelector: 'textarea',
    newChatSelector: 'button',
    observeTarget: 'body'
  },
  'gemini.google.com': {
    inputSelector: 'textarea',
    newChatSelector: 'button',
    observeTarget: 'body'
  },
  'poe.com': {
    inputSelector: 'textarea',
    newChatSelector: 'nav a',
    observeTarget: 'body'
  },
  'typingmind.com': {
    inputSelector: 'textarea',
    newChatSelector: 'button',
    observeTarget: 'body'
  },
  'chatgpt.com': {
    inputSelector: '#prompt-textarea, .w-full.resize-none.focus-within\\:border-0',
    checkFunc: function(event) {
      // Same as chat.openai.com
      return event.type === 'focus' || event.type === 'keydown';
    },
    newChatSelector: 'nav a',
    observeTarget: 'body'
  },
  'lex.page': {
    inputSelector: '[data-placeholder="How can I help with your writing today?"]',
    newChatSelector: '.cursor-pointer',
    observeTarget: 'body'
  },
  'facebook.com': {
    inputSelector: '[contenteditable="true"]',
    newChatSelector: 'a',
    observeTarget: 'body'
  }
};

try {
  // Determine which site we're on
  const currentSite = Object.keys(siteConfigs).find(site => window.location.hostname.includes(site));
  const config = currentSite ? siteConfigs[currentSite] : null;

  if (config) {
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
        const inputElements = document.querySelectorAll(config.inputSelector);
        let currentInputContent = '';
        
        // Get current input content
        inputElements.forEach(input => {
          currentInputContent += input.value || input.textContent || '';
        });
        
        // Check if input was cleared (new chat started)
        return currentInputContent === '';
      } catch (e) {
        console.error('Error checking chat context:', e);
        return false;
      }
    }
    
    // Function to set up input monitoring
    function setupInputMonitoring() {
      try {
        const inputElements = document.querySelectorAll(config.inputSelector);
        
        inputElements.forEach(inputElement => {
          if (!inputElement.hasAttribute('creativity-guard-monitored')) {
            // Mark this element as monitored
            inputElement.setAttribute('creativity-guard-monitored', 'true');
            
            // Show modal only when user starts typing
            const showModalIfNeeded = (event) => {
              try {
                // Only proceed if this is an input event (typing)
                if (event.type !== 'input') return;
                
                const chatId = getCurrentChatId();
                
                // If we've already shown the modal in this chat, don't show it again
                if (shownInChats.has(chatId)) return;
                
                // Show modal if user is typing and we haven't shown it in this chat
                if (inputElement.value || inputElement.textContent) {
                  showReflectionModal();
                  shownInChats.add(chatId);
                }
              } catch (e) {
                console.error('Error in showModalIfNeeded:', e);
              }
            };
            
            // Only listen for input events (typing)
            inputElement.addEventListener('input', showModalIfNeeded);
          }
        });
      } catch (e) {
        console.error('Error in setupInputMonitoring:', e);
      }
    }
    
    // Check for input element immediately
    setupInputMonitoring();
    
    // Set up observer to monitor for changes
    try {
      const observer = new MutationObserver(function(mutations) {
        setupInputMonitoring();
      });
      
      // Start observing with more specific options
      const observeTarget = document.querySelector(config.observeTarget);
      if (observeTarget) {
        observer.observe(observeTarget, { 
          childList: true, 
          subtree: true,
          attributes: true,
          characterData: true
        });
      }
    } catch (e) {
      console.error('Error setting up observer:', e);
    }
    
    // Additional periodic check for dynamically loaded elements
    setInterval(setupInputMonitoring, 2000);
    
    // Watch for navigation events to handle SPA navigation
    try {
      window.addEventListener('popstate', function() {
        const chatId = getCurrentChatId();
        if (!shownInChats.has(chatId)) {
          // Reset for new chat
          shownInChats.delete(chatId);
        }
      });
    } catch (e) {
      console.error('Error setting up navigation listener:', e);
    }
  }
} catch (e) {
  console.error('Error in main extension code:', e);
}

// Social media module for LinkedIn, Twitter, and Facebook
const socialMediaModule = {
  // Storage for social media stats and settings
  storage: {
    get: function(callback) {
      try {
        if (!chrome?.runtime?.id) {
          console.warn('Extension context invalid, social media storage.get operation cancelled');
          if (callback) callback(null);
          return;
        }
        
        chrome.runtime.sendMessage({ type: 'GET_SOCIAL_MEDIA_SETTINGS' }, (response) => {
          if (chrome?.runtime?.lastError) {
            console.error('Social media storage get error:', chrome.runtime.lastError);
            if (callback) callback(null);
            return;
          }
          if (callback) callback(response);
        });
      } catch (e) {
        console.error('Social media storage get error:', e);
        if (callback) callback(null);
      }
    },
    set: function(value, callback) {
      try {
        if (!chrome?.runtime?.id) {
          console.warn('Extension context invalid, social media storage.set operation cancelled');
          if (callback) callback(false);
          return;
        }
        
        chrome.runtime.sendMessage({ 
          type: 'SET_SOCIAL_MEDIA_SETTINGS',
          settings: value
        }, (response) => {
          if (chrome?.runtime?.lastError) {
            console.error('Social media storage set error:', chrome.runtime.lastError);
            if (callback) callback(false);
            return;
          }
          if (callback) callback(response && response.success);
        });
      } catch (e) {
        console.error('Social media storage set error:', e);
        if (callback) callback(false);
      }
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
  isTimeAllowed: function(platform) {
    const now = new Date();
    const hour = now.getHours();
    const allowedHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour : platform === 'twitter' ? this.settings.twitterAllowedHour : this.settings.facebookAllowedHour;
    
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
      const isEnabled = platform === 'linkedin' ? this.settings.enabledForLinkedin : platform === 'twitter' ? this.settings.enabledForTwitter : this.settings.enabledForFacebook;
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
      const isAllowedTime = this.isTimeAllowed(platform);
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