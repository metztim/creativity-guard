// Enhanced message handler with comprehensive error handling and validation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Validate basic message structure
    if (!request || typeof request !== 'object' || !request.type) {
      console.error('Invalid message received:', request);
      sendResponse({ error: 'Invalid message format', success: false });
      return true;
    }
    
    // Validate sender
    if (!sender || !sender.tab) {
      console.warn('Message from unknown sender:', sender);
      // Still process but log the warning
    }
    
    if (request.type === 'GET_SOCIAL_MEDIA_SETTINGS') {
      handleGetSocialMediaSettings(sendResponse);
      return true; // Required for async response
    }
    
    if (request.type === 'SET_SOCIAL_MEDIA_SETTINGS') {
      handleSetSocialMediaSettings(request.settings, sendResponse);
      return true; // Required for async response
    }
    
    // Handle unknown message types
    console.warn('Unknown message type received:', request.type);
    sendResponse({ error: 'Unknown message type', success: false });
    return true;
    
  } catch (error) {
    console.error('Error handling runtime message:', error);
    sendResponse({ error: 'Internal error processing message', success: false });
    return true;
  }
});

// Handle GET_SOCIAL_MEDIA_SETTINGS with error handling
function handleGetSocialMediaSettings(sendResponse) {
  if (!chrome?.storage?.local) {
    console.error('Chrome storage API not available');
    sendResponse({ error: 'Storage API not available', success: false });
    return;
  }
  
  try {
    chrome.storage.local.get(['creativityGuardSocialMedia'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Storage get error:', chrome.runtime.lastError);
        sendResponse({ error: `Storage error: ${chrome.runtime.lastError.message}`, success: false });
        return;
      }
      
      try {
        // Validate and sanitize the retrieved settings
        const settings = result.creativityGuardSocialMedia;
        
        if (settings === null || settings === undefined) {
          // No settings found - this is normal for first run
          sendResponse(null);
          return;
        }
        
        if (typeof settings !== 'object' || Array.isArray(settings)) {
          console.warn('Invalid settings format in storage:', settings);
          sendResponse(null); // Return null to trigger defaults
          return;
        }
        
        // Validate numeric fields
        const numericFields = ['linkedinAllowedHour', 'twitterAllowedHour', 'facebookAllowedHour', 'allowedEndHour'];
        const sanitizedSettings = { ...settings };
        
        numericFields.forEach(field => {
          if (sanitizedSettings[field] !== undefined) {
            const value = parseInt(sanitizedSettings[field], 10);
            if (isNaN(value) || value < 0 || value > 23) {
              console.warn(`Invalid ${field} value:`, sanitizedSettings[field]);
              delete sanitizedSettings[field]; // Remove invalid value to trigger default
            } else {
              sanitizedSettings[field] = value;
            }
          }
        });
        
        // Validate boolean fields
        const booleanFields = ['enabledForLinkedin', 'enabledForTwitter', 'enabledForFacebook', 'totalWeekendBlock', 'vacationModeEnabled'];
        booleanFields.forEach(field => {
          if (sanitizedSettings[field] !== undefined && typeof sanitizedSettings[field] !== 'boolean') {
            sanitizedSettings[field] = !!sanitizedSettings[field];
          }
        });
        
        // Validate URL field
        if (sanitizedSettings.redirectUrl && typeof sanitizedSettings.redirectUrl !== 'string') {
          console.warn('Invalid redirectUrl format:', sanitizedSettings.redirectUrl);
          delete sanitizedSettings.redirectUrl; // Remove to trigger default
        }
        
        sendResponse(sanitizedSettings);
      } catch (processingError) {
        console.error('Error processing retrieved settings:', processingError);
        sendResponse({ error: 'Error processing settings', success: false });
      }
    });
  } catch (error) {
    console.error('Error in handleGetSocialMediaSettings:', error);
    sendResponse({ error: 'Unexpected error retrieving settings', success: false });
  }
}

