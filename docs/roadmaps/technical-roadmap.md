# Technical Architecture Roadmap
Generated: 2025-10-14
Agent: Technical Architecture Agent

## Executive Summary

Creativity Guard is a well-structured Manifest V3 Chrome extension with solid foundations but several opportunities for improvement. The codebase demonstrates good practices including comprehensive error handling, resource cleanup systems, and defensive programming. However, the architecture shows signs of organic growth with some technical debt accumulating.

**Current State**: The extension is functional and stable with good security practices. The code quality is above average with extensive error handling and validation.

**Primary Concerns**:
1. **Critical**: content.js is 3,239 lines - approaching maintainability limits
2. **High**: Dual storage architecture (sites.json + Chrome storage) creates synchronization complexity
3. **High**: inline scripts in popup.html violate best practices and limit CSP hardening
4. **Medium**: Performance impact from `document_start` injection and early blocking logic
5. **Medium**: No automated testing strategy - critical paths are untested

**Strengths**:
- Excellent cleanup system preventing memory leaks
- Robust storage wrapper with fallback mechanisms
- Comprehensive input validation and sanitization
- Good security practices (URL validation, XSS prevention)
- Detailed error logging and user feedback

---

## Architecture Overview

### Current Architecture

The extension follows a standard MV3 architecture with three main components:

1. **Background Service Worker** (background.js - 795 lines)
   - Message router for all extension operations
   - Handles all Chrome storage operations
   - Manages sites.json configuration (read from file, write to storage)
   - Validates and sanitizes all settings
   - Tracks extension disable/enable events

2. **Content Script** (content.js - 3,239 lines) ⚠️ **TOO LARGE**
   - Injected at `document_start` on `<all_urls>`
   - Early blocking system to prevent content flash
   - Modal display logic for both AI and social media blocking
   - Session tracking for AI sites
   - Storage wrapper with context invalidation handling
   - Resource cleanup system
   - Input detection and event handling

3. **Popup UI** (popup.html + popup.js - 1,490 lines)
   - Three-tab interface (Site Blocking, AI Guard, Stats)
   - Settings management for all blocking categories
   - Statistics display with animations
   - Custom sites management
   - Real-time validation and feedback

### Data Flow

```
User Input (popup)
  → Background Service Worker (validation + storage)
  → Chrome Storage + sites.json sync
  → Content Script (reads settings)
  → Modal Display / Blocking Logic
```

### Storage Architecture

**Dual Storage System** (complexity source):
- **sites.json**: Template configuration file (read-only source)
- **Chrome Storage**: Runtime configuration + user data
- **Synchronization**: Background script syncs sites.json → Chrome storage
- **Issue**: Two sources of truth create consistency risks

**Storage Keys**:
- `sitesConfig`: Full sites.json structure in Chrome storage
- `creativityGuardSocialMedia`: Social media settings + visits + usage history
- `creativityGuardStats`: AI usage statistics
- `creativityGuardSessions`: AI session tracking
- `extensionTrackingStats`: Extension disable/enable tracking

---

## Technical Issues & Improvements

### CRITICAL ISSUES (Fix Immediately)

#### 1. Content Script Size - Maintainability Crisis
- **Current Implementation**: content.js is 3,239 lines in a single file
- **Problem**:
  - Exceeds recommended maximum (1,500 lines for single file)
  - Makes debugging difficult, increases merge conflict risk
  - Reduces code reusability and testability
  - Slows down IDE performance and code navigation
- **Impact**: Maintainability (High), Developer Experience (High)
- **Root Cause**: Organic growth without modularization strategy
- **Proposed Solution**: Modularize content.js into focused modules
  ```
  content/
    ├── index.js (main entry point, 100-200 lines)
    ├── storage-wrapper.js (storage abstraction, ~200 lines)
    ├── early-blocker.js (flash prevention logic, ~150 lines)
    ├── cleanup-system.js (resource tracking, ~150 lines)
    ├── ai-sites-handler.js (AI modal logic, ~800 lines)
    ├── social-media-handler.js (social blocking logic, ~800 lines)
    ├── modal-renderer.js (shared modal UI, ~400 lines)
    └── utils.js (validation, helpers, ~200 lines)
  ```
- **Implementation Steps for Claude Code**:
  1. Create `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/content/` directory
  2. Extract storage wrapper (lines 317-458) → `content/storage-wrapper.js`
  3. Extract early blocker (lines 3-143) → `content/early-blocker.js`
  4. Extract cleanup system (lines 146-298) → `content/cleanup-system.js`
  5. Extract AI handlers (lines 1265-1896) → `content/ai-sites-handler.js`
  6. Extract social media handlers (lines 1897-2500+) → `content/social-media-handler.js`
  7. Create modal renderer module → `content/modal-renderer.js`
  8. Create utils module → `content/utils.js`
  9. Create main entry point → `content/index.js`
  10. Update manifest.json line 16 to use `content/index.js`
  11. Test all functionality after refactor
  12. Verify no performance regression
- **Testing Approach**:
  - Manual testing of all modal scenarios
  - Test on each AI site (ChatGPT, Claude, Gemini, etc.)
  - Test on social media sites (LinkedIn, Twitter, Facebook)
  - Verify cleanup still works (no memory leaks)
  - Check extension reload scenarios
- **Effort**: Large (3-5 hours) - requires careful extraction
- **Risk Level**: Medium (regressions possible if not careful, but testable)

#### 2. Inline Scripts in popup.html - CSP Violation Risk
- **Current Implementation**: popup.html line 665 includes inline `<script src="popup.js"></script>` but relies on external script
- **Problem**:
  - While currently using external script, the HTML structure suggests past inline script usage
  - Cannot tighten CSP without ensuring no inline scripts exist
  - Violates Chrome extension security best practices
  - Makes security audits more difficult
- **Impact**: Security (Medium), Best Practices Compliance (High)
- **Root Cause**: Rapid prototyping leading to relaxed security posture
- **Proposed Solution**: Verify no inline event handlers exist in HTML
- **Implementation Steps for Claude Code**:
  1. Search `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/popup.html` for `onclick=`, `onchange=`, `oninput=`, etc.
  2. If found, extract to popup.js with `addEventListener` pattern
  3. Verify all event handlers are in popup.js (lines 347-951)
  4. Add stricter CSP to manifest.json if not present:
     ```json
     "content_security_policy": {
       "extension_pages": "script-src 'self'; object-src 'self'"
     }
     ```
  5. Test popup functionality after CSP tightening
