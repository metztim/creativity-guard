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

    if (request.type === 'RECORD_EXTENSION_DISABLE') {
      handleRecordExtensionDisable(sendResponse);
      return true; // Required for async response
    }

    if (request.type === 'GET_SITES_CONFIG') {
      handleGetSitesConfig(sendResponse);
      return true; // Required for async response
    }

    if (request.type === 'UPDATE_SITES_CONFIG') {
      if (request.config) {
        // Full config update
        handleUpdateSitesConfig(request.config, sendResponse);
      } else if (request.category && request.key !== undefined) {
        // Partial update (from checkbox toggles, etc.)
        handlePartialSitesConfigUpdate(request.category, request.key, request.value, sendResponse);
      } else {
        sendResponse({ error: 'Invalid update request format', success: false });
      }
      return true; // Required for async response
    }

    if (request.type === 'ADD_CUSTOM_SITE') {
      handleAddCustomSite(request.site, sendResponse);
      return true; // Required for async response
    }

    if (request.type === 'REMOVE_CUSTOM_SITE') {
      handleRemoveCustomSite(request.domain, sendResponse);
      return true; // Required for async response
    }

    if (request.type === 'OPEN_SITES_JSON') {
      handleOpenSitesJson(sendResponse);
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
      redirectUrl: { type: 'string', default: 'https://weeatrobots.substack.com' }
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

    // Copy usageHistory array if present (with validation)
    // This tracks bypass and disable events for the stats display
    if (settings.usageHistory && Array.isArray(settings.usageHistory)) {
      sanitized.usageHistory = [];
      // Validate each history entry
      const now = Date.now();
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

      for (const entry of settings.usageHistory) {
        if (entry &&
            typeof entry === 'object' &&
            typeof entry.timestamp === 'number' &&
            typeof entry.action === 'string' &&
            ['bypass', 'disabled'].includes(entry.action) &&
            entry.timestamp > twentyFourHoursAgo) {
          // Keep only entries from the last 24 hours
          sanitized.usageHistory.push({
            timestamp: entry.timestamp,
            action: entry.action,
            // Preserve optional fields if present
            ...(entry.reason && { reason: String(entry.reason) }),
            ...(entry.platform && { platform: String(entry.platform) }),
            ...(entry.blockType && { blockType: String(entry.blockType) })
          });
        }
      }
    } else {
      sanitized.usageHistory = [];
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

// Note: Extensions cannot track their own disabling since the background script stops
// We track disable/enable events by detecting when the extension starts up again

async function calculateDisabledDuration() {
  const currentTime = Date.now();

  try {
    const result = await chrome.storage.local.get(['extensionTrackingStats']);
    const stats = result.extensionTrackingStats || {
      disableCount: 0,
      disableEvents: [],
      enableEvents: [],
      totalDisabledDuration: 0,
      lastActiveTimestamp: currentTime
    };

    if (stats && stats.lastActiveTimestamp) {
      // Calculate how long the extension was disabled
      const disabledDuration = currentTime - stats.lastActiveTimestamp;

      // Only count if disabled for more than 10 seconds (to filter out reloads)
      if (disabledDuration > 10000) {
        // Increment disable count (each re-enable implies a previous disable)
        stats.disableCount = (stats.disableCount || 0) + 1;

        // Also record in the same format as bypass events for consistency
        recordDisableEvent();

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
        console.log('Total disable count:', stats.disableCount);
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

// Note: chrome.management.onDisabled won't work for tracking our own extension
// because the background script stops running when disabled

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

// Record disable event in the same format as bypass events
function recordDisableEvent() {
  chrome.storage.local.get(['creativityGuardSocialMedia'], (result) => {
    const settings = result.creativityGuardSocialMedia || {};
    if (!settings.usageHistory) {
      settings.usageHistory = [];
    }

    // Add disable event
    settings.usageHistory.push({
      timestamp: Date.now(),
      action: 'disabled'
    });

    // Clean up entries older than 24 hours
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    settings.usageHistory = settings.usageHistory.filter(entry =>
      entry.timestamp > twentyFourHoursAgo
    );

    // Save back to storage
    chrome.storage.local.set({ creativityGuardSocialMedia: settings });
  });
}

// Handle manual recording of extension disable (for testing)
function handleRecordExtensionDisable(sendResponse) {
  recordDisableEvent();
  sendResponse({ success: true });
}

// Log any unhandled errors in the background script
self.addEventListener('error', (event) => {
  console.error('Unhandled error in background script:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in background script:', event.reason);
});

// Sites.json handlers

// Get sites configuration
function handleGetSitesConfig(sendResponse) {
  readSitesJson()
    .then(config => {
      if (config) {
        sendResponse({ success: true, config });
      } else {
        // Return default configuration if sites.json is not available
        sendResponse({ success: true, config: getDefaultSitesConfig() });
      }
    })
    .catch(error => {
      console.error('Error getting sites config:', error);
      sendResponse({ error: 'Failed to read sites configuration', success: false });
    });
}

// Update sites configuration (full update)
function handleUpdateSitesConfig(config, sendResponse) {
  if (!config || typeof config !== 'object') {
    sendResponse({ error: 'Invalid configuration provided', success: false });
    return;
  }

  writeSitesJson(config)
    .then(() => {
      // Sync changes to Chrome storage for backward compatibility
      syncSitesToStorage(config);
      sendResponse({ success: true });
    })
    .catch(error => {
      console.error('Error updating sites config:', error);
      sendResponse({ error: 'Failed to update sites configuration', success: false });
    });
}

// Update sites configuration (partial update - single field)
function handlePartialSitesConfigUpdate(category, key, value, sendResponse) {
  readSitesJson()
    .then(config => {
      const sitesConfig = config || getDefaultSitesConfig();

      // Update the specific field
      if (!sitesConfig[category]) {
        sitesConfig[category] = {};
      }
      sitesConfig[category][key] = value;

      // Save the updated config
      return writeSitesJson(sitesConfig)
        .then(() => {
          // Sync changes to Chrome storage for backward compatibility
          syncSitesToStorage(sitesConfig);
          sendResponse({ success: true });
        });
    })
    .catch(error => {
      console.error('Error updating partial sites config:', error);
      sendResponse({ error: 'Failed to update site configuration', success: false });
    });
}

// Add custom site
function handleAddCustomSite(site, sendResponse) {
  if (!site || !site.domain || !site.name) {
    sendResponse({ error: 'Invalid site data provided', success: false });
    return;
  }

  readSitesJson()
    .then(config => {
      const sitesConfig = config || getDefaultSitesConfig();

      // Check if site already exists
      const existingSite = sitesConfig.customSites.sites.find(s => s.domain === site.domain);
      if (existingSite) {
        sendResponse({ error: 'Site already exists', success: false });
        return;
      }

      // Add the new site
      sitesConfig.customSites.sites.push({
        domain: site.domain,
        name: site.name,
        enabled: site.enabled !== false // Default to true
      });

      return writeSitesJson(sitesConfig);
    })
    .then(() => {
      sendResponse({ success: true });
    })
    .catch(error => {
      console.error('Error adding custom site:', error);
      sendResponse({ error: 'Failed to add custom site', success: false });
    });
}

// Remove custom site
function handleRemoveCustomSite(domain, sendResponse) {
  if (!domain) {
    sendResponse({ error: 'Domain not provided', success: false });
    return;
  }

  readSitesJson()
    .then(config => {
      const sitesConfig = config || getDefaultSitesConfig();

      // Find and remove the site
      const initialLength = sitesConfig.customSites.sites.length;
      sitesConfig.customSites.sites = sitesConfig.customSites.sites.filter(s => s.domain !== domain);

      if (sitesConfig.customSites.sites.length === initialLength) {
        sendResponse({ error: 'Site not found', success: false });
        return;
      }

      return writeSitesJson(sitesConfig);
    })
    .then(() => {
      sendResponse({ success: true });
    })
    .catch(error => {
      console.error('Error removing custom site:', error);
      sendResponse({ error: 'Failed to remove custom site', success: false });
    });
}

// Open sites.json in a new tab for editing
function handleOpenSitesJson(sendResponse) {
  try {
    const sitesJsonUrl = chrome.runtime.getURL('sites.json');
    chrome.tabs.create({ url: sitesJsonUrl }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('Error opening sites.json:', chrome.runtime.lastError);
        sendResponse({ error: 'Failed to open sites.json', success: false });
      } else {
        sendResponse({ success: true, tabId: tab.id });
      }
    });
  } catch (error) {
    console.error('Error opening sites.json:', error);
    sendResponse({ error: 'Failed to open sites.json', success: false });
  }
}

// Read sites configuration (from Chrome storage first, then sites.json as fallback)
async function readSitesJson() {
  try {
    // First, try to get the config from Chrome storage (where updates are saved)
    const storageData = await new Promise((resolve) => {
      chrome.storage.local.get(['sitesConfig'], (result) => {
        resolve(result.sitesConfig || null);
      });
    });

    if (storageData) {
      console.log('Loaded sites config from Chrome storage');
      return validateSitesConfig(storageData);
    }

    // If no data in storage, read from sites.json file as default template
    const response = await fetch(chrome.runtime.getURL('sites.json'));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    console.log('Loaded sites config from sites.json file');
    return validateSitesConfig(config);
  } catch (error) {
    console.error('Error reading sites configuration:', error);
    return null;
  }
}

// Write sites configuration to Chrome storage
// Note: Chrome extensions cannot write to their own files, so we use Chrome storage
async function writeSitesJson(config) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ sitesConfig: config }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        console.log('Sites config saved to Chrome storage');
        resolve();
      }
    });
  });
}

