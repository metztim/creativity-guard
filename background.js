// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SOCIAL_MEDIA_SETTINGS') {
    chrome.storage.local.get(['creativityGuardSocialMedia'], (result) => {
      sendResponse(result.creativityGuardSocialMedia || null);
    });
    return true; // Required for async response
  }
  
  if (request.type === 'SET_SOCIAL_MEDIA_SETTINGS') {
    chrome.storage.local.set({
      creativityGuardSocialMedia: request.settings
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
}); 