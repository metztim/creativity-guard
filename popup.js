
// Error handling and notification system
const ErrorSystem = {
  showError: function(message, duration = 5000) {
    this.showNotification(message, 'error', duration);
  },
  
  showSuccess: function(message, duration = 3000) {
    this.showNotification(message, 'success', duration);
  },
  
  showWarning: function(message, duration = 4000) {
    this.showNotification(message, 'warning', duration);
  },
  
  showNotification: function(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles if not already added
    if (!document.getElementById('error-system-styles')) {
      const styles = document.createElement('style');
      styles.id = 'error-system-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 6px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          z-index: 10000;
          max-width: 300px;
          word-wrap: break-word;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        }
        .notification-error {
          background-color: #dc3545;
        }
        .notification-success {
          background-color: #28a745;
        }
        .notification-warning {
          background-color: #ffc107;
          color: #212529;
        }
        .notification-info {
          background-color: #17a2b8;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after duration
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
};

// Input validation utilities
const ValidationUtils = {
  validateTimeInput: function(timeString, fieldName) {
    if (!timeString) {
      throw new Error(`${fieldName} is required`);
    }
    
    const timeParts = timeString.split(':');
    if (timeParts.length !== 2) {
      throw new Error(`${fieldName} must be in HH:MM format`);
    }
    
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    
    if (isNaN(hour) || hour < 0 || hour > 23) {
      throw new Error(`${fieldName} hour must be between 0 and 23`);
    }
    
    if (isNaN(minute) || minute < 0 || minute > 59) {
      throw new Error(`${fieldName} minute must be between 0 and 59`);
    }
    
    return { hour, minute, isValid: true };
  },
  
  validateUrl: function(url, fieldName) {
    if (!url || typeof url !== 'string') {
      throw new Error(`${fieldName} is required`);
    }
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      throw new Error(`${fieldName} cannot be empty`);
    }
    
    // Check for malicious patterns
    const dangerousPatterns = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'ftp:'
    ];
    
    const lowerUrl = trimmedUrl.toLowerCase();
    for (const pattern of dangerousPatterns) {
      if (lowerUrl.includes(pattern)) {
        throw new Error(`${fieldName} contains invalid protocol: ${pattern}`);
      }
    }
    
    // Add protocol if missing
    let normalizedUrl = trimmedUrl;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Validate URL format
    try {
      const urlObj = new URL(normalizedUrl);
      
      // Only allow HTTP and HTTPS
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        throw new Error(`${fieldName} must use HTTP or HTTPS protocol`);
      }
      
      return normalizedUrl;
    } catch (e) {
      throw new Error(`${fieldName} is not a valid URL: ${e.message}`);
    }
  },
  
  sanitizeInput: function(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input.trim();
  }
};

// Safe Chrome API wrapper
const SafeChromeAPI = {
  storage: {
    get: function(keys, callback) {
      if (!chrome?.storage?.local) {
        ErrorSystem.showError('Chrome storage API is not available');
        callback(null);
        return;
      }
      
      try {
        chrome.storage.local.get(keys, function(result) {
          if (chrome.runtime.lastError) {
            console.error('Storage get error:', chrome.runtime.lastError);
            ErrorSystem.showError(`Failed to load settings: ${chrome.runtime.lastError.message}`);
            callback(null);
            return;
          }
          callback(result);
        });
      } catch (e) {
        console.error('Error calling storage get:', e);
        ErrorSystem.showError('Failed to access extension storage');
        callback(null);
      }
    },
    
    set: function(data, callback) {
      if (!chrome?.storage?.local) {
        ErrorSystem.showError('Chrome storage API is not available');
        if (callback) callback(false);
        return;
      }
      
      try {
        chrome.storage.local.set(data, function() {
          if (chrome.runtime.lastError) {
            console.error('Storage set error:', chrome.runtime.lastError);
            ErrorSystem.showError(`Failed to save settings: ${chrome.runtime.lastError.message}`);
            if (callback) callback(false);
            return;
          }
          if (callback) callback(true);
        });
      } catch (e) {
        console.error('Storage set error:', e);
        ErrorSystem.showError('Failed to save to extension storage');
        if (callback) callback(false);
      }
    }
  },
  
  runtime: {
    sendMessage: function(message, callback) {
      if (!chrome?.runtime?.sendMessage) {
        ErrorSystem.showError('Chrome runtime API is not available');
        if (callback) callback(null);
        return;
      }
      
      try {
        chrome.runtime.sendMessage(message, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Runtime message error:', chrome.runtime.lastError);
            ErrorSystem.showError(`Communication error: ${chrome.runtime.lastError.message}`);
            if (callback) callback(null);
            return;
          }
          if (callback) callback(response);
        });
      } catch (e) {
        console.error('Error sending runtime message:', e);
        ErrorSystem.showError('Failed to communicate with extension');
        if (callback) callback(null);
      }
    }
  }
};