// Validate sites configuration
function validateSitesConfig(config) {
  if (!config || typeof config !== 'object') {
    return null;
  }

  // Ensure required structure exists
  const validatedConfig = {
    version: config.version || '1.0.0',
    aiSites: validateSiteCategory(config.aiSites),
    socialMediaSites: validateSiteCategory(config.socialMediaSites),
    newsSites: validateSiteCategory(config.newsSites),
    customSites: validateSiteCategory(config.customSites),
    settings: validateSettings(config.settings)
  };

  return validatedConfig;
}

// Validate site category
function validateSiteCategory(category) {
  if (!category || typeof category !== 'object') {
    return { enabled: false, sites: [] };
  }

  return {
    enabled: Boolean(category.enabled),
    sites: Array.isArray(category.sites) ? category.sites.filter(site =>
      site && typeof site === 'object' && site.domain && site.name
    ) : []
  };
}

// Validate settings
function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return getDefaultSettings();
  }

  return {
    allowedAfterHour: Number.isInteger(settings.allowedAfterHour) && settings.allowedAfterHour >= 0 && settings.allowedAfterHour <= 23
      ? settings.allowedAfterHour : 15,
    allowedEndHour: Number.isInteger(settings.allowedEndHour) && settings.allowedEndHour >= 0 && settings.allowedEndHour <= 23
      ? settings.allowedEndHour : 19,
    redirectUrl: typeof settings.redirectUrl === 'string' && isValidUrl(settings.redirectUrl)
      ? settings.redirectUrl : 'https://weeatrobots.substack.com',
    vacationMode: Boolean(settings.vacationMode),
    totalWeekendBlock: Boolean(settings.totalWeekendBlock)
  };
}