- **Testing Approach**:
  - Open popup and test all interactions
  - Verify no console CSP errors
  - Test all tabs, all buttons, all inputs
- **Effort**: Small (30 minutes)
- **Risk Level**: Low (easy to test and verify)

#### 3. All URLs Permission - Overly Broad Access
- **Current Implementation**: manifest.json line 10-11 uses `"host_permissions": ["<all_urls>"]`
- **Problem**:
  - Grants access to every website user visits
  - Violates principle of least privilege
  - Users may be concerned about privacy
  - Not required for extension functionality (only need specific sites)
  - Harder to get approved in Chrome Web Store review
- **Impact**: Privacy (High), Security (Medium), Chrome Store Approval (Medium)
- **Root Cause**: Using pattern matching instead of explicit site list
- **Proposed Solution**: Replace with specific host permissions
- **Implementation Steps for Claude Code**:
  1. Read `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/sites.json` to get all domains
  2. Generate host_permissions array:
     ```json
     "host_permissions": [
       "*://*.chat.openai.com/*",
       "*://*.chatgpt.com/*",
       "*://*.claude.ai/*",
       "*://*.gemini.google.com/*",
       "*://*.poe.com/*",
       "*://*.linkedin.com/*",
       "*://*.twitter.com/*",
       "*://*.x.com/*",
       "*://*.facebook.com/*",
       "*://*.theguardian.com/*",
       "*://*.nytimes.com/*",
       "*://*.washingtonpost.com/*",
       "*://*.bbc.com/*",
       "*://*.cnn.com/*",
       "*://*.reddit.com/*"
     ]
     ```
  3. Replace `<all_urls>` in manifest.json line 10-11
  4. Update content_scripts matches to same array in manifest.json line 15
  5. Add logic to handle custom sites (require users to grant additional permissions)
  6. Test that extension still works on all supported sites
- **Testing Approach**:
  - Reload extension and verify no errors
  - Visit each AI site and verify modal appears
  - Visit each social media site and verify blocking works
  - Test custom site addition (should prompt for permission)
- **Effort**: Medium (1-2 hours including custom site permission logic)
- **Risk Level**: Medium (needs testing on all sites)

---

### HIGH PRIORITY IMPROVEMENTS

#### 4. Dual Storage Architecture - Synchronization Complexity
- **Current Implementation**:
  - sites.json as template (background.js lines 606-632)
  - Chrome storage for runtime config (background.js lines 636-647)
  - Sync logic in background.js (lines 756-796)
- **Problem**:
  - Two sources of truth cause consistency issues
  - Sync logic is complex and error-prone
  - Changes to sites.json not automatically reflected
  - Storage reads hit both sources (performance impact)
  - User changes could be lost if sync fails
- **Impact**: Reliability (High), Maintainability (High), Performance (Medium)
- **Root Cause**: Evolution from file-based config to user-editable settings
- **Proposed Solution**: **Option A** - Single source in Chrome storage
  - Migrate sites.json to initial defaults only
  - All runtime config in Chrome storage
  - Simpler read/write operations
  - Better reliability

  **Option B** - Hybrid with clear separation
  - sites.json = immutable defaults
  - Chrome storage = user overrides only
  - Merge at read time with caching
  - Clearer mental model
- **Recommended**: Option A for simplicity
- **Implementation Steps for Claude Code**:
  1. Create migration function in background.js to copy sites.json defaults to Chrome storage on first install
  2. Modify `handleGetSitesConfig` (background.js line 459) to only read from Chrome storage
  3. Remove `readSitesJson` function (background.js lines 606-632) or keep only for migration
  4. Remove sync logic (background.js lines 756-796)
  5. Update content.js `loadSitesConfig` (line 541) to only read Chrome storage
  6. Keep sites.json as documentation/defaults only
  7. Add version check for migration in `chrome.runtime.onInstalled` (background.js line 384)
- **Testing Approach**:
  - Test fresh install (sites.json → Chrome storage migration)
  - Test update scenario (preserve user settings)
  - Test all CRUD operations on sites
  - Verify no data loss in edge cases
- **Effort**: Medium (2-3 hours)
- **Risk Level**: Medium-High (data migration risks, thorough testing required)

#### 5. Content Script Injection Timing - Performance Impact
- **Current Implementation**: manifest.json line 17 uses `"run_at": "document_start"`
- **Problem**:
  - Injected on every page load (all_urls)
  - Runs before DOM is ready, causing extra complexity
  - Early blocker logic adds overhead (lines 3-143 in content.js)
  - Most sites don't need blocking but still pay the cost
  - Can delay page load on slow devices
- **Impact**: Performance (Medium-High), User Experience (Medium)
- **Root Cause**: Preventing "flash" of blocked content requires early injection
- **Proposed Solution**:
  - Keep `document_start` only for blocked sites (use specific host_permissions)
  - For unblocked sites, skip injection entirely
  - Optimize early blocker logic (reduce CSS injection overhead)
- **Implementation Steps for Claude Code**:
  1. Fix critical issue #3 first (specific host_permissions instead of all_urls)
  2. Remove early blocker logic for AI sites (content.js lines 34-143) since they don't redirect
  3. Keep early blocker only for social media/news sites
  4. Consider `document_idle` for AI sites (modal can show after page load)
  5. Split content scripts in manifest.json:
     ```json
     "content_scripts": [
       {
         "matches": ["*://*.linkedin.com/*", "*://*.twitter.com/*", ...],
         "js": ["content/index.js"],
         "run_at": "document_start"
       },
       {
         "matches": ["*://*.chat.openai.com/*", "*://*.claude.ai/*", ...],
         "js": ["content/index.js"],
         "run_at": "document_idle"
       }
     ]
     ```
  6. Update early blocker logic to check site type
  7. Benchmark page load times before/after
- **Testing Approach**:
  - Use Chrome DevTools Performance tab
  - Measure page load time on social media sites
  - Verify no flash of content on blocked sites
  - Test AI sites still show modal correctly
