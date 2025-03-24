// Load stats when popup opens
document.addEventListener('DOMContentLoaded', function() {
  // Set up tab navigation
  setupTabs();
  
  // Load AI stats
  loadAIStats();
  
  // Load social media settings
  loadSocialMediaSettings();
  
  // Set up buttons
  setupButtons();

  // Load settings when popup opens
  chrome.storage.local.get(['socialMediaSettings'], function(result) {
    const settings = result.socialMediaSettings || {
      linkedinAllowedHour: 15,
      twitterAllowedHour: 15,
      facebookAllowedHour: 15,
      enabledForLinkedin: true,
      enabledForTwitter: true,
      enabledForFacebook: true,
      redirectUrl: 'https://read.readwise.io'
    };

    // Set initial values
    document.getElementById('linkedinTime').value = formatTime(settings.linkedinAllowedHour);
    document.getElementById('twitterTime').value = formatTime(settings.twitterAllowedHour);
    document.getElementById('facebookTime').value = formatTime(settings.facebookAllowedHour);
    document.getElementById('enableLinkedin').checked = settings.enabledForLinkedin;
    document.getElementById('enableTwitter').checked = settings.enabledForTwitter;
    document.getElementById('enableFacebook').checked = settings.enabledForFacebook;
    document.getElementById('redirectUrl').value = settings.redirectUrl || 'https://read.readwise.io';
  });

  // Save settings when changed
  const saveSettings = () => {
    const linkedinTime = document.getElementById('linkedinTime').value;
    const twitterTime = document.getElementById('twitterTime').value;
    const facebookTime = document.getElementById('facebookTime').value;
    
    const settings = {
      linkedinAllowedHour: parseInt(linkedinTime.split(':')[0]),
      twitterAllowedHour: parseInt(twitterTime.split(':')[0]),
      facebookAllowedHour: parseInt(facebookTime.split(':')[0]),
      enabledForLinkedin: document.getElementById('enableLinkedin').checked,
      enabledForTwitter: document.getElementById('enableTwitter').checked,
      enabledForFacebook: document.getElementById('enableFacebook').checked,
      redirectUrl: document.getElementById('redirectUrl').value || 'https://read.readwise.io'
    };

    chrome.storage.local.set({ socialMediaSettings: settings });
  };

  // Helper function to format time
  function formatTime(hour) {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  // Add event listeners
  document.getElementById('linkedinTime').addEventListener('change', saveSettings);
  document.getElementById('twitterTime').addEventListener('change', saveSettings);
  document.getElementById('facebookTime').addEventListener('change', saveSettings);
  document.getElementById('enableLinkedin').addEventListener('change', saveSettings);
  document.getElementById('enableTwitter').addEventListener('change', saveSettings);
  document.getElementById('enableFacebook').addEventListener('change', saveSettings);
  document.getElementById('redirectUrl').addEventListener('change', saveSettings);
  document.getElementById('redirectUrl').addEventListener('input', saveSettings);
});

// Handle tab switching
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all tabs
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Add active class to clicked tab
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Load AI usage stats
function loadAIStats() {
  // Get stats from storage
  chrome.storage.local.get(['creativityGuardStats'], function(result) {
    if (result.creativityGuardStats) {
      updateStatsDisplay(result.creativityGuardStats);
    }
  });
}

// Load social media settings
function loadSocialMediaSettings() {
  chrome.storage.local.get(['socialMediaUsage'], function(result) {
    if (result.socialMediaUsage) {
      const settings = result.socialMediaUsage;
      
      // Update LinkedIn settings
      document.getElementById('enableLinkedin').checked = 
        settings.enabledForLinkedin !== undefined ? settings.enabledForLinkedin : true;
      
      if (document.getElementById('linkedinTime')) {
        document.getElementById('linkedinTime').value = 
          formatTime(settings.linkedinAllowedHour !== undefined ? settings.linkedinAllowedHour : 15);
      }
      
      // Update Twitter settings
      document.getElementById('enableTwitter').checked = 
        settings.enabledForTwitter !== undefined ? settings.enabledForTwitter : true;
      
      if (document.getElementById('twitterTime')) {
        document.getElementById('twitterTime').value = 
          formatTime(settings.twitterAllowedHour !== undefined ? settings.twitterAllowedHour : 15);
      }

      // Update Facebook settings
      if (document.getElementById('enableFacebook')) {
        document.getElementById('enableFacebook').checked = 
          settings.enabledForFacebook !== undefined ? settings.enabledForFacebook : true;
      }
      
      if (document.getElementById('facebookTime')) {
        document.getElementById('facebookTime').value = 
          formatTime(settings.facebookAllowedHour !== undefined ? settings.facebookAllowedHour : 15);
      }
    }
  });
}

// Set up all button event handlers
function setupButtons() {
  // AI stats reset button
  document.getElementById('reset-stats').addEventListener('click', function() {
    const emptyStats = {
      aiUsageCount: 0,
      bypassCount: 0,
      thoughtFirstCount: 0
    };
    
    // Save to storage
    chrome.storage.local.set({creativityGuardStats: emptyStats}, function() {
      // Update display
      updateStatsDisplay(emptyStats);
    });
  });
  
  // Social media settings save button
  document.getElementById('save-social-settings').addEventListener('click', function() {
    const settings = {
      linkedinAllowedHour: parseInt(document.getElementById('linkedinTime').value.split(':')[0]),
      twitterAllowedHour: parseInt(document.getElementById('twitterTime').value.split(':')[0]),
      facebookAllowedHour: parseInt(document.getElementById('facebookTime').value.split(':')[0]),
      enabledForLinkedin: document.getElementById('enableLinkedin').checked,
      enabledForTwitter: document.getElementById('enableTwitter').checked,
      enabledForFacebook: document.getElementById('enableFacebook').checked,
      redirectUrl: document.getElementById('redirectUrl').value || 'https://read.readwise.io',
      visits: {} // Keep visit data from existing settings
    };
    
    // Get existing visit data
    chrome.storage.local.get(['socialMediaUsage'], function(result) {
      if (result.socialMediaUsage && result.socialMediaUsage.visits) {
        settings.visits = result.socialMediaUsage.visits;
      }
      
      // Save the updated settings
      chrome.storage.local.set({socialMediaUsage: settings}, function() {
        showSaveMessage('Settings saved!');
      });
    });
  });
  
  // Reset social media visits button
  document.getElementById('reset-social-visits').addEventListener('click', function() {
    // Get existing settings
    chrome.storage.local.get(['socialMediaUsage'], function(result) {
      const settings = result.socialMediaUsage || {
        linkedinAllowedHour: 15,
        twitterAllowedHour: 15,
        enabledForLinkedin: true,
        enabledForTwitter: true
      };
      
      // Reset visits
      settings.visits = {};
      
      // Save the updated settings
      chrome.storage.local.set({socialMediaUsage: settings}, function() {
        showSaveMessage('Today\'s visits reset!');
      });
    });
  });
}

// Display confirmation message
function showSaveMessage(message) {
  const saveMsg = document.createElement('div');
  saveMsg.textContent = message;
  saveMsg.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4299e1;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  
  document.body.appendChild(saveMsg);
  
  setTimeout(() => {
    saveMsg.style.opacity = '0';
    saveMsg.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      document.body.removeChild(saveMsg);
    }, 500);
  }, 2000);
}

// Update the AI stats display
function updateStatsDisplay(stats) {
  document.getElementById('ai-usage-count').textContent = stats.aiUsageCount;
  document.getElementById('thought-first-count').textContent = stats.thoughtFirstCount;
  document.getElementById('bypass-count').textContent = stats.bypassCount;
  
  // Calculate and display ratio
  const totalInteractions = stats.thoughtFirstCount + stats.bypassCount;
  let ratio = 0;
  
  if (totalInteractions > 0) {
    ratio = Math.round((stats.thoughtFirstCount / totalInteractions) * 100);
  }
  
  document.getElementById('success-ratio').textContent = 
    `You thought first on ${ratio}% of your AI interactions`;
} 