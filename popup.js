// Helper functions for time conversion
function formatTime(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function parseTime(timeString) {
  if (!timeString) return 15; // Default to 3 PM if empty
  const parts = timeString.split(':');
  return parseInt(parts[0], 10);
}

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
      allowedEndHour: 19,
      enabledForLinkedin: true,
      enabledForTwitter: true,
      enabledForFacebook: true,
      totalWeekendBlock: true,
      redirectUrl: 'https://read.readwise.io'
    };

    // Set initial values
    document.getElementById('linkedinTime').value = formatTime(settings.linkedinAllowedHour);
    document.getElementById('twitterTime').value = formatTime(settings.twitterAllowedHour);
    document.getElementById('facebookTime').value = formatTime(settings.facebookAllowedHour);
    document.getElementById('allowedEndTime').value = formatTime(settings.allowedEndHour);
    document.getElementById('enableLinkedin').checked = settings.enabledForLinkedin;
    document.getElementById('enableTwitter').checked = settings.enabledForTwitter;
    document.getElementById('enableFacebook').checked = settings.enabledForFacebook;
    document.getElementById('totalWeekendBlock').checked = settings.totalWeekendBlock !== undefined ? settings.totalWeekendBlock : true;
    document.getElementById('redirectUrl').value = settings.redirectUrl || 'https://read.readwise.io';
  });

  // Save settings when changed
  const saveSettings = () => {
    const linkedinTime = document.getElementById('linkedinTime').value;
    const twitterTime = document.getElementById('twitterTime').value;
    const facebookTime = document.getElementById('facebookTime').value;
    const endTime = document.getElementById('allowedEndTime').value;
    
    const settings = {
      linkedinAllowedHour: parseInt(linkedinTime.split(':')[0]),
      twitterAllowedHour: parseInt(twitterTime.split(':')[0]),
      facebookAllowedHour: parseInt(facebookTime.split(':')[0]),
      allowedEndHour: parseInt(endTime.split(':')[0]),
      enabledForLinkedin: document.getElementById('enableLinkedin').checked,
      enabledForTwitter: document.getElementById('enableTwitter').checked,
      enabledForFacebook: document.getElementById('enableFacebook').checked,
      totalWeekendBlock: document.getElementById('totalWeekendBlock').checked,
      redirectUrl: document.getElementById('redirectUrl').value || 'https://read.readwise.io'
    };

    chrome.storage.local.set({ socialMediaSettings: settings });
  };

  // Add event listeners
  document.getElementById('linkedinTime').addEventListener('change', saveSettings);
  document.getElementById('twitterTime').addEventListener('change', saveSettings);
  document.getElementById('facebookTime').addEventListener('change', saveSettings);
  document.getElementById('allowedEndTime').addEventListener('change', saveSettings);
  document.getElementById('enableLinkedin').addEventListener('change', saveSettings);
  document.getElementById('enableTwitter').addEventListener('change', saveSettings);
  document.getElementById('enableFacebook').addEventListener('change', saveSettings);
  document.getElementById('totalWeekendBlock').addEventListener('change', saveSettings);
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
  chrome.runtime.sendMessage({ type: 'GET_SOCIAL_MEDIA_SETTINGS' }, (settings) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting social media settings:', chrome.runtime.lastError);
      return;
    }
    // Ensure settings is an object, even if null/undefined is returned
    settings = settings || {}; 
    
    // Set default values if they don't exist
    const defaults = {
      linkedinAllowedHour: 15,
      twitterAllowedHour: 15,
      facebookAllowedHour: 15,
      allowedEndHour: 19, // 7 PM - end of allowed time window
      enabledForLinkedin: true,
      enabledForTwitter: true,
      enabledForFacebook: true,
      totalWeekendBlock: true,
      vacationModeEnabled: false, // Added default
      redirectUrl: 'https://read.readwise.io',
    };
    
    settings = { ...defaults, ...settings }; // Merge defaults with loaded settings
    
    // Update UI elements
    document.getElementById('enableLinkedin').checked = settings.enabledForLinkedin;
    document.getElementById('linkedinTime').value = formatTime(settings.linkedinAllowedHour);
    document.getElementById('enableTwitter').checked = settings.enabledForTwitter;
    document.getElementById('twitterTime').value = formatTime(settings.twitterAllowedHour);
    document.getElementById('enableFacebook').checked = settings.enabledForFacebook;
    document.getElementById('facebookTime').value = formatTime(settings.facebookAllowedHour);
    document.getElementById('allowedEndTime').value = formatTime(settings.allowedEndHour);
    document.getElementById('totalWeekendBlock').checked = settings.totalWeekendBlock;
    document.getElementById('vacationMode').checked = settings.vacationModeEnabled; // Load vacation mode state
    document.getElementById('redirectUrl').value = settings.redirectUrl;
  });
}