// Get default settings
function getDefaultSettings() {
  return {
    allowedAfterHour: 15,
    allowedEndHour: 19,
    redirectUrl: 'https://weeatrobots.substack.com',
    vacationMode: false,
    totalWeekendBlock: false
  };
}

// Get default sites configuration
function getDefaultSitesConfig() {
  return {
    version: '1.0.0',
    aiSites: {
      enabled: false,
      sites: [
        { domain: 'chat.openai.com', name: 'ChatGPT' },
        { domain: 'chatgpt.com', name: 'ChatGPT' },
        { domain: 'claude.ai', name: 'Claude' },
        { domain: 'gemini.google.com', name: 'Gemini' },
        { domain: 'poe.com', name: 'Poe' },
        { domain: 'www.typingmind.com', name: 'TypingMind' },
        { domain: 'lex.page', name: 'Lex' }
      ]
    },
    socialMediaSites: {
      enabled: true,
      sites: [
        { domain: 'linkedin.com', name: 'LinkedIn', enabled: true },
        { domain: 'twitter.com', name: 'Twitter', enabled: true },
        { domain: 'x.com', name: 'X (Twitter)', enabled: true },
        { domain: 'facebook.com', name: 'Facebook', enabled: true }
      ]
    },
    newsSites: {
      enabled: false,
      sites: [
        { domain: 'theguardian.com', name: 'The Guardian' },
        { domain: 'nytimes.com', name: 'NY Times' },
        { domain: 'washingtonpost.com', name: 'Washington Post' },
        { domain: 'bbc.com', name: 'BBC' },
        { domain: 'cnn.com', name: 'CNN' },
        { domain: 'reddit.com', name: 'Reddit' }
      ]
    },
    customSites: {
      enabled: true,
      sites: []
    },
    settings: getDefaultSettings()
  };
}

// Sync sites configuration to Chrome storage for backward compatibility
function syncSitesToStorage(config) {
  if (!config || !config.settings) {
    return;
  }

  // Map sites.json settings to existing storage format
  const socialMediaSettings = {
    linkedinAllowedHour: config.settings.allowedAfterHour,
    twitterAllowedHour: config.settings.allowedAfterHour,
    facebookAllowedHour: config.settings.allowedAfterHour,
    allowedEndHour: config.settings.allowedEndHour,
    redirectUrl: config.settings.redirectUrl,
    vacationModeEnabled: config.settings.vacationMode,
    totalWeekendBlock: config.settings.totalWeekendBlock,
    enabledForLinkedin: config.socialMediaSites.enabled &&
      config.socialMediaSites.sites.some(s => s.domain === 'linkedin.com' && s.enabled !== false),
    enabledForTwitter: config.socialMediaSites.enabled &&
      config.socialMediaSites.sites.some(s => (s.domain === 'twitter.com' || s.domain === 'x.com') && s.enabled !== false),
    enabledForFacebook: config.socialMediaSites.enabled &&
      config.socialMediaSites.sites.some(s => s.domain === 'facebook.com' && s.enabled !== false),
    visits: {} // Preserve existing visits data
  };

  // Get existing settings to preserve visits data
  chrome.storage.local.get(['creativityGuardSocialMedia'], (result) => {
    if (result.creativityGuardSocialMedia && result.creativityGuardSocialMedia.visits) {
      socialMediaSettings.visits = result.creativityGuardSocialMedia.visits;
    }
    if (result.creativityGuardSocialMedia && result.creativityGuardSocialMedia.usageHistory) {
      socialMediaSettings.usageHistory = result.creativityGuardSocialMedia.usageHistory;
    }

    chrome.storage.local.set({ creativityGuardSocialMedia: socialMediaSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error syncing sites to storage:', chrome.runtime.lastError);
      } else {
        console.log('Sites configuration synced to Chrome storage');
      }
    });
  });
} 