// Cleanup system for popup
const PopupCleanup = {
  eventListeners: new Map(),
  
  trackEventListener: function(element, eventType, handler) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ type: eventType, handler });
  },
  
  cleanup: function() {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ type, handler }) => {
        try {
          element.removeEventListener(type, handler);
        } catch (e) {
          console.warn('Error removing popup event listener:', e);
        }
      });
    });
    this.eventListeners.clear();
  }
};

// Clean up when popup is closed
window.addEventListener('beforeunload', () => PopupCleanup.cleanup());
window.addEventListener('unload', () => PopupCleanup.cleanup());

// Load stats when popup opens
document.addEventListener('DOMContentLoaded', function() {
  // Set up tab navigation
  setupTabs();

  // Load AI stats
  loadAIStats();

  // Load social media settings
  loadSocialMediaSettings();

  // Load extension tracking stats
  loadExtensionTrackingStats();

  // Set up buttons
  setupButtons();

});

// Handle tab switching
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    const clickHandler = function() {
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
    };
    
    button.addEventListener('click', clickHandler);
    PopupCleanup.trackEventListener(button, 'click', clickHandler);
  });
}

// Load extension tracking stats with error handling
function loadExtensionTrackingStats() {
  SafeChromeAPI.storage.get(['extensionTrackingStats'], function(result) {
    if (!result) {
      console.warn('No extension tracking stats result returned, using defaults');
      updateExtensionStatsDisplay(null);
      return;
    }

    try {
      const stats = result.extensionTrackingStats;
      updateExtensionStatsDisplay(stats);
    } catch (error) {
      console.error('Error processing extension tracking stats:', error);
      updateExtensionStatsDisplay(null);
    }
  });
}