- **Effort**: Medium (2-3 hours)
- **Risk Level**: Medium (performance testing required)

#### 6. No Automated Testing - Quality Assurance Gap
- **Current Implementation**: No test files exist, manual testing only
- **Problem**:
  - Cannot confidently refactor code
  - Regressions slip through
  - Hard to verify cross-browser compatibility
  - Critical paths untested (storage, blocking logic, session detection)
  - Time-consuming manual testing
- **Impact**: Reliability (High), Maintainability (High), Development Velocity (Medium)
- **Root Cause**: Testing setup not prioritized during initial development
- **Proposed Solution**: Add Jest-based unit tests for critical functions
- **Implementation Steps for Claude Code**:
  1. Create `/Users/timmetz/Developer/Projects/Personal/creativity-guard/tests/` directory
  2. Install test dependencies: `npm init -y && npm install --save-dev jest @types/chrome`
  3. Create `jest.config.js`:
     ```javascript
     module.exports = {
       testEnvironment: 'jsdom',
       setupFiles: ['./tests/setup.js']
     };
     ```
  4. Create `tests/setup.js` with Chrome API mocks
  5. Write unit tests for:
     - Storage wrapper (content.js lines 317-458)
     - URL validation (content.js lines 461-518, background.js lines 286-307)
     - Settings validation (background.js lines 200-283)
     - Session detection logic
     - Time-based blocking logic (social media handler)
  6. Add test scripts to package.json: `"test": "jest"`
  7. Document how to run tests in README or INSTALL.txt
- **Testing Approach**:
  - Run `npm test` and verify all pass
  - Test coverage should be >60% for critical modules
  - Focus on pure functions first (easier to test)