// Handle SET_SOCIAL_MEDIA_SETTINGS with validation and error handling
function handleSetSocialMediaSettings(settings, sendResponse) {
  if (!chrome?.storage?.local) {
    console.error('Chrome storage API not available');
    sendResponse({ error: 'Storage API not available', success: false });
    return;
  }
  
  try {
    // Validate settings parameter
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      console.error('Invalid settings provided for saving:', settings);
      sendResponse({ error: 'Invalid settings format', success: false });
      return;
    }
    
    // Validate and sanitize settings
    const sanitizedSettings = validateAndSanitizeSettingsForSave(settings);
    
    if (!sanitizedSettings) {
      sendResponse({ error: 'Settings validation failed', success: false });
      return;
    }
    
    // Calculate data size to prevent storage quota issues
    const dataSize = JSON.stringify(sanitizedSettings).length;
    if (dataSize > 1024 * 1024) { // 1MB warning threshold
      console.warn('Settings data is very large:', dataSize, 'bytes');
    }
    
    chrome.storage.local.set({
      creativityGuardSocialMedia: sanitizedSettings
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Storage set error:', chrome.runtime.lastError);
        sendResponse({ error: `Storage error: ${chrome.runtime.lastError.message}`, success: false });
        return;
      }
      
      console.log('Social media settings saved successfully');
      sendResponse({ success: true });
    });
  } catch (error) {
    console.error('Error in handleSetSocialMediaSettings:', error);
    sendResponse({ error: 'Unexpected error saving settings', success: false });
  }
}

// Validate and sanitize settings for saving
function validateAndSanitizeSettingsForSave(settings) {
  try {
    const sanitized = {};
    
    // Define validation rules
    const validationRules = {
      // Numeric fields (hours)
      linkedinAllowedHour: { type: 'number', min: 0, max: 23, default: 15 },
      twitterAllowedHour: { type: 'number', min: 0, max: 23, default: 15 },
      facebookAllowedHour: { type: 'number', min: 0, max: 23, default: 15 },
      allowedEndHour: { type: 'number', min: 0, max: 23, default: 19 },
      
      // Boolean fields
      enabledForLinkedin: { type: 'boolean', default: true },
      enabledForTwitter: { type: 'boolean', default: true },
      enabledForFacebook: { type: 'boolean', default: true },
      totalWeekendBlock: { type: 'boolean', default: true },
      vacationModeEnabled: { type: 'boolean', default: false },
      
      // String fields
      redirectUrl: { type: 'string', default: 'https://read.readwise.io' }
    };
    
    // Process each field according to validation rules
    for (const [key, rule] of Object.entries(validationRules)) {
      if (settings.hasOwnProperty(key)) {
        const value = settings[key];
        
        if (rule.type === 'number') {
          const numValue = parseInt(value, 10);
          if (isNaN(numValue) || numValue < rule.min || numValue > rule.max) {
            console.warn(`Invalid ${key} value: ${value}, using default: ${rule.default}`);
            sanitized[key] = rule.default;
          } else {
            sanitized[key] = numValue;
          }
        } else if (rule.type === 'boolean') {
          sanitized[key] = Boolean(value);
        } else if (rule.type === 'string') {
          if (typeof value === 'string') {
            const trimmedValue = value.trim();
            if (key === 'redirectUrl') {
              // Special validation for URL
              if (trimmedValue && isValidUrl(trimmedValue)) {
                sanitized[key] = trimmedValue;
              } else {
                console.warn(`Invalid URL: ${value}, using default: ${rule.default}`);
                sanitized[key] = rule.default;
              }
            } else {
              sanitized[key] = trimmedValue || rule.default;
            }
          } else {
            console.warn(`Invalid ${key} type, expected string, using default: ${rule.default}`);
            sanitized[key] = rule.default;
          }
        }
      } else {
        // Field not provided, use default
        sanitized[key] = rule.default;
      }
    }
    
    // Copy visits object if present (with validation)
    if (settings.visits && typeof settings.visits === 'object' && !Array.isArray(settings.visits)) {
      sanitized.visits = {};
      // Validate each visit entry
      for (const [platform, date] of Object.entries(settings.visits)) {
        if (typeof platform === 'string' && typeof date === 'string' && 
            ['linkedin', 'twitter', 'facebook'].includes(platform) &&
            /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          sanitized.visits[platform] = date;
        }
      }
    } else {
      sanitized.visits = {};
    }
    
    return sanitized;
  } catch (error) {
    console.error('Error validating settings:', error);
    return null;
  }
}