// Update extension tracking stats display
function updateExtensionStatsDisplay(stats) {
  const elements = {
    disableCount: document.getElementById('disable-count'),
    totalDisabledTime: document.getElementById('total-disabled-time'),
    avgDisabledTime: document.getElementById('avg-disabled-time'),
    extensionStatus: document.getElementById('extension-status'),
    recentActivity: document.getElementById('recent-activity')
  };

  if (!stats) {
    // No stats yet
    elements.disableCount.textContent = '0';
    elements.totalDisabledTime.textContent = '0 min';
    elements.avgDisabledTime.textContent = '0 min';
    elements.extensionStatus.textContent = 'Extension is currently enabled';
    elements.extensionStatus.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    elements.recentActivity.innerHTML = '<div class="helper-text">No recent activity</div>';
    return;
  }

  // Update disable count
  elements.disableCount.textContent = stats.disableCount || 0;

  // Update total disabled time
  const totalMinutes = Math.round((stats.totalDisabledDuration || 0) / 60000);
  if (totalMinutes < 60) {
    elements.totalDisabledTime.textContent = `${totalMinutes} min`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    elements.totalDisabledTime.textContent = `${hours}h ${mins}m`;
  }

  // Calculate average disabled time
  const avgMinutes = stats.disableCount > 0 ? Math.round(totalMinutes / stats.disableCount) : 0;
  if (avgMinutes < 60) {
    elements.avgDisabledTime.textContent = `${avgMinutes} min`;
  } else {
    const hours = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;
    elements.avgDisabledTime.textContent = `${hours}h ${mins}m`;
  }

  // Update status
  elements.extensionStatus.textContent = 'Extension is currently enabled';
  elements.extensionStatus.style.background = 'linear-gradient(135deg, #10b981, #059669)';

  // Update recent activity
  const recentEvents = [];

  // Combine disable and enable events
  if (stats.disableEvents) {
    stats.disableEvents.slice(-5).forEach(event => {
      recentEvents.push({
        type: 'disable',
        timestamp: event.timestamp,
        date: event.date
      });
    });
  }

  if (stats.enableEvents) {
    stats.enableEvents.slice(-5).forEach(event => {
      recentEvents.push({
        type: 'enable',
        timestamp: event.timestamp,
        date: event.date,
        duration: event.disabledDurationMinutes
      });
    });
  }

  // Sort by timestamp descending
  recentEvents.sort((a, b) => b.timestamp - a.timestamp);

  if (recentEvents.length === 0) {
    elements.recentActivity.innerHTML = '<div class="helper-text">No recent activity</div>';
  } else {
    let activityHtml = '<div style="font-size: 12px;">';
    recentEvents.slice(0, 10).forEach(event => {
      const date = new Date(event.date);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (event.type === 'disable') {
        activityHtml += `<div style="padding: 4px 0; color: #ef4444;">🔴 Disabled at ${timeStr} on ${dateStr}</div>`;
      } else {
        activityHtml += `<div style="padding: 4px 0; color: #10b981;">🟢 Re-enabled at ${timeStr} on ${dateStr} (was off for ${event.duration || 0} min)</div>`;
      }
    });
    activityHtml += '</div>';
    elements.recentActivity.innerHTML = activityHtml;
  }
}

// Load AI usage stats with error handling
function loadAIStats() {
  SafeChromeAPI.storage.get(['creativityGuardStats'], function(result) {
    if (!result) {
      console.warn('No stats result returned, using defaults');
      updateStatsDisplay({ aiUsageCount: 0, bypassCount: 0, thoughtFirstCount: 0 });
      return;
    }
    
    try {
      const stats = result.creativityGuardStats || { aiUsageCount: 0, bypassCount: 0, thoughtFirstCount: 0 };
      
      // Validate stats structure
      const validatedStats = {
        aiUsageCount: Math.max(0, parseInt(stats.aiUsageCount, 10) || 0),
        bypassCount: Math.max(0, parseInt(stats.bypassCount, 10) || 0),
        thoughtFirstCount: Math.max(0, parseInt(stats.thoughtFirstCount, 10) || 0)
      };
      
      updateStatsDisplay(validatedStats);
    } catch (error) {
      console.error('Error processing stats:', error);
      ErrorSystem.showError('Failed to load AI usage statistics');
      updateStatsDisplay({ aiUsageCount: 0, bypassCount: 0, thoughtFirstCount: 0 });
    }
  });
}

