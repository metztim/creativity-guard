
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
  // Set up tab navigation with Site Blocking tab active by default
  setupTabs();

  // Load settings from sites.json and Chrome storage
  loadAllSettings();

  // Load bypass statistics for Site Blocking tab (default tab)
  loadBypassStatistics();

  // Load AI stats (will be loaded on demand when AI Guard tab is selected)
  loadAIStats();

  // Load extension tracking stats (will be loaded on demand when Stats tab is selected)
  loadExtensionTrackingStats();

  // Set up buttons
  setupButtons();

  // Set up new UI handlers
  setupNewUIHandlers();

});

// Handle tab switching with Social Media tab active by default
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');

  // Ensure Site Blocking tab is active by default
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  const siteBlockingTab = document.querySelector('[data-tab="site-blocking"]');
  const siteBlockingContent = document.getElementById('site-blocking');
  if (siteBlockingTab && siteBlockingContent) {
    siteBlockingTab.classList.add('active');
    siteBlockingContent.classList.add('active');
  }

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

      // Reload statistics when switching to relevant tabs
      if (tabId === 'site-blocking') {
        loadBypassStatistics();
      } else if (tabId === 'ai-guard') {
        loadAIStats();
      } else if (tabId === 'stats') {
        loadExtensionTrackingStats();
      }
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

// Load and display bypass statistics
function loadBypassStatistics() {
  SafeChromeAPI.runtime.sendMessage({ type: 'GET_SOCIAL_MEDIA_SETTINGS' }, (settings) => {
    if (!settings || !settings.usageHistory) {
      // No bypass data yet
      updateBypassDisplay(0, 0, []);
      return;
    }

    try {
      const now = Date.now();
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

      // Filter for bypass events in the last 24 hours
      const recentBypasses = settings.usageHistory.filter(entry =>
        entry.timestamp > twentyFourHoursAgo &&
        (entry.action === 'bypass' || entry.action === 'bypass_with_reason')
      );

      const totalBypasses = recentBypasses.length;
      const bypassesWithReasons = recentBypasses.filter(entry =>
        entry.action === 'bypass_with_reason' && entry.reason
      ).length;

      // Get recent bypass reasons
      const recentReasons = [];
      if (settings.bypassReasons) {
        const recentReasonEntries = settings.bypassReasons.filter(entry =>
          entry.timestamp > twentyFourHoursAgo
        ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5); // Show last 5 reasons

        recentReasonEntries.forEach(entry => {
          const timeAgo = Math.floor((now - entry.timestamp) / 60000); // minutes ago
          let timeStr = '';
          if (timeAgo < 60) {
            timeStr = `${timeAgo}m ago`;
          } else {
            const hoursAgo = Math.floor(timeAgo / 60);
            timeStr = `${hoursAgo}h ago`;
          }

          recentReasons.push({
            platform: entry.platform,
            reason: entry.reason,
            blockType: entry.blockType,
            timeAgo: timeStr
          });
        });
      }

      updateBypassDisplay(totalBypasses, bypassesWithReasons, recentReasons);

    } catch (error) {
      console.error('Error processing bypass statistics:', error);
      updateBypassDisplay(0, 0, []);
    }
  });
}

// Update bypass statistics display
function updateBypassDisplay(total, withReasons, recentReasons) {
  // Update counters
  const totalElement = document.getElementById('total-bypasses');
  const withReasonsElement = document.getElementById('bypass-with-reasons');

  if (totalElement) totalElement.textContent = total;
  if (withReasonsElement) withReasonsElement.textContent = withReasons;

  // Show/hide warning based on frequency
  const warningElement = document.getElementById('bypass-warning');
  if (warningElement) {
    if (total > 5) {
      warningElement.style.display = 'block';
    } else {
      warningElement.style.display = 'none';
    }
  }

  // Update recent reasons section
  const reasonsSection = document.getElementById('bypass-reasons-section');
  const reasonsContainer = document.getElementById('recent-bypass-reasons');

  if (recentReasons.length > 0 && reasonsSection && reasonsContainer) {
    reasonsSection.style.display = 'block';
    reasonsContainer.innerHTML = '';

    recentReasons.forEach(item => {
      const reasonItem = document.createElement('div');
      reasonItem.style.cssText = `
        margin-bottom: 10px;
        padding: 8px;
        background: white;
        border-left: 3px solid #f59e0b;
        border-radius: 4px;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 11px;
        color: #6b7280;
      `;

      const platformText = item.platform.charAt(0).toUpperCase() + item.platform.slice(1);
      const blockTypeText = item.blockType.replace('_', ' ');
      header.innerHTML = `
        <span><strong>${platformText}</strong> • ${blockTypeText}</span>
        <span>${item.timeAgo}</span>
      `;

      const reasonText = document.createElement('div');
      reasonText.style.cssText = `
        font-size: 13px;
        color: #374151;
        font-style: italic;
        line-height: 1.4;
      `;
      reasonText.textContent = `"${item.reason}"`;

      reasonItem.appendChild(header);
      reasonItem.appendChild(reasonText);
      reasonsContainer.appendChild(reasonItem);
    });
  } else if (reasonsSection) {
    reasonsSection.style.display = 'none';
  }
}