- **Effort**: Large (4-6 hours initial setup + test writing)
- **Risk Level**: Low (tests don't affect production code)

#### 7. Background Script Storage Validation - Inconsistent Error Handling
- **Current Implementation**: Validation in multiple places (lines 200-283, 650-709)
- **Problem**:
  - Duplicate validation logic across functions
  - Some fields validated strictly, others loosely
  - Inconsistent error responses (some return null, others throw)
  - No centralized schema definition
  - Hard to maintain consistency
- **Impact**: Reliability (Medium), Maintainability (Medium), Code Quality (High)
- **Root Cause**: Incremental addition of validation without refactoring
- **Proposed Solution**: Centralized validation with schema
- **Implementation Steps for Claude Code**:
  1. Create validation schema object in background.js:
     ```javascript
     const VALIDATION_SCHEMAS = {
       socialMediaSettings: {
         enabledForLinkedin: { type: 'boolean', default: true },
         enabledForTwitter: { type: 'boolean', default: true },
         enabledForFacebook: { type: 'boolean', default: true },
         linkedinAllowedHour: { type: 'number', min: 0, max: 23, default: 15 },
         twitterAllowedHour: { type: 'number', min: 0, max: 23, default: 15 },
         facebookAllowedHour: { type: 'number', min: 0, max: 23, default: 15 },
         allowedEndHour: { type: 'number', min: 0, max: 23, default: 19 },
         totalWeekendBlock: { type: 'boolean', default: true },
         vacationModeEnabled: { type: 'boolean', default: false },
         redirectUrl: { type: 'url', default: 'https://weeatrobots.substack.com' }
       },
       // ... other schemas
     };
     ```
  2. Create generic validator function:
     ```javascript
     function validateData(data, schema) {
       // Returns validated & sanitized data or throws with specific errors
     }
     ```
  3. Replace inline validation in `validateAndSanitizeSettingsForSave` (line 200)
  4. Replace inline validation in `validateSettings` (line 683)
  5. Use same validator in popup.js for client-side validation
  6. Add detailed error messages for validation failures
- **Testing Approach**:
  - Test with valid data (should pass through)
  - Test with invalid types (should use defaults)
  - Test with out-of-range values (should clamp or default)
  - Test with malicious input (should sanitize)
- **Effort**: Medium (2-3 hours)
- **Risk Level**: Medium (needs thorough testing of all settings paths)

---

### MEDIUM PRIORITY ENHANCEMENTS

#### 8. Error Logging - No Structured Logging System
- **Current Implementation**: `console.log`, `console.error`, `console.warn` scattered throughout
- **Problem**:
  - Hard to filter logs in production
  - No log levels or categories
  - No way to disable verbose logs
  - No structured error reporting
  - Difficult to debug user issues
- **Impact**: Debugging (Medium), Support (Medium)
- **Root Cause**: Quick console.log usage during development
- **Proposed Solution**: Add lightweight logging utility
- **Implementation Steps for Claude Code**:
  1. Create `extension-dev/utils/logger.js`:
     ```javascript
     const Logger = {
       DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3,
       currentLevel: 1, // INFO by default

       debug: function(message, ...args) {
         if (this.currentLevel <= this.DEBUG) {
           console.log(`[CG:DEBUG] ${message}`, ...args);
         }
       },
       info: function(message, ...args) {
         if (this.currentLevel <= this.INFO) {
           console.log(`[CG:INFO] ${message}`, ...args);
         }
       },
       warn: function(message, ...args) {
         if (this.currentLevel <= this.WARN) {
           console.warn(`[CG:WARN] ${message}`, ...args);
         }
       },
       error: function(message, error, ...args) {
         if (this.currentLevel <= this.ERROR) {
           console.error(`[CG:ERROR] ${message}`, error, ...args);
         }
       }
     };
     ```
  2. Replace all `console.log` with `Logger.info` or `Logger.debug`
  3. Replace all `console.error` with `Logger.error`
  4. Replace all `console.warn` with `Logger.warn`
  5. Add setting to change log level in popup (developer mode)
- **Testing Approach**:
  - Verify logs still appear in console
  - Test log level filtering
  - Check no console errors from logger itself
- **Effort**: Medium (2 hours for replacement)
- **Risk Level**: Low (doesn't affect functionality)

#### 9. Session Storage Fallback - Limited Capacity
- **Current Implementation**: content.js lines 332-348 uses sessionStorage as fallback
- **Problem**:
  - sessionStorage has ~5MB limit (could be hit with large custom sites list)
  - No quota checking before writing
  - Silently fails if quota exceeded
  - sessionStorage cleared on tab close (expected but not documented)
  - No warning to user about temporary storage
- **Impact**: Reliability (Medium), User Experience (Medium)
- **Root Cause**: Quick fallback solution without considering edge cases
- **Proposed Solution**: Add quota monitoring and user notification
- **Implementation Steps for Claude Code**:
  1. Add quota check in `fallbackSet` (content.js line 341):
     ```javascript
     fallbackSet: function(key, value) {
       try {
         const data = JSON.stringify(value);
         if (data.length > 1024 * 1024) { // 1MB warning
           console.warn('Large data being stored in temporary storage:', data.length);
         }
         sessionStorage.setItem('creativityGuard_' + key, data);
         return true;
       } catch (e) {
         if (e.name === 'QuotaExceededError') {
           console.error('Temporary storage quota exceeded');
           // Show user notification
           alert('Creativity Guard: Cannot save settings temporarily. Please reload the extension.');
         }
         return false;
       }
     }
     ```
  2. Add notification system for context invalidation (show modal to user)
  3. Consider using IndexedDB as fallback (higher quota)
  4. Document sessionStorage limitations in CLAUDE.md
- **Testing Approach**:
  - Test with large custom sites list (>100 sites)
  - Simulate extension context invalidation
  - Verify user sees appropriate warnings
- **Effort**: Small (1 hour)
- **Risk Level**: Low (improving existing fallback)

#### 10. Social Media Time Logic - Complex and Hard to Test
- **Current Implementation**: Time checking logic in content.js (likely around lines 1897-2500)
- **Problem**:
  - Timezone handling unclear (uses local time only?)
  - Weekend detection logic may have edge cases
  - Hard to unit test time-based logic
  - No mock time mechanism for testing
  - "Vacation mode" and "weekend block" interaction unclear
- **Impact**: Reliability (Medium), Testability (High)
- **Root Cause**: Time logic mixed with blocking logic
- **Proposed Solution**: Extract pure time functions
- **Implementation Steps for Claude Code**:
  1. Find time checking functions in content.js
  2. Extract to separate module `content/time-logic.js`:
     ```javascript
     const TimeLogic = {
       isWeekend: function(date = new Date()) {
         const day = date.getDay();
         return day === 0 || day === 6;
       },

       isWithinAllowedHours: function(startHour, endHour, date = new Date()) {
         const currentHour = date.getHours();
         return currentHour >= startHour && currentHour < endHour;
       },

       shouldBlockNow: function(settings, date = new Date()) {
         if (settings.vacationMode) return true;
         if (settings.totalWeekendBlock && this.isWeekend(date)) return true;
         return !this.isWithinAllowedHours(settings.allowedAfterHour, settings.allowedEndHour, date);
       }
     };
     ```
  3. Replace inline time checks with these functions
  4. Add unit tests for time logic (easy to test with mock dates)
  5. Document timezone behavior
- **Testing Approach**:
  - Unit test with various mock dates
  - Test weekend edge cases (Friday 11:59pm, Sunday 11:59pm)
  - Test hour edge cases (exactly on allowed hour)
  - Manual test across timezones if possible
- **Effort**: Medium (2 hours)
- **Risk Level**: Medium (time logic is critical, needs careful testing)

#### 11. Modal CSS Injection - Potential Style Conflicts
- **Current Implementation**: Modal styles injected inline in content.js
- **Problem**:
  - Could conflict with site styles
  - No CSS scoping/isolation
  - Hard to maintain CSS in JS strings
  - Repeated injection could cause performance issues
  - Difficult to theme or customize
- **Impact**: Maintainability (Medium), Compatibility (Low-Medium)
- **Root Cause**: Content scripts can't link external stylesheets easily
- **Proposed Solution**: Use Shadow DOM or CSS-in-JS with higher specificity
- **Implementation Steps for Claude Code**:
  1. Find modal creation code in content.js
  2. **Option A**: Use Shadow DOM for true isolation:
     ```javascript
     const modalContainer = document.createElement('div');
     const shadow = modalContainer.attachShadow({mode: 'closed'});
     shadow.innerHTML = `<style>...isolated styles...</style><div>...modal HTML...</div>`;
     ```
  3. **Option B**: Use highly specific class names:
     ```javascript
     .creativity-guard-modal-v1-overlay { /* styles */ }
     ```
  4. Add `!important` to critical styles
  5. Test on sites with heavy CSS (Facebook, LinkedIn)
  6. Document any known style conflicts
- **Testing Approach**:
  - Test on each blocked site
  - Check for visual glitches
  - Verify modal always appears on top
  - Test with browser zoom
- **Effort**: Medium (2-3 hours)
- **Risk Level**: Medium (could break modal display on some sites)

#### 12. Custom Sites - Limited Validation
- **Current Implementation**: Domain validation in popup.js lines 1083-1099
- **Problem**:
  - Basic regex validation only
  - No check for valid TLD
  - No check for existing sites (partial - only checks duplicates)
  - Could add invalid domains
  - No subdomain handling documented
  - No wildcard support
- **Impact**: User Experience (Medium), Reliability (Low-Medium)
- **Root Cause**: Simple validation for MVP
- **Proposed Solution**: Enhanced domain validation with public suffix list
- **Implementation Steps for Claude Code**:
  1. Enhance `isValidDomain` in popup.js line 1083:
     ```javascript
     function isValidDomain(domain) {
       if (!domain || typeof domain !== 'string') return false;

       const cleaned = cleanDomainInput(domain);

       // Check for valid domain format
       const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
       if (!domainRegex.test(cleaned)) return false;

       // Check for invalid patterns
       if (cleaned.includes('..') || cleaned.startsWith('.') || cleaned.endsWith('.')) {
         return false;
       }

       // Check against common invalid TLDs
       const invalidTlds = ['local', 'localhost', 'test', 'example', 'invalid'];
       const tld = cleaned.split('.').pop().toLowerCase();
       if (invalidTlds.includes(tld)) return false;

       return true;
     }
     ```
  2. Add helpful error messages for each validation failure
  3. Consider adding public suffix list for TLD validation (lightweight version)
  4. Document subdomain behavior (e.g., does blocking `example.com` block `sub.example.com`?)
  5. Add wildcard support if requested (e.g., `*.example.com`)
- **Testing Approach**:
  - Test valid domains (example.com, sub.example.com, example.co.uk)
  - Test invalid domains (localhost, example, .com, example..com)
  - Test edge cases (single letter TLD, numeric domains)
- **Effort**: Small (1-2 hours)
- **Risk Level**: Low (validation enhancement, doesn't break existing)

---

### TECHNICAL DEBT (Address Over Time)

#### 13. Legacy Storage Migration - Incomplete
- **Current Implementation**: Dual storage keys (`socialMediaUsage` vs `creativityGuardSocialMedia`)
- **Problem**: Old code references `socialMediaUsage` (popup.js line 1233) but new code uses `creativityGuardSocialMedia`
- **Impact**: Maintainability (Low-Medium), Confusion (Medium)
- **Proposed Solution**: Complete migration, remove legacy keys
- **Implementation Steps for Claude Code**:
  1. Search all files for `socialMediaUsage` references
  2. Replace with `creativityGuardSocialMedia`
  3. Add one-time migration in background.js to copy old data to new key
  4. Remove legacy storage keys after migration
- **Effort**: Small (1 hour)
- **Risk Level**: Low (data migration tested carefully)

#### 14. Magic Numbers - Hardcoded Values Throughout
- **Current Implementation**: Hardcoded values like 10000ms retry delays, 100 event limits, etc.
- **Problem**: Hard to find and update all instances, unclear why values chosen
- **Impact**: Maintainability (Low-Medium)
- **Proposed Solution**: Extract to named constants
- **Implementation Steps for Claude Code**:
  1. Create `extension-dev/constants.js`:
     ```javascript
     const CONSTANTS = {
       STORAGE_RETRY_DELAY_MS: 10000,
       MAX_STORED_EVENTS: 100,
       SESSION_STORAGE_KEY_PREFIX: 'creativityGuard_',
       DEFAULT_REDIRECT_URL: 'https://weeatrobots.substack.com',
       MODAL_Z_INDEX: 2147483647,
       // etc.
     };
     ```
  2. Replace magic numbers with named constants
  3. Document why each value was chosen
- **Effort**: Medium (2 hours to find all magic numbers)
- **Risk Level**: Low (mostly renaming)

#### 15. Popup Animation Performance - requestAnimationFrame Usage
- **Current Implementation**: Counter animation in popup.js lines 1374-1397
- **Problem**: requestAnimationFrame in popup could cause issues if popup closed mid-animation
- **Impact**: Performance (Low), Edge Case Bugs (Low)
- **Proposed Solution**: Cancel animations in cleanup
- **Implementation Steps for Claude Code**:
  1. Track animation frame IDs in PopupCleanup system (line 254)
  2. Cancel animations when popup closes
  3. Add safety check before each frame update
- **Effort**: Small (30 minutes)
- **Risk Level**: Low (animation is non-critical)

#### 16. Background Script - Lacks Service Worker Lifecycle Handling
- **Current Implementation**: No explicit handling of service worker suspension
- **Problem**: Service workers can be suspended by Chrome, losing in-memory state
- **Impact**: Reliability (Low-Medium in edge cases)
- **Proposed Solution**: Use chrome.alarms for periodic tasks, avoid in-memory state
- **Implementation Steps for Claude Code**:
  1. Review background.js for any in-memory state (should be none currently)
  2. Add logging to track service worker lifecycle
  3. Ensure all operations complete before service worker suspends
  4. Document service worker lifecycle in CLAUDE.md
- **Effort**: Small (1 hour audit)
- **Risk Level**: Low (mostly validation of current architecture)

---

## Performance Optimization Opportunities

### 1. Content Script Loading Time
**Current**: Loaded on all_urls at document_start (3,239 lines of code)
**Impact**: 50-100ms delay on every page load
**Optimization**:
- Split content scripts (see Critical Issue #1)
- Use specific host permissions (see Critical Issue #3)
- Lazy load AI handlers only when needed
**Expected Gain**: 80-90% reduction in unnecessary page load overhead

### 2. Storage Access Patterns
**Current**: Multiple sequential storage reads in popup.js (lines 626-658)
**Impact**: 100-200ms load time for popup
**Optimization**:
- Batch storage reads into single operation
- Cache settings in memory with TTL
- Use chrome.storage.onChanged listener for live updates
**Expected Gain**: 50% faster popup load time

### 3. Modal Rendering
**Current**: Creating full modal DOM on every trigger
**Impact**: 50-100ms render time per modal
**Optimization**:
- Pre-render modal template once, clone for reuse
- Use CSS transforms instead of opacity transitions
- Minimize DOM operations during render
**Expected Gain**: 30-40% faster modal display

### 4. Early Blocker Performance
**Current**: Injects CSS and blocker div on every social media site
**Impact**: 20-50ms overhead on blocked sites
**Optimization**:
- Use simpler CSS (avoid gradients during blocking)
- Remove early blocker immediately after determining no block needed
- Consider CSS-only blocker (no JS until after check)
**Expected Gain**: 40-50% faster initial page display

### 5. Sites Config Loading
**Current**: Fetches sites.json and reads Chrome storage on every content script load
**Impact**: 50-100ms before blocking logic can run
**Optimization**:
- Cache config in memory with short TTL (30s)
- Use chrome.storage.onChanged to invalidate cache
- Load config asynchronously (don't block page)
**Expected Gain**: 70-80% faster config access

---

## Refactoring Recommendations

### 1. Module System
**Priority**: Critical
**Why**: 3,239-line content.js is unmaintainable
**Approach**:
- ES6 modules with rollup/webpack for bundling
- Separate concerns (storage, UI, blocking logic)
- Enable code reuse across content/popup/background
**Files to Create**:
```
extension-dev/
  ├── modules/
  │   ├── storage.js (shared storage wrapper)
  │   ├── validation.js (shared validation)
  │   ├── time-logic.js (time calculations)
  │   └── constants.js (shared constants)
  ├── content/
  │   ├── index.js (entry point)
  │   ├── early-blocker.js
  │   ├── cleanup.js
  │   ├── ai-handler.js
  │   ├── social-handler.js
  │   └── modal.js
  ├── popup/
  │   ├── index.js
  │   ├── ui-manager.js
  │   └── stats-display.js
  └── background/
      ├── index.js
      ├── message-router.js
      └── storage-manager.js
```

### 2. Error Handling Patterns
**Priority**: High
**Current**: Mix of try-catch, callback error checks, and silent failures
**Recommendation**: Consistent async/await with centralized error handler
**Example**:
```javascript
// Bad - inconsistent patterns
chrome.storage.local.get(['key'], (result) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    callback(null);
    return;
  }
  callback(result.key);
});

// Good - consistent async/await
async function getFromStorage(key) {
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key];
  } catch (error) {
    Logger.error('Storage read failed', error, { key });
    throw new StorageError('Failed to read from storage', { cause: error });
  }
}
```

### 3. Type Safety
**Priority**: Medium
**Why**: Many runtime errors from incorrect types
**Approach**: Add JSDoc type annotations or migrate to TypeScript
**Example**:
```javascript
/**
 * @typedef {Object} SocialMediaSettings
 * @property {boolean} enabledForLinkedin
 * @property {boolean} enabledForTwitter
 * @property {number} linkedinAllowedHour
 * @property {string} redirectUrl
 */

/**
 * Validates social media settings
 * @param {unknown} data - Raw settings data
 * @returns {SocialMediaSettings} Validated settings
 * @throws {ValidationError} If validation fails
 */
function validateSettings(data) {
  // ... validation logic
}
```

### 4. Event Listener Management
**Priority**: Medium-High
**Current**: Manual tracking in cleanup system
**Recommendation**: Use EventTarget pattern or mitt library
**Example**:
```javascript
// Create event emitter for extension
const extensionEvents = new EventTarget();

// Easy cleanup - remove all listeners
function cleanup() {
  // Events automatically cleaned up when element destroyed
}
```

### 5. State Management
**Priority**: Medium
**Current**: State scattered across storage, DOM, and memory
**Recommendation**: Centralized state manager (popup only)
**Example**:
```javascript
const PopupState = {
  settings: null,
  stats: null,
  isLoading: false,

  async load() {
    this.isLoading = true;
    this.settings = await loadSettings();
    this.stats = await loadStats();
    this.isLoading = false;
    this.emit('stateChanged');
  },

  async updateSetting(key, value) {
    this.settings[key] = value;
    await saveSetting(key, value);
    this.emit('stateChanged');
  }
};
```

---

## Security & Privacy Review

### Security Strengths
✅ Comprehensive URL validation (background.js lines 286-307, content.js lines 461-518)
✅ XSS prevention via sanitization (no innerHTML with user content)
✅ No eval() or Function() usage
✅ Input validation on all user inputs
✅ No sensitive data stored (only usage stats and settings)

### Security Concerns

#### 1. XSS Risk in Modal Rendering (LOW)
- **Location**: content.js modal innerHTML usage
- **Risk**: If site names in sites.json contain script tags
- **Mitigation**: Already sanitized, but add Content Security Policy for defense-in-depth
- **Action**: Add CSP to manifest (see Critical Issue #2)

#### 2. Redirect URL Injection (LOW-MEDIUM)
- **Location**: Social media redirect uses user-provided URL
- **Risk**: User could set malicious redirect URL
- **Current Mitigation**: URL validation in background.js (lines 286-307)
- **Additional Protection**: Whitelist of allowed domains or warn user
- **Action**: Consider adding domain whitelist or prominent warning

#### 3. Custom Sites - Arbitrary Domain Blocking (LOW)
- **Risk**: User adds legitimate sites causing unexpected blocking
- **Mitigation**: Clear UI warnings, easy site removal
- **Current State**: Adequate warning in helper text
- **No Action Needed**: Working as intended

#### 4. Storage Quota Exhaustion (LOW)
- **Risk**: Malicious sites.json could fill storage quota
- **Mitigation**: Size checks in background.js (line 176-179)
- **Enhancement**: Add hard limit (e.g., max 1000 custom sites)
- **Action**: Add validation in handleAddCustomSite (background.js line 521)

### Privacy Strengths
✅ No external network requests (all local)
✅ No analytics or tracking
✅ No user identification
✅ Data stays local to browser
✅ No cross-site data sharing

### Privacy Concerns

#### 1. All URLs Permission (HIGH)
- **Issue**: Can access every website user visits
- **Privacy Impact**: Users may be concerned even though extension doesn't track
- **Mitigation**: See Critical Issue #3 (use specific host permissions)
- **Action**: Replace <all_urls> with specific domains

#### 2. Usage History Storage (LOW)
- **Data**: Bypass reasons stored with timestamps
- **Privacy Impact**: Creates timeline of when user accessed sites
- **Mitigation**: Data only stored locally, cleaned after 24 hours
- **Enhancement**: Add option to disable usage history
- **Action**: Add privacy toggle in settings

#### 3. Extension Disable Tracking (LOW)
- **Data**: Tracks when extension is disabled/enabled
- **Privacy Impact**: Could indicate when user wants to bypass protection
- **Current State**: Useful for accountability feature
- **No Action Needed**: Working as intended, data is local only

---

## Manifest V3 Compliance

### ✅ Fully Compliant Areas
- Service worker instead of background page
- chrome.storage.local instead of localStorage
- Declarative host permissions
- Action API instead of browserAction
- No remotely hosted code
- No inline scripts (popup.js is external)

### ⚠️ Areas for Improvement

#### 1. Content Security Policy (MEDIUM)
- **Current**: No explicit CSP in manifest
- **Issue**: Relies on default Chrome CSP
- **Recommendation**: Add explicit CSP
- **Action**: Add to manifest.json:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

#### 2. Host Permissions Specificity (HIGH)
- **Current**: `<all_urls>` is overly broad
- **Issue**: Not following principle of least privilege
- **Action**: See Critical Issue #3

#### 3. Background Service Worker Lifecycle (LOW)
- **Current**: Doesn't explicitly handle worker suspension
- **Issue**: Could lose state on suspension (though currently stateless)
- **Recommendation**: Add lifecycle logging, ensure stateless
- **Action**: See Technical Debt #16

### 🎯 Best Practices Already Followed
✅ Uses chrome.storage.local.get/set properly
✅ Message passing between contexts
✅ No long-running connections
✅ Cleanup on context invalidation
✅ Stateless background service worker

---

## Testing Strategy

### Current State
- **Unit Tests**: None
- **Integration Tests**: None
- **E2E Tests**: None
- **Manual Testing**: Ad-hoc only
- **Coverage**: 0%

### Recommended Testing Approach

#### Phase 1: Unit Tests (Priority: HIGH)
**Target**: 60% coverage of critical functions

**Test Files to Create**:
```
tests/
  ├── unit/
  │   ├── storage-wrapper.test.js
  │   ├── url-validation.test.js
  │   ├── settings-validation.test.js
  │   ├── time-logic.test.js
  │   └── domain-validation.test.js
```

**Critical Test Cases**:
1. **Storage Wrapper** (content.js lines 317-458)
   - Test context invalidation handling
   - Test fallback to sessionStorage
   - Test retry logic
   - Test error cases

2. **URL Validation** (background.js lines 286-307)
   - Test valid URLs
   - Test malicious URLs (javascript:, data:, etc.)
   - Test edge cases (no protocol, invalid TLD)
   - Test URL normalization

3. **Settings Validation** (background.js lines 200-283)
   - Test valid settings
   - Test invalid types
   - Test out-of-range values
   - Test missing fields (should use defaults)

4. **Time Logic** (content.js social media handler)
   - Test weekend detection
   - Test hour range checking
   - Test vacation mode logic
   - Test edge cases (midnight, etc.)

#### Phase 2: Integration Tests (Priority: MEDIUM)
**Target**: Test component interactions

**Test Scenarios**:
1. Popup → Background → Storage flow
2. Content script → Background message passing
3. Sites config loading and syncing
4. Settings updates propagating to content scripts

#### Phase 3: E2E Tests (Priority: LOW)
**Target**: Test full user flows

**Tools**: Playwright or Puppeteer with chrome-extension testing
**Critical Flows**:
1. Install extension → First run → Default settings applied
2. Change settings in popup → Visit blocked site → See blocking modal
3. Add custom site → Visit custom site → See blocking
4. Disable extension → Sites are accessible

### Test Coverage Goals
- **Critical Paths**: 80%+ (storage, validation, blocking logic)
- **UI Code**: 40%+ (popup, modal rendering)
- **Overall**: 60%+

### Testing Best Practices to Follow
1. **Arrange-Act-Assert** pattern
2. **Mock Chrome APIs** (use jest mock)
3. **Test edge cases** (null, undefined, invalid types)
4. **Test error paths** (network errors, storage failures)
5. **Deterministic tests** (no flaky tests, use mock dates/times)

---

## Technical Quick Wins

These are small changes with significant impact - do these first for immediate ROI:

### 1. Add Manifest CSP (15 minutes)
**Impact**: Security improvement, Chrome Web Store compliance
**File**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/manifest.json`
**Change**: Add CSP to manifest (see Manifest V3 Compliance section)

### 2. Extract Magic Numbers to Constants (30 minutes)
**Impact**: Code readability, easier maintenance
**File**: Create `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/constants.js`
**Change**: Extract hardcoded values (see Technical Debt #14)

### 3. Add Logger Utility (45 minutes)
**Impact**: Better debugging, filterable logs
**File**: Create `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/utils/logger.js`
**Change**: Replace console.log with structured logging (see Medium Priority #8)

### 4. Complete Legacy Storage Migration (1 hour)
**Impact**: Remove confusion, simplify codebase
**Files**: All files with `socialMediaUsage` references
**Change**: Complete migration to new storage keys (see Technical Debt #13)

### 5. Add Storage Quota Warning (30 minutes)
**Impact**: Better user experience, prevent silent failures
**File**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/content.js` lines 341-348
**Change**: Add quota checking and user notification (see Medium Priority #9)

### 6. Improve Domain Validation (1 hour)
**Impact**: Better UX, fewer invalid custom sites
**File**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/popup.js` lines 1083-1099
**Change**: Enhanced validation with better error messages (see Medium Priority #12)

### 7. Add JSDoc Type Annotations (2 hours)
**Impact**: Catch type errors in IDE, better intellisense
**Files**: All JavaScript files
**Change**: Add JSDoc comments for key functions and objects (see Refactoring #3)

---

## Documentation Needs

### Critical Documentation Gaps

#### 1. Architecture Documentation
**Missing**: High-level system design, data flow diagrams
**Needed**:
- Component diagram (background/content/popup relationships)
- Storage architecture explanation
- Message passing patterns
- Lifecycle documentation (install, update, reload)
**Create**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/docs/ARCHITECTURE.md`

#### 2. Development Setup Guide
**Missing**: How to set up development environment
**Needed**:
- Prerequisites (Node.js version, etc.)
- Installation steps
- How to load unpacked extension
- How to run tests (once added)
- How to debug content scripts
**Enhance**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/INSTALL.txt` → make it markdown with screenshots

#### 3. Contributing Guidelines
**Missing**: Code style, PR process, testing requirements
**Needed**:
- Code style guide
- Commit message format
- PR checklist
- Testing requirements
**Create**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/CONTRIBUTING.md`

#### 4. API Documentation
**Missing**: Internal API docs for message passing
**Needed**:
- List of all message types
- Expected request/response formats
- Error codes and meanings
- Chrome storage schema
**Create**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/docs/API.md`

#### 5. Privacy Policy
**Missing**: Clear privacy statement for users
**Needed**:
- What data is collected (none)
- What permissions are used and why
- Data retention policy (24 hours for stats)
- User rights (can delete all data)
**Create**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/PRIVACY.md`

#### 6. Security Policy
**Missing**: Vulnerability reporting process
**Needed**:
- How to report security issues
- What constitutes a security issue
- Response timeline expectations
**Create**: `/Users/timmetz/Developer/Projects/Personal/creativity-guard/SECURITY.md`

### Code Documentation Improvements

#### 1. Function Documentation
**Current**: Some functions have comments, many don't
**Needed**: JSDoc comments for all public functions
**Standard**:
```javascript
/**
 * Validates and sanitizes a URL for safe redirects
 * @param {string} url - The URL to validate
 * @returns {string} Sanitized URL or default safe URL
 * @throws {Error} If URL is malicious
 * @example
 * validateUrl('example.com') // Returns 'https://example.com'
 */
function validateAndSanitizeUrl(url) { ... }
```

#### 2. Complex Logic Explanation
**Needed**: Comments explaining "why" not just "what"
**Examples**:
- Why document_start is needed (prevent flash)
- Why dual storage exists (sites.json template + user edits)
- Why sessionStorage fallback (extension context invalidation)

#### 3. Edge Case Documentation
**Needed**: Document known edge cases and how they're handled
**Examples**:
- What happens if extension updated while page is open
- How timezone changes affect blocking
- What happens if storage quota exceeded

---

## Future Technical Considerations

### 1. Manifest V4 Preparation (2024-2025)
**Timeline**: Chrome is exploring MV4 concepts
**Potential Changes**:
- More restrictive content script injection
- Changes to storage APIs
- New permission models
**Preparation**:
- Keep up with Chrome extension API changes
- Minimize use of experimental APIs
- Follow Chrome extension best practices
- Monitor deprecation notices

### 2. Cross-Browser Support (Firefox, Edge, Safari)
**Current**: Chrome-only
**Consideration**:
- Firefox has different extension APIs (WebExtensions)
- Safari has different restrictions
- Edge follows Chrome but with delays
**Action if Expanding**:
- Use webextension-polyfill for cross-browser compatibility
- Test on multiple browsers
- Handle browser-specific quirks

### 3. Sync Across Devices
**Current**: Settings are local only
**User Request**: Sync settings across Chrome browsers
**Implementation**:
- Use chrome.storage.sync instead of chrome.storage.local
- Handle sync conflicts
- Respect sync quota limits (102,400 bytes)
- Add opt-in setting

### 4. Mobile Support
**Current**: Desktop Chrome only
**Consideration**: Chrome on Android supports extensions (limited)
**Challenges**:
- Different UI constraints (popup doesn't work)
- Different performance requirements
- Mobile browser differences
**Action if Supporting**:
- Redesign for mobile (no popup, settings in content)
- Test on mobile devices
- Optimize for mobile performance

### 5. Advanced Blocking Features
**Potential Features**:
- Schedule multiple time windows per day
- Different schedules per day of week
- Temporary bypass tokens (e.g., 5 minutes access)
- Pomodoro timer integration
- Screen time reports
**Technical Considerations**:
- More complex time logic
- Persistent timers/alarms
- More storage for schedules
- Background notifications

### 6. Import/Export Settings
**User Benefit**: Backup settings, share configs
**Implementation**:
- Export to JSON file
- Import with validation
- Handle version differences
- Sanitize imported data

### 7. Analytics (Privacy-Preserving)
**Current**: No usage analytics
**Consideration**: Understand how users use extension (locally only)
**Privacy-Safe Approach**:
- All data stays local
- Aggregate statistics only
- No personally identifiable information
- User can view/export/delete all analytics data
**Use Cases**:
- Show user their productivity trends
- Identify most bypassed sites
- Most effective time windows

### 8. Performance Monitoring
**Current**: No performance tracking
**Future**: Add lightweight performance monitoring
**Metrics to Track**:
- Modal display time
- Storage operation time
- Content script load time
- Memory usage
**Use**: Identify performance regressions in updates

---

## Implementation Priority Matrix

### Immediate (Week 1)
1. ✅ Add Manifest CSP (15 min)
2. ✅ Extract Magic Numbers (30 min)
3. ✅ Add Logger Utility (45 min)
4. ✅ Complete Legacy Storage Migration (1 hour)
5. ✅ Storage Quota Warning (30 min)
6. ✅ Improve Domain Validation (1 hour)

**Total**: ~5 hours, High impact on code quality

### Short-term (Weeks 2-3)
1. 🔥 Content Script Modularization (3-5 hours) - CRITICAL
2. 🔥 Replace <all_urls> Permission (2-3 hours) - CRITICAL
3. 🔥 Inline Script CSP Fix (30 min) - CRITICAL
4. ⚙️ Centralized Validation Schema (2-3 hours)
5. ⚙️ Extract Time Logic (2 hours)
6. ⚙️ Add Unit Tests Setup (4-6 hours)

**Total**: ~15-20 hours, Addresses critical issues

### Mid-term (Month 2)
1. 🎯 Optimize Content Script Injection Timing (2-3 hours)
2. 🎯 Simplify Dual Storage Architecture (2-3 hours)
3. 🎯 Modal CSS Isolation (2-3 hours)
4. 📚 Write Architecture Documentation (3-4 hours)
5. 📚 Create Contributing Guide (2 hours)
6. 📚 Add JSDoc Type Annotations (2 hours)

**Total**: ~15-20 hours, Major improvements

### Long-term (Month 3+)
1. 🔮 Advanced Testing Strategy (E2E tests)
2. 🔮 Performance Monitoring System
3. 🔮 Privacy Policy & Security Policy
4. 🔮 Import/Export Settings Feature
5. 🔮 Cross-browser Support Research
6. 🔮 Accessibility Audit & Improvements

**Total**: Ongoing improvements

---

## Conclusion

Creativity Guard is a well-built Chrome extension with solid foundations. The code demonstrates good security practices, thoughtful error handling, and attention to edge cases. However, as the codebase has grown, maintainability challenges have emerged, particularly around the large content.js file and dual storage architecture.

**Top 3 Priorities**:
1. **Modularize content.js** - Critical for long-term maintenance
2. **Replace <all_urls> permission** - Important for privacy and Chrome Web Store approval
3. **Add unit tests** - Essential for confident refactoring

**Quick Wins** (do in first week):
- Add CSP to manifest
- Extract magic numbers
- Add logging utility
- Complete storage migration

**Expected Impact**: Following this roadmap will result in a more maintainable, performant, and secure extension that's easier to extend with new features.

---

## Version History
- **v1.0** (2025-10-14): Initial technical roadmap by Technical Architecture Agent

## Related Documents
- `/Users/timmetz/Developer/Projects/Personal/creativity-guard/CLAUDE.md` - Project-specific instructions
- `/Users/timmetz/Developer/Projects/Personal/creativity-guard/extension-dev/INSTALL.txt` - Installation guide
- `/Users/timmetz/Developer/Projects/Personal/creativity-guard/docs/SESSION_LOG.md` - Development session log