// Load social media settings with enhanced error handling
function loadSocialMediaSettings() {
  SafeChromeAPI.runtime.sendMessage({ type: 'GET_SOCIAL_MEDIA_SETTINGS' }, (settings) => {
    if (!settings) {
      // Use defaults if no settings returned
      settings = {};
    }
    
    try {
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
        vacationModeEnabled: false,
        redirectUrl: 'https://read.readwise.io',
      };
      
      settings = { ...defaults, ...settings }; // Merge defaults with loaded settings
      
      // Validate and sanitize settings before applying to UI
      const sanitizedSettings = validateAndSanitizeSettings(settings);
      
      // Update UI elements with error handling
      updateUIElementsSafely(sanitizedSettings);
      
      // Settings loaded successfully - no notification needed to avoid spam
    } catch (error) {
      console.error('Error processing settings:', error);
      ErrorSystem.showError(`Failed to load settings: ${error.message}`);
      
      // Load defaults as fallback
      const defaults = {
        linkedinAllowedHour: 15,
        twitterAllowedHour: 15,
        facebookAllowedHour: 15,
        allowedEndHour: 19,
        enabledForLinkedin: true,
        enabledForTwitter: true,
        enabledForFacebook: true,
        totalWeekendBlock: true,
        vacationModeEnabled: false,
        redirectUrl: 'https://read.readwise.io',
      };
      
      try {
        updateUIElementsSafely(defaults);
        NotificationSystem.showWarning('⚠️ Loaded default settings due to error');
      } catch (fallbackError) {
        ErrorSystem.showError('Failed to load default settings');
      }
    }
  });
}

// Validate and sanitize settings
function validateAndSanitizeSettings(settings) {
  const sanitized = { ...settings };
  
  // Validate hours
  const hourFields = [
    { key: 'linkedinAllowedHour', name: 'LinkedIn allowed hour', default: 15 },
    { key: 'twitterAllowedHour', name: 'Twitter allowed hour', default: 15 },
    { key: 'facebookAllowedHour', name: 'Facebook allowed hour', default: 15 },
    { key: 'allowedEndHour', name: 'End hour', default: 19 }
  ];
  
  hourFields.forEach(field => {
    const value = parseInt(sanitized[field.key], 10);
    if (isNaN(value) || value < 0 || value > 23) {
      console.warn(`Invalid ${field.name}: ${sanitized[field.key]}, using default: ${field.default}`);
      sanitized[field.key] = field.default;
    } else {
      sanitized[field.key] = value;
    }
  });
  
  // Validate boolean fields
  const booleanFields = [
    'enabledForLinkedin',
    'enabledForTwitter', 
    'enabledForFacebook',
    'totalWeekendBlock',
    'vacationModeEnabled'
  ];
  
  booleanFields.forEach(field => {
    if (typeof sanitized[field] !== 'boolean') {
      sanitized[field] = !!sanitized[field]; // Convert to boolean
    }
  });
  
  // Validate and sanitize URL
  try {
    sanitized.redirectUrl = ValidationUtils.validateUrl(sanitized.redirectUrl || 'https://read.readwise.io', 'Redirect URL');
  } catch (error) {
    console.warn('Invalid redirect URL, using default:', error.message);
    sanitized.redirectUrl = 'https://read.readwise.io';
  }
  
  return sanitized;
}

// Safely update UI elements
function updateUIElementsSafely(settings) {
  const updates = [
    { id: 'enableLinkedin', type: 'checkbox', value: settings.enabledForLinkedin },
    { id: 'linkedinTime', type: 'time', value: `${settings.linkedinAllowedHour.toString().padStart(2, '0')}:00` },
    { id: 'enableTwitter', type: 'checkbox', value: settings.enabledForTwitter },
    { id: 'twitterTime', type: 'time', value: `${settings.twitterAllowedHour.toString().padStart(2, '0')}:00` },
    { id: 'enableFacebook', type: 'checkbox', value: settings.enabledForFacebook },
    { id: 'facebookTime', type: 'time', value: `${settings.facebookAllowedHour.toString().padStart(2, '0')}:00` },
    { id: 'allowedEndTime', type: 'time', value: `${settings.allowedEndHour.toString().padStart(2, '0')}:00` },
    { id: 'totalWeekendBlock', type: 'checkbox', value: settings.totalWeekendBlock },
    { id: 'vacationMode', type: 'checkbox', value: settings.vacationModeEnabled },
    { id: 'redirectUrl', type: 'text', value: settings.redirectUrl }
  ];
  
  updates.forEach(update => {
    try {
      const element = document.getElementById(update.id);
      if (!element) {
        console.warn(`UI element not found: ${update.id}`);
        return;
      }
      
      if (update.type === 'checkbox') {
        element.checked = update.value;
      } else {
        element.value = update.value;
      }
    } catch (error) {
      console.error(`Error updating UI element ${update.id}:`, error);
    }
  });
}

