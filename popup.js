// Load stats when popup opens
document.addEventListener('DOMContentLoaded', function() {
  // Get stats from storage
  chrome.storage.local.get(['creativityGuardStats'], function(result) {
    if (result.creativityGuardStats) {
      updateStatsDisplay(result.creativityGuardStats);
    }
  });
  
  // Set up reset button
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
});

// Update the stats display
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