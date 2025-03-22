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
      if (!chrome.runtime?.id) {
        console.warn('Extension context invalid, storage.get operation cancelled');
        callback(null);
        return;
      }
      
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
      if (!chrome.runtime?.id) {
        console.warn('Extension context invalid, storage.set operation cancelled');
        if (callback) callback(false);
        return;
      }
      
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
    
    // Create a host element for the shadow DOM
    const host = document.createElement('div');
    host.id = 'creativity-guard-reminder';
    
    // Position the reminder relative to the input
    const inputRect = inputElement.getBoundingClientRect();
    
    // Create a shadow root
    const shadow = host.attachShadow({ mode: 'closed' });
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .reminder {
        position: absolute;
        background: #f8f9fa;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px 15px;
        width: calc(100% - 20px);
        max-width: 600px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        z-index: 999;
        margin-bottom: 8px;
        animation: fadeIn 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .reminder-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      
      .reminder-title {
        font-weight: bold;
        color: #333;
        margin: 0;
      }
      
      .close-button {
        background: none;
        border: none;
        cursor: pointer;
        color: #888;
        font-size: 16px;
        padding: 0;
        margin: 0;
      }
      
      .reminder-content {
        margin-bottom: 8px;
      }
      
      .suggestion {
        font-style: italic;
        color: #666;
        margin: 5px 0;
        font-size: 13px;
      }
      
      .buttons {
        display: flex;
        gap: 8px;
      }
      
      button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        transition: background 0.2s;
      }
      
      #proceed {
        background: #0a66c2;
        color: white;
      }
      
      #proceed:hover {
        background: #0955a3;
      }
      
      #skip {
        background: #e0e0e0;
        color: #333;
      }
      
      #skip:hover {
        background: #d0d0d0;
      }
    `;
    
    // Create reminder container
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
    
    // Add to shadow DOM
    shadow.appendChild(style);
    shadow.appendChild(reminder);
    
    // Position and append the reminder to the page
    host.style.position = 'relative';
    host.style.width = `${inputElement.offsetWidth}px`;
    host.style.zIndex = '9999';
    host.style.marginBottom = '10px';
    
    // Different positioning based on the site
    if (currentSite === 'chat.openai.com' || currentSite === 'chatgpt.com') {
      // ChatGPT has a specific layout
      const formParent = inputElement.closest('form');
      if (formParent) {
        const formWrapper = formParent.parentElement;
        if (formWrapper) {
          formWrapper.style.position = 'relative';
          formWrapper.insertBefore(host, formParent);
        } else {
          formParent.insertBefore(host, formParent.firstChild);
        }
      } else {
        // Fallback insertion
        const container = inputElement.closest('div[role="presentation"]');
        if (container) {
          container.style.position = 'relative';
          container.insertBefore(host, container.firstChild);
        } else {
          // Last resort fallback
          const parent = inputElement.parentElement;
          if (parent) {
            parent.style.position = 'relative';
            parent.insertBefore(host, inputElement);
          }
        }
      }
    } else if (currentSite === 'claude.ai') {
      // Claude has a specific layout
      const containerDiv = inputElement.closest('.cl-text-container');
      if (containerDiv) {
        containerDiv.insertBefore(host, containerDiv.firstChild);
      } else {
        // Fallback insertion
        inputElement.parentNode.insertBefore(host, inputElement);
      }
    } else {
      // Generic insertion before the input element
      inputElement.parentNode.insertBefore(host, inputElement);
    }
    
    // Increment AI usage attempt counter
    stats.aiUsageCount++;
    saveStats();
  } catch (e) {
    console.error('%c[Creativity Guard] Error showing reminder:', 'color: #ff0000;', e);
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
        if (!chrome.runtime?.id) {
          console.warn('Extension context invalid, social media storage.get operation cancelled');
          callback(null);
          return;
        }
        
        chrome.runtime.sendMessage({ type: 'GET_SOCIAL_MEDIA_SETTINGS' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Social media storage get error:', chrome.runtime.lastError);
            callback(null);
            return;
          }
          callback(response);
        });
      } catch (e) {
        console.error('Social media storage get error:', e);
        callback(null);
      }
    },
    set: function(value, callback) {
      try {
        if (!chrome.runtime?.id) {
          console.warn('Extension context invalid, social media storage.set operation cancelled');
          if (callback) callback(false);
          return;
        }
        
        chrome.runtime.sendMessage({ 
          type: 'SET_SOCIAL_MEDIA_SETTINGS',
          settings: value
        }, (response) => {
          if (chrome.runtime.lastError) {
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
        this.showSocialMediaModal(platform, isAllowedTime, hasVisited, isWeekendDay);
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
  showSocialMediaModal: function(platform, isAllowedTime, hasVisited, isWeekend) {
    try {
      // Check if modal already exists
      if (document.getElementById('social-media-guard-host')) {
        return;
      }
      
      // Create a host element for the shadow DOM
      const host = document.createElement('div');
      host.id = 'social-media-guard-host';
      
      // Create a shadow root
      const shadow = host.attachShadow({ mode: 'closed' });
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        #modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          padding: 40px;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .content {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        h2 {
          margin-top: 0;
          color: #333;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .buttons {
          display: flex;
          gap: 10px;
          margin-top: 30px;
          justify-content: center;
        }
        button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        #proceed {
          background: #0a66c2;
          color: white;
        }
        #proceed:hover {
          background: #084e96;
        }
        #skip {
          background: #e0e0e0;
          color: #333;
        }
        #skip:hover {
          background: #d0d0d0;
        }
        #overlay {
          display: none;
        }
      `;
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'overlay';
      
      // Create modal container
      const modal = document.createElement('div');
      modal.id = 'modal';
      
      // Create content container
      const content = document.createElement('div');
      content.className = 'content';
      
      // Create header
      const header = document.createElement('h2');
      header.textContent = 'Digital Wellbeing Check';
      content.appendChild(header);
      
      // Determine message based on restriction reason
      let messageText = '';
      const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
      const allowedHour = platform === 'linkedin' ? this.settings.linkedinAllowedHour : platform === 'twitter' ? this.settings.twitterAllowedHour : this.settings.facebookAllowedHour;
      
      if (isWeekend) {
        messageText = `${platformName} is blocked on weekends to promote digital wellbeing.`;
      } else if (!isAllowedTime && hasVisited) {
        messageText = `You've already visited ${platformName} today, and it's before your allowed time (${allowedHour}:00).`;
      } else if (!isAllowedTime) {
        messageText = `It's before your allowed ${platformName} time (${allowedHour}:00).`;
      } else if (hasVisited) {
        messageText = `You've already visited ${platformName} today.`;
      }
      
      // Create message paragraph
      const message = document.createElement('p');
      message.textContent = messageText;
      content.appendChild(message);
      
      // Create question paragraph
      const question = document.createElement('p');
      question.innerHTML = '<strong>Would you like to continue anyway?</strong>';
      content.appendChild(question);
      
      // Create buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'buttons';
      
      // Create proceed button
      const proceedButton = document.createElement('button');
      proceedButton.id = 'proceed';
      proceedButton.textContent = 'Yes, continue';
      proceedButton.onclick = () => {
        // Record visit and set session consent
        this.recordVisit(platform);
        this.sessionConsent[platform] = true;
        host.remove();
      };
      
      // Create skip button
      const skipButton = document.createElement('button');
      skipButton.id = 'skip';
      skipButton.textContent = 'No, close site';
      skipButton.onclick = () => {
        window.location.href = 'https://google.com';
      };
      
      // Add buttons to container
      buttonsContainer.appendChild(proceedButton);
      buttonsContainer.appendChild(skipButton);
      content.appendChild(buttonsContainer);
      
      // Add everything to the shadow DOM
      modal.appendChild(content);
      shadow.appendChild(style);
      shadow.appendChild(overlay);
      shadow.appendChild(modal);
      
      // Add to page
      document.body.appendChild(host);
    } catch (e) {
      console.error('%c[Creativity Guard] Error showing social media modal:', 'color: #ff0000;', e);
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