// Function to save social media settings with comprehensive validation
function saveSocialMediaSettings() {
  try {
    // Collect and validate all settings
    const settings = collectAndValidateSettings();
    
    // Send message to background script to save settings
    SafeChromeAPI.runtime.sendMessage({ type: 'SET_SOCIAL_MEDIA_SETTINGS', settings: settings }, (response) => {
      if (!response) {
        ErrorSystem.showError('Failed to save settings - no response from extension');
        return;
      }
      
      if (response.success) {
        ErrorSystem.showSuccess('Settings saved successfully');
      } else {
        ErrorSystem.showError('Failed to save settings - server error');
      }
    });
  } catch (error) {
    console.error('Error saving social media settings:', error);
    ErrorSystem.showError(`Failed to save settings: ${error.message}`);
  }
}

// Collect and validate settings from UI
function collectAndValidateSettings() {
  const errors = [];
  let settings = {};
  
  try {
    // Collect checkbox values
    const checkboxFields = [
      { id: 'enableLinkedin', key: 'enabledForLinkedin' },
      { id: 'enableTwitter', key: 'enabledForTwitter' },
      { id: 'enableFacebook', key: 'enabledForFacebook' },
      { id: 'totalWeekendBlock', key: 'totalWeekendBlock' },
      { id: 'vacationMode', key: 'vacationModeEnabled' }
    ];
    
    checkboxFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element) {
        errors.push(`Missing UI element: ${field.id}`);
        return;
      }
      settings[field.key] = element.checked;
    });
    
    // Collect and validate time values
    const timeFields = [
      { id: 'linkedinTime', key: 'linkedinAllowedHour', name: 'LinkedIn time' },
      { id: 'twitterTime', key: 'twitterAllowedHour', name: 'Twitter time' },
      { id: 'facebookTime', key: 'facebookAllowedHour', name: 'Facebook time' },
      { id: 'allowedEndTime', key: 'allowedEndHour', name: 'End time' }
    ];
    
    timeFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element) {
        errors.push(`Missing UI element: ${field.id}`);
        return;
      }
      
      try {
        const timeValue = element.value || '15:00';
        const validation = ValidationUtils.validateTimeInput(timeValue, field.name);
        settings[field.key] = validation.hour;
      } catch (error) {
        errors.push(`${field.name}: ${error.message}`);
      }
    });
    
    // Validate redirect URL
    const urlElement = document.getElementById('redirectUrl');
    if (!urlElement) {
      errors.push('Missing redirect URL field');
    } else {
      try {
        const urlValue = urlElement.value || 'https://read.readwise.io';
        settings.redirectUrl = ValidationUtils.validateUrl(urlValue, 'Redirect URL');
      } catch (error) {
        errors.push(`Redirect URL: ${error.message}`);
      }
    }
    
    // Additional business logic validation
    if (settings.linkedinAllowedHour >= settings.allowedEndHour) {
      errors.push('LinkedIn start time must be before end time');
    }
    
    if (settings.twitterAllowedHour >= settings.allowedEndHour) {
      errors.push('Twitter start time must be before end time');
    }
    
    if (settings.facebookAllowedHour >= settings.allowedEndHour) {
      errors.push('Facebook start time must be before end time');
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
    
    return settings;
  } catch (error) {
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
    throw error;
  }
}