// Simple URL validation
function isValidUrl(string) {
  try {
    // Check for dangerous protocols
    const lowerString = string.toLowerCase();
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    if (dangerousProtocols.some(protocol => lowerString.includes(protocol))) {
      return false;
    }
    
    // Add protocol if missing
    let normalizedUrl = string;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Validate with URL constructor
    const url = new URL(normalizedUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Track extension disable/enable patterns
async function trackExtensionDisabled() {
  const timestamp = Date.now();

  try {
    const result = await chrome.storage.local.get(['extensionTrackingStats']);
    const stats = result.extensionTrackingStats || {
      disableCount: 0,
      disableEvents: [],
      totalDisabledDuration: 0,
      lastActiveTimestamp: timestamp
    };

    // Record disable event
    stats.disableCount++;
    stats.disableEvents.push({
      timestamp: timestamp,
      date: new Date(timestamp).toISOString()
    });

    // Keep only last 100 events to prevent storage bloat
    if (stats.disableEvents.length > 100) {
      stats.disableEvents = stats.disableEvents.slice(-100);
    }

    stats.lastActiveTimestamp = timestamp;

    await chrome.storage.local.set({ extensionTrackingStats: stats });
    console.log('Extension disable tracked:', stats.disableCount, 'total disables');
  } catch (error) {
    console.error('Error tracking extension disable:', error);
  }
}

async function calculateDisabledDuration() {
  const currentTime = Date.now();

  try {
    const result = await chrome.storage.local.get(['extensionTrackingStats']);
    const stats = result.extensionTrackingStats;

    if (stats && stats.lastActiveTimestamp) {
      // Calculate how long the extension was disabled
      const disabledDuration = currentTime - stats.lastActiveTimestamp;

      // Only count if disabled for more than 10 seconds (to filter out reloads)
      if (disabledDuration > 10000) {
        stats.totalDisabledDuration = (stats.totalDisabledDuration || 0) + disabledDuration;

        // Add re-enable event with duration
        if (!stats.enableEvents) {
          stats.enableEvents = [];
        }

        stats.enableEvents.push({
          timestamp: currentTime,
          date: new Date(currentTime).toISOString(),
          disabledDurationMs: disabledDuration,
          disabledDurationMinutes: Math.round(disabledDuration / 60000)
        });

        // Keep only last 100 events
        if (stats.enableEvents.length > 100) {
          stats.enableEvents = stats.enableEvents.slice(-100);
        }

        await chrome.storage.local.set({ extensionTrackingStats: stats });
        console.log('Extension was disabled for', Math.round(disabledDuration / 60000), 'minutes');
      }
    }

    // Update last active timestamp for next calculation
    await chrome.storage.local.set({
      extensionTrackingStats: {
        ...stats,
        lastActiveTimestamp: currentTime
      }
    });
  } catch (error) {
    console.error('Error calculating disabled duration:', error);
  }
}

// Listen for when this extension is disabled
chrome.management.onDisabled.addListener((info) => {
  if (info.id === chrome.runtime.id) {
    trackExtensionDisabled();
  }
});

// Handle extension startup errors
chrome.runtime.onStartup.addListener(() => {
  console.log('Creativity Guard extension started');
  // Calculate how long we were disabled when restarting
  calculateDisabledDuration();
});

chrome.runtime.onInstalled.addListener((details) => {
  try {
    console.log('Creativity Guard extension installed/updated:', details.reason);

    // On install, we could initialize default settings if needed
    if (details.reason === 'install') {
      console.log('First time installation detected');
      // Initialize extension tracking stats
      chrome.storage.local.set({
        extensionTrackingStats: {
          disableCount: 0,
          disableEvents: [],
          enableEvents: [],
          totalDisabledDuration: 0,
          lastActiveTimestamp: Date.now()
        }
      });
    } else if (details.reason === 'update') {
      console.log('Extension updated to version:', chrome.runtime.getManifest().version);
      // Calculate disabled duration after update
      calculateDisabledDuration();
    }
  } catch (error) {
    console.error('Error handling extension install/update:', error);
  }
});

// Handle extension errors globally
chrome.runtime.onSuspend.addListener(() => {
  console.log('Creativity Guard extension suspending');
});

// Log any unhandled errors in the background script
self.addEventListener('error', (event) => {
  console.error('Unhandled error in background script:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in background script:', event.reason);
}); 