// Suggestions for pre-work before using AI
const suggestions = [
  "Sketch a rough outline on a piece of paper.",
  "Open a blank document and list three bullet points of your own ideas.",
  "Record a quick voice memo with your first thoughts.",
  "Draw a quick mindmap of related concepts.",
  "Write down the problem you're trying to solve in your own words."
];

// Stats tracking
let stats = {
  aiUsageCount: 0,
  bypassCount: 0,
  thoughtFirstCount: 0
};

// Load saved stats
chrome.storage.local.get(['creativityGuardStats'], function(result) {
  if (result.creativityGuardStats) {
    stats = result.creativityGuardStats;
  }
});

// Save stats
function saveStats() {
  chrome.storage.local.set({creativityGuardStats: stats});
}

// Get a random suggestion
function getRandomSuggestion() {
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// Create and show the modal
function showReflectionModal() {
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
  }
};

// Determine which site we're on
const currentSite = Object.keys(siteConfigs).find(site => window.location.hostname.includes(site));
const config = currentSite ? siteConfigs[currentSite] : null;

if (config) {
  // Flag to track if modal has been shown in this session
  let modalShownThisSession = false;
  
  // Function to set up input monitoring
  function setupInputMonitoring() {
    const inputElements = document.querySelectorAll(config.inputSelector);
    console.log('Found input elements:', inputElements.length);
    
    inputElements.forEach(inputElement => {
      if (!inputElement.hasAttribute('creativity-guard-monitored')) {
        // Mark this element as monitored
        inputElement.setAttribute('creativity-guard-monitored', 'true');
        console.log('Monitoring element:', inputElement);
        
        // Show modal when user interacts with input
        const showModalIfNeeded = () => {
          if (!modalShownThisSession) {
            console.log('Showing modal');
            showReflectionModal();
            modalShownThisSession = true;
          }
        };
        
        // Multiple event listeners for different types of interaction
        inputElement.addEventListener('focus', showModalIfNeeded);
        inputElement.addEventListener('click', showModalIfNeeded);
        inputElement.addEventListener('input', showModalIfNeeded);
      }
    });
    
    // Reset modal flag when starting a new chat
    const newChatElements = document.querySelectorAll(config.newChatSelector);
    newChatElements.forEach(element => {
      element.addEventListener('click', function() {
        setTimeout(() => {
          console.log('Resetting modal flag');
          modalShownThisSession = false;
        }, 1000);
      });
    });
  }
  
  // Check for input element immediately
  setupInputMonitoring();
  
  // Set up observer to monitor for changes
  const observer = new MutationObserver(function(mutations) {
    setupInputMonitoring();
  });
  
  // Start observing with more specific options
  const observeTarget = document.querySelector(config.observeTarget);
  if (observeTarget) {
    observer.observe(observeTarget, { 
      childList: true, 
      subtree: true,
      attributes: true
    });
  }
  
  // Additional periodic check for dynamically loaded elements
  setInterval(setupInputMonitoring, 2000);
} 