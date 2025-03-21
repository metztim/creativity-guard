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
      chrome.storage.local.get(['creativityGuardStats'], function(result) {
        if (chrome.runtime.lastError) {
          console.error('Storage get error:', chrome.runtime.lastError);
          callback(null);
          return;
        }
        callback(result.creativityGuardStats);
      });
    } catch (e) {
      console.error('Storage get error:', e);
      callback(null);
    }
  },
  set: function(value, callback) {
    try {
      chrome.storage.local.set({creativityGuardStats: value}, function() {
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

// Create and show the modal
function showReflectionModal() {
  try {
    // Check if modal already exists
    if (document.getElementById('creativity-guard-modal')) {
      return;
    }
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'creativity-guard-modal';
    
    // Random suggestion
    const suggestion = getRandomSuggestion();
    
    // Set modal content
    modal.innerHTML = `
      <div class="creativity-guard-content">
        <h2>Wait a Moment</h2>
        <p>It looks like you're about to ask AI for help.</p>
        <p><strong>Have you spent two minutes brainstorming or writing down your own ideas first?</strong></p>
        <p class="creativity-guard-suggestion">${suggestion}</p>
        <div class="creativity-guard-buttons">
          <button id="creativity-guard-proceed">I did my own thinking: Proceed</button>
          <button id="creativity-guard-skip">Skip this check</button>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(modal);
    
    // Set up button handlers
    document.getElementById('creativity-guard-proceed').addEventListener('click', function() {
      stats.thoughtFirstCount++;
      saveStats();
      modal.remove();
    });
    
    document.getElementById('creativity-guard-skip').addEventListener('click', function() {
      stats.bypassCount++;
      saveStats();
      modal.remove();
    });
    
    // Increment AI usage attempt counter
    stats.aiUsageCount++;
    saveStats();
  } catch (e) {
    console.error('Error showing modal:', e);
  }
}

// Site-specific selectors for input areas
const siteConfigs = {
  'chat.openai.com': {
    inputSelector: '#prompt-textarea',
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
    inputSelector: '#prompt-textarea',
    newChatSelector: 'nav a',
    observeTarget: 'body'
  },
  'lex.page': {
    inputSelector: '[data-placeholder="How can I help with your writing today?"]',
    newChatSelector: '.cursor-pointer',
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

// Social media module for LinkedIn and Twitter
const socialMediaModule = {
  // Storage for social media stats and settings
  storage: {
    get: function(callback) {
      try {
        chrome.storage.local.get(['socialMediaUsage'], function(result) {
          if (chrome.runtime.lastError) {
            console.error('Social media storage get error:', chrome.runtime.lastError);
            callback(null);
            return;
          }
          callback(result.socialMediaUsage);
        });
      } catch (e) {
        console.error('Social media storage get error:', e);
        callback(null);
      }
    },
    set: function(value, callback) {
      try {
        chrome.storage.local.set({socialMediaUsage: value}, function() {
          if (chrome.runtime.lastError) {
            console.error('Social media storage set error:', chrome.runtime.lastError);
            if (callback) callback(false);
            return;
          }
          if (callback) callback(true);
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
    enabledForLinkedin: true,
    enabledForTwitter: true,
    visits: {} // Will store dates of visits
  },
  
  // Current settings
  settings: null,
  
  // Initialize the module
  init: function() {
    // Load settings and then handle the site visit after settings are loaded
    this.storage.get((settings) => {
      this.settings = settings || this.defaultSettings;
      
      // Make sure the visits object exists
      if (!this.settings.visits) {
        this.settings.visits = {};
      }
      
      // Now that settings are loaded, check if we're on a social media site
      if (window.location.hostname.includes('linkedin.com')) {
        this.handleSocialMediaSite('linkedin');
      } else if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
        this.handleSocialMediaSite('twitter');
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
    const allowedHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour : this.settings.twitterAllowedHour;
    
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
    this.settings.visits[platform] = todayStr;
    this.storage.set(this.settings);
  },
  
  // Handle social media site visit
  handleSocialMediaSite: function(platform) {
    // Check if the feature is enabled for this platform
    const isEnabled = platform === 'linkedin' ? this.settings.enabledForLinkedin : this.settings.enabledForTwitter;
    if (!isEnabled) return;
    
    // Check time and previous visits
    const isAllowedTime = this.isTimeAllowed(platform);
    const hasVisited = this.hasVisitedToday(platform);
    
    if (!isAllowedTime || hasVisited) {
      this.showSocialMediaModal(platform, isAllowedTime, hasVisited);
    } else {
      // If all checks pass, record this visit
      this.recordVisit(platform);
    }
  },
  
  // Show social media restriction modal
  showSocialMediaModal: function(platform, isAllowedTime, hasVisited) {
    try {
      // Check if modal already exists
      if (document.getElementById('social-media-guard-modal')) {
        return;
      }
      
      // Create modal container
      const modal = document.createElement('div');
      modal.id = 'social-media-guard-modal';
      
      // Determine message based on restriction reason
      let message = '';
      const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
      const allowedHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour : this.settings.twitterAllowedHour;
      
      if (!isAllowedTime && hasVisited) {
        message = `You've already visited ${platformName} today, and it's before your allowed time (${allowedHour}:00).`;
      } else if (!isAllowedTime) {
        message = `It's before your allowed ${platformName} time (${allowedHour}:00).`;
      } else if (hasVisited) {
        message = `You've already visited ${platformName} today.`;
      }
      
      // Set modal content
      modal.innerHTML = `
        <div class="creativity-guard-content">
          <h2>Digital Wellbeing Check</h2>
          <p>${message}</p>
          <p><strong>Would you like to continue anyway?</strong></p>
          <div class="creativity-guard-buttons">
            <button id="social-media-proceed">Yes, continue</button>
            <button id="social-media-skip">No, close site</button>
          </div>
        </div>
      `;
      
      // Add to page
      document.body.appendChild(modal);
      
      // Set up button handlers
      document.getElementById('social-media-proceed').addEventListener('click', () => {
        // If proceeding, record the visit
        this.recordVisit(platform);
        modal.remove();
      });
      
      document.getElementById('social-media-skip').addEventListener('click', () => {
        // Close the tab or navigate away
        window.location.href = 'https://google.com';
      });
    } catch (e) {
      console.error('Error showing social media modal:', e);
    }
  }
};

// Initialize social media module for relevant sites
try {
  if (window.location.hostname.includes('linkedin.com') || 
      window.location.hostname.includes('twitter.com') || 
      window.location.hostname.includes('x.com')) {
    socialMediaModule.init();
  }
} catch (e) {
  console.error('Error initializing social media module:', e);
} 