// Load all settings from sites.json and Chrome storage
function loadAllSettings() {
  // Load sites.json structure via background script
  SafeChromeAPI.runtime.sendMessage({ type: 'GET_SITES_CONFIG' }, (response) => {
    let sitesConfig;
    if (response && response.success && response.config) {
      sitesConfig = response.config;
    } else {
      console.warn('No sites config returned, using defaults');
      sitesConfig = getDefaultSitesConfig();
    }

    // Load Chrome storage settings
    SafeChromeAPI.storage.get(['creativityGuardSocialMedia'], (result) => {
      try {
        const storageSettings = result.creativityGuardSocialMedia || {};

        // Merge sites.json and storage settings
        const mergedSettings = mergeSitesConfigWithStorage(sitesConfig, storageSettings);

        // Update UI with merged settings
        updateAllUIElements(mergedSettings, sitesConfig);

      } catch (error) {
        console.error('Error processing settings:', error);
        ErrorSystem.showError(`Failed to load settings: ${error.message}`);

        // Fallback to defaults
        const defaults = getDefaultSitesConfig();
        updateAllUIElements(defaults, defaults);
      }
    });
  });
}

// Get default sites configuration
function getDefaultSitesConfig() {
  return {
    aiSites: { enabled: false, sites: [] },
    socialMediaSites: { enabled: true, sites: [] },
    newsSites: { enabled: false, sites: [] },
    customSites: { enabled: true, sites: [] },
    settings: {
      allowedAfterHour: 15,
      allowedEndHour: 19,
      redirectUrl: 'https://weeatrobots.substack.com',
      vacationMode: false,
      totalWeekendBlock: false
    }
  };
}

// Merge sites.json configuration with Chrome storage settings
function mergeSitesConfigWithStorage(sitesConfig, storageSettings) {
  return {
    ...sitesConfig,
    settings: {
      ...sitesConfig.settings,
      ...storageSettings,
      // Ensure redirect URL default
      redirectUrl: storageSettings.redirectUrl || sitesConfig.settings?.redirectUrl || 'https://weeatrobots.substack.com'
    }
  };
}

// Update all UI elements with new structure
function updateAllUIElements(mergedSettings, sitesConfig) {
  try {
    // Update AI Think First toggle (in Social Media tab)
    const enableAIThinkFirst = document.getElementById('enableAIThinkFirst');
    if (enableAIThinkFirst) {
      enableAIThinkFirst.checked = sitesConfig.aiSites?.enabled || false;
    }

    // Update Social Media toggle (in AI Stats tab)
    const enableSocialMedia = document.getElementById('enableSocialMedia');
    if (enableSocialMedia) {
      enableSocialMedia.checked = sitesConfig.socialMediaSites?.enabled || false;
    }

    // Update News Sites toggle (in AI Stats tab)
    const enableNewsSites = document.getElementById('enableNewsSites');
    if (enableNewsSites) {
      enableNewsSites.checked = sitesConfig.newsSites?.enabled || false;
    }

    // Update time settings - using unified allowedAfterTime for all
    const allowedAfterTime = document.getElementById('allowedAfterTime');
    if (allowedAfterTime) {
      const hour = mergedSettings.settings?.allowedAfterHour || 15;
      allowedAfterTime.value = `${hour.toString().padStart(2, '0')}:00`;
    }

    const allowedEndTime = document.getElementById('allowedEndTime');
    if (allowedEndTime) {
      const hour = mergedSettings.settings?.allowedEndHour || 19;
      allowedEndTime.value = `${hour.toString().padStart(2, '0')}:00`;
    }

    // Update checkboxes
    const totalWeekendBlock = document.getElementById('totalWeekendBlock');
    if (totalWeekendBlock) {
      totalWeekendBlock.checked = mergedSettings.settings?.totalWeekendBlock || false;
    }

    const vacationMode = document.getElementById('vacationMode');
    if (vacationMode) {
      vacationMode.checked = mergedSettings.settings?.vacationMode || false;
    }

    // Update redirect URL with default
    const redirectUrl = document.getElementById('redirectUrl');
    if (redirectUrl) {
      redirectUrl.value = mergedSettings.settings?.redirectUrl || 'https://weeatrobots.substack.com';
    }

    // Update custom sites list
    updateCustomSitesList(sitesConfig.customSites?.sites || []);

  } catch (error) {
    console.error('Error updating UI elements:', error);
    ErrorSystem.showError('Failed to update UI elements');
  }
}