// Enhanced input validation system
const InputValidation = {
  // Show validation feedback for an input
  showValidation: function(inputId, isValid, errorMessage = '') {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(inputId + '-error');
    
    if (!input) return;
    
    // Clear previous states
    input.classList.remove('error-input', 'success-input');
    
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
    
    if (isValid) {
      input.classList.add('success-input');
      setTimeout(() => {
        input.classList.remove('success-input');
      }, 2000);
    } else {
      input.classList.add('error-input');
      if (errorDiv && errorMessage) {
        errorDiv.textContent = errorMessage;
        errorDiv.style.display = 'block';
      }
    }
  },
  
  // Validate time input in real-time
  validateTimeInput: function(inputId, fieldName) {
    const input = document.getElementById(inputId);
    if (!input) return true;
    
    try {
      const validation = ValidationUtils.validateTimeInput(input.value, fieldName);
      this.showValidation(inputId, true);
      return true;
    } catch (error) {
      this.showValidation(inputId, false, error.message);
      return false;
    }
  },
  
  // Validate URL input in real-time
  validateUrlInput: function(inputId, fieldName) {
    const input = document.getElementById(inputId);
    if (!input) return true;
    
    try {
      const validated = ValidationUtils.validateUrl(input.value || 'https://read.readwise.io', fieldName);
      this.showValidation(inputId, true);
      return true;
    } catch (error) {
      this.showValidation(inputId, false, error.message);
      return false;
    }
  },
  
  // Validate business logic (start time vs end time)
  validateTimeLogic: function() {
    const endTimeInput = document.getElementById('allowedEndTime');
    if (!endTimeInput) return true;
    
    const endHour = parseInt((endTimeInput.value || '19:00').split(':')[0], 10);
    
    const timeInputs = [
      { id: 'linkedinTime', name: 'LinkedIn start time' },
      { id: 'twitterTime', name: 'Twitter start time' },
      { id: 'facebookTime', name: 'Facebook start time' }
    ];
    
    let allValid = true;
    
    timeInputs.forEach(timeInput => {
      const input = document.getElementById(timeInput.id);
      if (input) {
        const startHour = parseInt((input.value || '15:00').split(':')[0], 10);
        if (startHour >= endHour) {
          this.showValidation(timeInput.id, false, `${timeInput.name} must be before end time`);
          allValid = false;
        } else {
          // Only clear error if it was a time logic error
          const errorDiv = document.getElementById(timeInput.id + '-error');
          if (errorDiv && errorDiv.textContent.includes('must be before end time')) {
            this.showValidation(timeInput.id, true);
          }
        }
      }
    });
    
    return allValid;
  }
};

// Add event listeners for social media settings changes with real-time validation
const settingsConfig = [
  {
    ids: ['enableLinkedin', 'enableTwitter', 'enableFacebook', 'totalWeekendBlock', 'vacationMode'],
    events: ['change'],
    validator: null // Checkboxes don't need validation
  },
  {
    ids: ['linkedinTime', 'twitterTime', 'facebookTime'],
    events: ['change', 'blur'],
    validator: (id) => {
      const fieldNames = {
        'linkedinTime': 'LinkedIn time',
        'twitterTime': 'Twitter time', 
        'facebookTime': 'Facebook time'
      };
      const isValid = InputValidation.validateTimeInput(id, fieldNames[id]);
      InputValidation.validateTimeLogic(); // Also check time logic
      return isValid;
    }
  },
  {
    ids: ['allowedEndTime'],
    events: ['change', 'blur'],
    validator: (id) => {
      const isValid = InputValidation.validateTimeInput(id, 'End time');
      InputValidation.validateTimeLogic(); // Also check time logic
      return isValid;
    }
  },
  {
    ids: ['redirectUrl'],
    events: ['change', 'blur'],
    validator: (id) => InputValidation.validateUrlInput(id, 'Redirect URL')
  }
];

settingsConfig.forEach(config => {
  config.ids.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      config.events.forEach(eventType => {
        const handler = function() {
          // Run validation if provided
          let isValid = true;
          if (config.validator) {
            isValid = config.validator(id);
          }
          
          // Only save if validation passed (or no validation needed)
          if (isValid || !config.validator) {
            saveSocialMediaSettings();
          }
        };
        
        element.addEventListener(eventType, handler);
        PopupCleanup.trackEventListener(element, eventType, handler);
      });
    } else {
      console.warn(`Element with ID ${id} not found for event listener.`);
    }
  });
});


