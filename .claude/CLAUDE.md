# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Creativity Guard is a Chrome extension (Manifest V3) that encourages users to think independently before using AI tools. It intercepts interactions with AI chat interfaces and social media platforms, showing reminders and enforcing time-based restrictions.

## Project Structure

### Directory Organization
- **extension-dev/**: Active development folder - ALL code changes should be made here
  - Contains: manifest.json, content.js, background.js, popup.html, popup.js, sites.json, icons/, INSTALL.txt
- **extension/**: Production/distribution folder - Only updated during release process
  - Do NOT edit files here directly - use the release agent instead
- **agents/**: Automation agents for various tasks
  - release-agent.md: Handles copying from extension-dev to extension and creating release zips
- **docs/zips/**: Archive of all released versions with timestamps (YYYYMMDD-HHMM format)

### Development Workflow
1. **All development work happens in `extension-dev/`** - this is the active working directory
2. To test changes: Load `extension-dev/` folder in chrome://extensions/ as unpacked extension
3. When ready to release: Use the release agent at `/agents/release-agent.md`
4. Released versions are automatically saved to `docs/zips/` with timestamp

## Key Architecture

### Extension Components (in extension-dev/)
- **content.js**: Main content script injected into AI and social media sites. Handles modal display, input detection, and blocking logic. Uses a safe storage wrapper to handle Chrome API edge cases.
- **background.js**: Service worker for message passing between content scripts and extension storage
- **popup.js/popup.html**: Extension popup UI with three tabs - Social Media (default), AI Stats (Experimental), Extension tracking
- **sites.json**: Configuration file for blocked sites, time settings, and feature toggles

### Storage Structure
The extension uses Chrome's local storage with these key structures:
- `creativityGuardStats`: Tracks AI usage (thoughtFirstCount, bypassCount, aiUsageCount)
- `creativityGuardSessions`: Session tracking for new conversation detection
- `creativityGuardSocialMedia`: Social media blocking settings (enabled flags, allowed hours, redirect URL)
- `socialMediaSettings`: Legacy settings (being migrated to creativityGuardSocialMedia)

### Supported Sites
- AI Tools: ChatGPT, Claude, Gemini, Bard, Poe, TypingMind, Lex
- Social Media: LinkedIn, Twitter/X, Facebook

## Development Commands

Since this is a Chrome extension without a build process:
- **Test changes**: Reload the extension in `chrome://extensions/` after modifying files in `extension-dev/`
- **Debug**: Use Chrome DevTools on the target page for content script debugging
- **View logs**: Check the service worker logs in chrome://extensions/ for background.js debugging
- **Release new version**: Use the release agent: `Tell Claude to run the release agent`

## Important Implementation Details

### Storage Wrapper Pattern
The content script uses a custom storage wrapper (lines 17-113 in content.js) with retry logic to handle Chrome API disconnection issues, particularly important for Claude.ai where the extension context can become invalid.

### Modal Display Logic
- AI sites: Shows reminder modal on input focus if it's a new conversation
- Social media: Shows blocking modal outside allowed hours with countdown timer
- Vacation mode: Completely blocks social media access when enabled

### Session Detection
Uses URL patterns and session storage to detect new AI conversations vs continuing existing ones, preventing repetitive popups in the same conversation.