// Update custom sites list display
function updateCustomSitesList(customSites) {
  const customSitesList = document.getElementById('custom-sites-list');
  if (!customSitesList) return;

  customSitesList.innerHTML = '';

  if (!customSites || customSites.length === 0) {
    customSitesList.innerHTML = '<div class="helper-text">No custom sites added yet</div>';
    return;
  }

  customSites.forEach((site, index) => {
    const siteItem = document.createElement('div');
    siteItem.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      margin-bottom: 6px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    `;

    const siteInfo = document.createElement('div');
    siteInfo.style.cssText = 'flex: 1;';
    siteInfo.innerHTML = `
      <div style="font-weight: 500; color: #374151;">${site.name || site.domain}</div>
      <div style="font-size: 12px; color: #6b7280;">${site.domain}</div>
    `;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.style.cssText = `
      padding: 4px 8px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    `;
    removeButton.onclick = () => removeCustomSite(site.domain);

    siteItem.appendChild(siteInfo);
    siteItem.appendChild(removeButton);
    customSitesList.appendChild(siteItem);
  });
}

// Set up new UI handlers for sites.json integration
function setupNewUIHandlers() {
  // AI Think First toggle handler (in Social Media tab)
  const enableAIThinkFirst = document.getElementById('enableAIThinkFirst');
  if (enableAIThinkFirst) {
    const handler = () => {
      updateSitesConfig('aiSites', 'enabled', enableAIThinkFirst.checked);
      // Also update Chrome storage for backward compatibility
      updateSettings('enableAIThinkFirst', enableAIThinkFirst.checked);
    };
    enableAIThinkFirst.addEventListener('change', handler);
    PopupCleanup.trackEventListener(enableAIThinkFirst, 'change', handler);
  }

  // Social Media toggle handler (in AI Stats tab) - controls all social media sites
  const enableSocialMedia = document.getElementById('enableSocialMedia');
  if (enableSocialMedia) {
    const handler = () => {
      updateSitesConfig('socialMediaSites', 'enabled', enableSocialMedia.checked);
      // Also update Chrome storage for backward compatibility
      updateSettings('enableSocialMedia', enableSocialMedia.checked);
    };
    enableSocialMedia.addEventListener('change', handler);
    PopupCleanup.trackEventListener(enableSocialMedia, 'change', handler);
  }

  // News Sites toggle handler (in AI Stats tab)
  const enableNewsSites = document.getElementById('enableNewsSites');
  if (enableNewsSites) {
    const handler = () => {
      updateSitesConfig('newsSites', 'enabled', enableNewsSites.checked);
      // Also update Chrome storage for backward compatibility
      updateSettings('enableNewsSites', enableNewsSites.checked);
    };
    enableNewsSites.addEventListener('change', handler);
    PopupCleanup.trackEventListener(enableNewsSites, 'change', handler);
  }

  // Time settings handlers - unified allowedAfterTime for all sites
  const allowedAfterTime = document.getElementById('allowedAfterTime');
  if (allowedAfterTime) {
    const handler = () => {
      try {
        const validation = ValidationUtils.validateTimeInput(allowedAfterTime.value, 'Allowed after time');
        updateSettings('allowedAfterHour', validation.hour);
        // Also update sites.json settings
        updateSitesConfig('settings', 'allowedAfterHour', validation.hour);
        InputValidation.showValidation('allowedAfterTime', true);
      } catch (error) {
        InputValidation.showValidation('allowedAfterTime', false, error.message);
      }
    };
    allowedAfterTime.addEventListener('change', handler);
    allowedAfterTime.addEventListener('blur', handler);
    PopupCleanup.trackEventListener(allowedAfterTime, 'change', handler);
    PopupCleanup.trackEventListener(allowedAfterTime, 'blur', handler);
  }

  const allowedEndTime = document.getElementById('allowedEndTime');
  if (allowedEndTime) {
    const handler = () => {
      try {
        const validation = ValidationUtils.validateTimeInput(allowedEndTime.value, 'Allowed end time');
        updateSettings('allowedEndHour', validation.hour);
        // Also update sites.json settings
        updateSitesConfig('settings', 'allowedEndHour', validation.hour);
        InputValidation.showValidation('allowedEndTime', true);
        InputValidation.validateTimeLogic();
      } catch (error) {
        InputValidation.showValidation('allowedEndTime', false, error.message);
      }
    };
    allowedEndTime.addEventListener('change', handler);
    allowedEndTime.addEventListener('blur', handler);
    PopupCleanup.trackEventListener(allowedEndTime, 'change', handler);
    PopupCleanup.trackEventListener(allowedEndTime, 'blur', handler);
  }

  // Other settings handlers - sync both Chrome storage and sites.json
  const totalWeekendBlock = document.getElementById('totalWeekendBlock');
  if (totalWeekendBlock) {
    const handler = () => {
      updateSettings('totalWeekendBlock', totalWeekendBlock.checked);
      updateSitesConfig('settings', 'totalWeekendBlock', totalWeekendBlock.checked);
    };
    totalWeekendBlock.addEventListener('change', handler);
    PopupCleanup.trackEventListener(totalWeekendBlock, 'change', handler);
  }

  const vacationMode = document.getElementById('vacationMode');
  if (vacationMode) {
    const handler = () => {
      updateSettings('vacationMode', vacationMode.checked);
      updateSitesConfig('settings', 'vacationMode', vacationMode.checked);
    };
    vacationMode.addEventListener('change', handler);
    PopupCleanup.trackEventListener(vacationMode, 'change', handler);
  }

  const redirectUrl = document.getElementById('redirectUrl');
  if (redirectUrl) {
    const handler = () => {
      try {
        const validatedUrl = ValidationUtils.validateUrl(redirectUrl.value || 'https://weeatrobots.substack.com', 'Redirect URL');
        updateSettings('redirectUrl', validatedUrl);
        updateSitesConfig('settings', 'redirectUrl', validatedUrl);
        InputValidation.showValidation('redirectUrl', true);
      } catch (error) {
        InputValidation.showValidation('redirectUrl', false, error.message);
      }
    };
    redirectUrl.addEventListener('change', handler);
    redirectUrl.addEventListener('blur', handler);
    PopupCleanup.trackEventListener(redirectUrl, 'change', handler);
    PopupCleanup.trackEventListener(redirectUrl, 'blur', handler);
  }

  // Custom sites handlers
  const addCustomSiteBtn = document.getElementById('add-custom-site');
  if (addCustomSiteBtn) {
    const handler = () => addCustomSite();
    addCustomSiteBtn.addEventListener('click', handler);
    PopupCleanup.trackEventListener(addCustomSiteBtn, 'click', handler);
  }

  const newCustomSiteInput = document.getElementById('new-custom-site');
  if (newCustomSiteInput) {
    const handler = (e) => {
      if (e.key === 'Enter') {
        addCustomSite();
      }
    };
    newCustomSiteInput.addEventListener('keypress', handler);
    PopupCleanup.trackEventListener(newCustomSiteInput, 'keypress', handler);
  }

  // Edit sites.json button handler
  const editSitesJsonBtn = document.getElementById('edit-sites-json');
  if (editSitesJsonBtn) {
    const handler = () => {
      SafeChromeAPI.runtime.sendMessage({ type: 'OPEN_SITES_JSON' }, (response) => {
        if (response && response.success) {
          ErrorSystem.showSuccess('Opening sites.json file...');
        } else {
          ErrorSystem.showError('Failed to open sites.json file');
        }
      });
    };
    editSitesJsonBtn.addEventListener('click', handler);
    PopupCleanup.trackEventListener(editSitesJsonBtn, 'click', handler);
  }
}

// Update sites.json configuration
function updateSitesConfig(category, key, value) {
  SafeChromeAPI.runtime.sendMessage({
    type: 'UPDATE_SITES_CONFIG',
    category: category,
    key: key,
    value: value
  }, (response) => {
    if (response && response.success) {
      // Configuration updated successfully
    } else {
      ErrorSystem.showError('Failed to update site configuration');
    }
  });
}

// Update settings in both sites.json and Chrome storage
function updateSettings(key, value) {
  // Update Chrome storage
  SafeChromeAPI.storage.get(['creativityGuardSocialMedia'], (result) => {
    const settings = result.creativityGuardSocialMedia || {};
    settings[key] = value;

    SafeChromeAPI.storage.set({ creativityGuardSocialMedia: settings }, (success) => {
      if (success) {
        // Also update sites.json via background script
        SafeChromeAPI.runtime.sendMessage({
          type: 'UPDATE_SITES_CONFIG',
          category: 'settings',
          key: key,
          value: value
        });
      } else {
        ErrorSystem.showError('Failed to save setting');
      }
    });
  });
}

// Add custom site
function addCustomSite() {
  const input = document.getElementById('new-custom-site');
  if (!input) return;

  const rawDomain = input.value.trim();
  if (!rawDomain) {
    ErrorSystem.showError('Please enter a domain name');
    return;
  }

  // Clean the domain (remove protocol, www, etc.)
  const domain = cleanDomainInput(rawDomain);

  // Validate domain format
  if (!isValidDomain(domain)) {
    ErrorSystem.showError('Please enter a valid domain (e.g., example.com)');
    return;
  }

  // Check for duplicates by getting current sites first
  SafeChromeAPI.runtime.sendMessage({ type: 'GET_SITES_CONFIG' }, (sitesConfig) => {
    const currentSites = sitesConfig?.customSites?.sites || [];
    const isDuplicate = currentSites.some(site => site.domain.toLowerCase() === domain.toLowerCase());

    if (isDuplicate) {
      ErrorSystem.showError(`${domain} is already in your custom sites list`);
      return;
    }

    // Add to sites.json via background script
    SafeChromeAPI.runtime.sendMessage({
      type: 'ADD_CUSTOM_SITE',
      site: {
        domain: domain,
        name: domain.charAt(0).toUpperCase() + domain.slice(1)
      }
    }, (response) => {
      if (response && response.success) {
        input.value = '';
        ErrorSystem.showSuccess(`Added ${domain} to custom sites`);
        // Reload settings to update UI
        loadAllSettings();
      } else {
        ErrorSystem.showError('Failed to add custom site: ' + (response?.error || 'Unknown error'));
      }
    });
  });
}

// Remove custom site
function removeCustomSite(domain) {
  SafeChromeAPI.runtime.sendMessage({
    type: 'REMOVE_CUSTOM_SITE',
    domain: domain
  }, (response) => {
    if (response && response.success) {
      ErrorSystem.showSuccess('Removed custom site');
      // Reload settings to update UI
      loadAllSettings();
    } else {
      ErrorSystem.showError('Failed to remove custom site');
    }
  });
}

// Clean domain input by removing protocol, www, paths, etc.
function cleanDomainInput(domain) {
  if (!domain || typeof domain !== 'string') {
    return '';
  }

  let cleanDomain = domain.trim().toLowerCase();

  // Remove protocol if present
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '');

  // Remove www prefix
  cleanDomain = cleanDomain.replace(/^www\./, '');

  // Remove path, query params, and fragments
  cleanDomain = cleanDomain.split('/')[0].split('?')[0].split('#')[0];

  // Remove port if present
  cleanDomain = cleanDomain.split(':')[0];

  return cleanDomain;
}

// Validate domain format with enhanced validation
function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  const cleanDomain = cleanDomainInput(domain);

  // Basic domain format validation
  const domainRegex = /^([a-z0-9-]+\.)*[a-z0-9-]+\.[a-z]{2,}$/i;

  // Check for invalid characters and patterns
  if (cleanDomain.includes(' ') || cleanDomain.includes('/') || cleanDomain.includes(':')) {
    return false;
  }

  return domainRegex.test(cleanDomain);
}

// Legacy function for backward compatibility - now delegates to new system
function saveSocialMediaSettings() {
  // This function is maintained for backward compatibility but the new handlers
  // save settings automatically when changed
  console.log('saveSocialMediaSettings called - settings are now saved automatically');
}

// Legacy function maintained for compatibility
function collectAndValidateSettings() {
  // This function is maintained for backward compatibility
  // Settings collection is now handled by individual input handlers
  return {};
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
      const validated = ValidationUtils.validateUrl(input.value || 'https://weeatrobots.substack.com', fieldName);
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
    const startTimeInput = document.getElementById('allowedAfterTime');

    if (!endTimeInput || !startTimeInput) return true;

    const endHour = parseInt((endTimeInput.value || '19:00').split(':')[0], 10);
    const startHour = parseInt((startTimeInput.value || '15:00').split(':')[0], 10);

    let allValid = true;

    if (startHour >= endHour) {
      this.showValidation('allowedAfterTime', false, 'Start time must be before end time');
      allValid = false;
    } else {
      // Clear any previous time logic errors
      const errorDiv = document.getElementById('allowedAfterTime-error');
      if (errorDiv && errorDiv.textContent.includes('must be before end time')) {
        this.showValidation('allowedAfterTime', true);
      }
    }

    return allValid;
  }
};

// Legacy settings configuration removed - new handlers are set up in setupNewUIHandlers()


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