// Set up all button event handlers
function setupButtons() {
  // AI stats reset button with error handling
  const resetStatsHandler = function() {
    const emptyStats = {
      aiUsageCount: 0,
      bypassCount: 0,
      thoughtFirstCount: 0
    };
    
    // Save to storage with error handling
    SafeChromeAPI.storage.set({creativityGuardStats: emptyStats}, function(success) {
      if (success) {
        updateStatsDisplay(emptyStats);
        ErrorSystem.showSuccess('Statistics reset successfully');
      } else {
        ErrorSystem.showError('Failed to reset statistics');
      }
    });
  };
  
  const resetStatsButton = document.getElementById('reset-stats');
  resetStatsButton.addEventListener('click', resetStatsHandler);
  PopupCleanup.trackEventListener(resetStatsButton, 'click', resetStatsHandler);
  
  // Reset social media visits button with error handling
  const resetVisitsHandler = function() {
    SafeChromeAPI.storage.get(['socialMediaUsage'], function(result) {
      if (!result) {
        ErrorSystem.showError('Failed to load current settings');
        return;
      }
      
      try {
        const settings = result.socialMediaUsage || {
          linkedinAllowedHour: 15,
          twitterAllowedHour: 15,
          enabledForLinkedin: true,
          enabledForTwitter: true
        };
        
        // Reset visits
        settings.visits = {};
        
        // Save the updated settings
        SafeChromeAPI.storage.set({socialMediaUsage: settings}, function(success) {
          if (success) {
            ErrorSystem.showSuccess('Today\'s visits reset successfully');
          } else {
            ErrorSystem.showError('Failed to reset today\'s visits');
          }
        });
      } catch (error) {
        console.error('Error resetting visits:', error);
        ErrorSystem.showError('Failed to reset visits: ' + error.message);
      }
    });
  };
  
  const resetVisitsButton = document.getElementById('reset-social-visits');
  resetVisitsButton.addEventListener('click', resetVisitsHandler);
  PopupCleanup.trackEventListener(resetVisitsButton, 'click', resetVisitsHandler);

  // Reset extension tracking stats button
  const resetExtensionStatsHandler = function() {
    const emptyStats = {
      disableCount: 0,
      disableEvents: [],
      enableEvents: [],
      totalDisabledDuration: 0,
      lastActiveTimestamp: Date.now()
    };

    // Save to storage with error handling
    SafeChromeAPI.storage.set({extensionTrackingStats: emptyStats}, function(success) {
      if (success) {
        updateExtensionStatsDisplay(emptyStats);
        ErrorSystem.showSuccess('Extension statistics reset successfully');
      } else {
        ErrorSystem.showError('Failed to reset extension statistics');
      }
    });
  };

  const resetExtensionStatsButton = document.getElementById('reset-extension-stats');
  if (resetExtensionStatsButton) {
    resetExtensionStatsButton.addEventListener('click', resetExtensionStatsHandler);
    PopupCleanup.trackEventListener(resetExtensionStatsButton, 'click', resetExtensionStatsHandler);
  }
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

// Enhanced stats display with visual progress bars and animations
function updateStatsDisplay(stats) {
  if (!stats || typeof stats !== 'object') {
    console.error('Invalid stats object provided');
    return;
  }
  
  try {
    // Safely update each stat with animated counters
    const elements = [
      { id: 'ai-usage-count', value: stats.aiUsageCount || 0, color: '#3b82f6' },
      { id: 'thought-first-count', value: stats.thoughtFirstCount || 0, color: '#10b981' },
      { id: 'bypass-count', value: stats.bypassCount || 0, color: '#f59e0b' }
    ];
    
    elements.forEach(element => {
      const domElement = document.getElementById(element.id);
      if (domElement) {
        // Animate counter from current value to new value
        animateCounter(domElement, element.value);
      } else {
        console.warn(`Stats display element not found: ${element.id}`);
      }
    });
    
    // Calculate and display enhanced ratio with progress visualization
    const thoughtFirst = parseInt(stats.thoughtFirstCount, 10) || 0;
    const bypassed = parseInt(stats.bypassCount, 10) || 0;
    const totalInteractions = thoughtFirst + bypassed;
    let ratio = 0;
    
    if (totalInteractions > 0) {
      ratio = Math.round((thoughtFirst / totalInteractions) * 100);
    }
    
    const ratioElement = document.getElementById('success-ratio');
    if (ratioElement) {
      updateRatioDisplay(ratioElement, ratio, thoughtFirst, totalInteractions);
    } else {
      console.warn('Success ratio element not found');
    }
  } catch (error) {
    console.error('Error updating stats display:', error);
    ErrorSystem.showError('Failed to update statistics display');
  }
}

// Animate counter with easing
function animateCounter(element, targetValue) {
  const startValue = parseInt(element.textContent) || 0;
  const duration = 800; // 800ms animation
  const startTime = performance.now();
  
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out-cubic)
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + (targetValue - startValue) * easedProgress);
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = targetValue; // Ensure we end with exact target
    }
  }
  
  requestAnimationFrame(updateCounter);
}