// Function to save social media settings
function saveSocialMediaSettings() {
  const settings = {
    enabledForLinkedin: document.getElementById('enableLinkedin').checked,
    linkedinAllowedHour: parseTime(document.getElementById('linkedinTime').value),
    enabledForTwitter: document.getElementById('enableTwitter').checked,
    twitterAllowedHour: parseTime(document.getElementById('twitterTime').value),
    enabledForFacebook: document.getElementById('enableFacebook').checked,
    facebookAllowedHour: parseTime(document.getElementById('facebookTime').value),
    allowedEndHour: parseTime(document.getElementById('allowedEndTime').value),
    totalWeekendBlock: document.getElementById('totalWeekendBlock').checked,
    vacationModeEnabled: document.getElementById('vacationMode').checked, // Save vacation mode state
    redirectUrl: document.getElementById('redirectUrl').value || 'https://read.readwise.io' // Add default if empty
  };

  // Send message to background script to save settings
  chrome.runtime.sendMessage({ type: 'SET_SOCIAL_MEDIA_SETTINGS', settings: settings }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error saving social media settings:', chrome.runtime.lastError);
    } else if (response && response.success) {
      console.log('Social media settings saved successfully.');
      // Optional: Show a confirmation message to the user
      const saveButton = document.getElementById('save-social-settings');
      saveButton.textContent = 'Saved!';
      setTimeout(() => { saveButton.textContent = 'Save Settings'; }, 1500);
    } else {
      console.error('Failed to save social media settings.');
    }
  });
}

// Add event listeners for social media settings changes
['enableLinkedin', 'linkedinTime', 'enableTwitter', 'twitterTime', 
 'enableFacebook', 'facebookTime', 'allowedEndTime', 'totalWeekendBlock', 'vacationMode', 'redirectUrl']
 .forEach(id => {
   const element = document.getElementById(id);
   if (element) {
     element.addEventListener('change', saveSocialMediaSettings); // Save automatically on change
   } else {
     console.warn(`Element with ID ${id} not found for event listener.`);
   }
 });

// Remove the dedicated save button listener as we save on change now
// const saveSocialButton = document.getElementById('save-social-settings');
// if (saveSocialButton) {
//   saveSocialButton.addEventListener('click', saveSocialMediaSettings);
// } else {
//   console.warn('Save social settings button not found.');
// }

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
      allowedEndHour: parseInt(document.getElementById('allowedEndTime').value.split(':')[0]),
      enabledForLinkedin: document.getElementById('enableLinkedin').checked,
      enabledForTwitter: document.getElementById('enableTwitter').checked,
      enabledForFacebook: document.getElementById('enableFacebook').checked,
      totalWeekendBlock: document.getElementById('totalWeekendBlock').checked,
      vacationModeEnabled: document.getElementById('vacationMode').checked, // Add vacation mode setting
      redirectUrl: document.getElementById('redirectUrl').value || 'https://read.readwise.io',
      visits: {} // Keep visit data from existing settings
    };
    
    // Get existing visit data
    chrome.storage.local.get(['socialMediaUsage'], function(result) {
      if (result && result.socialMediaUsage && result.socialMediaUsage.visits) {
        settings.visits = result.socialMediaUsage.visits;
      }
      
      // Save the updated settings
      chrome.storage.local.set({socialMediaUsage: settings}, function() {
        showSaveMessage('Settings saved!');
      });
      
      // Also save settings using the background script method to ensure consistency
      chrome.runtime.sendMessage({ type: 'SET_SOCIAL_MEDIA_SETTINGS', settings: settings }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error saving social media settings:', chrome.runtime.lastError);
        } else if (response && response.success) {
          console.log('Social media settings saved successfully via background.');
        }
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