// Enhanced ratio display with progress bar and insights
function updateRatioDisplay(element, ratio, thoughtFirst, totalInteractions) {
  // Clear existing content
  element.innerHTML = '';
  
  // Create progress bar container
  const progressContainer = document.createElement('div');
  progressContainer.style.cssText = `
    background: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    height: 8px;
    margin: 12px 0;
    overflow: hidden;
    position: relative;
  `;
  
  // Create progress bar fill
  const progressFill = document.createElement('div');
  progressFill.style.cssText = `
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 20px;
    width: 0%;
    transition: width 1s ease-out;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  `;
  
  progressContainer.appendChild(progressFill);
  
  // Create main text
  const mainText = document.createElement('div');
  mainText.style.cssText = `
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
    text-align: center;
  `;
  
  // Create insight text
  const insightText = document.createElement('div');
  insightText.style.cssText = `
    font-size: 13px;
    opacity: 0.9;
    text-align: center;
    margin-top: 8px;
  `;
  
  // Set content based on ratio
  if (totalInteractions === 0) {
    mainText.textContent = 'No AI interactions yet';
    insightText.textContent = 'Start using AI tools to see your mindfulness stats';
  } else {
    mainText.textContent = `${ratio}% Mindful Usage`;
    
    // Animate progress bar
    setTimeout(() => {
      progressFill.style.width = `${ratio}%`;
    }, 100);
    
    // Generate insights
    let insight = '';
    if (ratio >= 80) {
      insight = `🎉 Excellent! You're being mindful in most AI interactions.`;
    } else if (ratio >= 60) {
      insight = `👍 Good job! You're thinking first in most cases.`;
    } else if (ratio >= 40) {
      insight = `📈 Room for improvement. Try pausing before using AI.`;
    } else {
      insight = `💡 Consider taking a moment to think first before using AI.`;
    }
    
    insightText.textContent = insight;
  }
  
  // Assemble the display
  element.appendChild(mainText);
  element.appendChild(progressContainer);
  element.appendChild(insightText);
  
  // Add detailed stats
  if (totalInteractions > 0) {
    const detailsText = document.createElement('div');
    detailsText.style.cssText = `
      font-size: 11px;
      opacity: 0.7;
      text-align: center;
      margin-top: 6px;
    `;
    detailsText.textContent = `${thoughtFirst} mindful / ${totalInteractions} total interactions`;
    element.appendChild(detailsText);
  }
} 